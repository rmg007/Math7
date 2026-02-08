-- Migration: AI Governance & Enterprise Quality (Phase 12)
-- Description: Critical governance tables for quotas, validation, and multi-tier approval.

-- 1. Tenant Quotas Table (Token Bucket Management)
CREATE TABLE IF NOT EXISTS public.tenant_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE NOT NULL,
    
    monthly_token_limit BIGINT NOT NULL DEFAULT 1000000, -- 1M token default limit
    current_token_usage BIGINT NOT NULL DEFAULT 0,
    last_reset_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_throttled BOOLEAN DEFAULT FALSE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(app_id)
);

-- RLS: Only admins can manage quotas
ALTER TABLE public.tenant_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tenant quotas" ON public.tenant_quotas
    FOR ALL USING (is_admin());

-- 2. Content Validation Rules
CREATE TABLE IF NOT EXISTS public.content_validation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE, -- Optional: global vs app-specific
    
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('grade_match', 'accuracy', 'safety', 'formatting', 'oracle_rag')),
    params JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.content_validation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage validation rules" ON public.content_validation_rules
    FOR ALL USING (is_admin());

-- 3. Approval Workflows (Extended Queue)
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.ai_generation_sessions(id) ON DELETE CASCADE NOT NULL,
    
    stage TEXT NOT NULL CHECK (stage IN ('AI_VAL', 'PEER_REVIEW', 'SME_FINAL')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'rejected')),
    
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    comments TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL, -- To store validation scores/responses
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_approval_session_id ON public.approval_workflows(session_id);
CREATE INDEX idx_approval_status ON public.approval_workflows(status);

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage approval workflows" ON public.approval_workflows
    FOR ALL USING (is_admin());

-- 4. RPC: Atomic Token Consumption
CREATE OR REPLACE FUNCTION public.consume_tenant_tokens(
    p_app_id UUID,
    p_token_count INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_quota RECORD;
    v_success BOOLEAN := FALSE;
    v_message TEXT;
BEGIN
    -- 1. Check if user is admin
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
    END IF;

    -- 2. Fetch and Lock quota row for update
    SELECT * INTO v_quota 
    FROM public.tenant_quotas 
    WHERE app_id = p_app_id
    FOR UPDATE;

    -- 3. If no quota exists, create one with defaults
    IF NOT FOUND THEN
        INSERT INTO public.tenant_quotas (app_id)
        VALUES (p_app_id)
        RETURNING * INTO v_quota;
    END IF;

    -- 4. Check limit
    IF v_quota.is_throttled THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tenant is currently throttled');
    END IF;

    IF v_quota.current_token_usage + p_token_count > v_quota.monthly_token_limit THEN
        RETURN jsonb_build_object('success', false, 'message', 'Monthly token quota exceeded');
    END IF;

    -- 5. Atomic Update
    UPDATE public.tenant_quotas
    SET 
        current_token_usage = current_token_usage + p_token_count,
        updated_at = NOW()
    WHERE app_id = p_app_id;

    RETURN jsonb_build_object(
        'success', true, 
        'new_usage', v_quota.current_token_usage + p_token_count,
        'remaining', v_quota.monthly_token_limit - (v_quota.current_token_usage + p_token_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Triggers for updated_at
CREATE TRIGGER update_tenant_quotas_updated_at 
    BEFORE UPDATE ON public.tenant_quotas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_validation_rules_updated_at 
    BEFORE UPDATE ON public.content_validation_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at 
    BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
