-- ============================================
-- ERROR TRACKING SYSTEM (Zero-Cost Alternative to Sentry)
-- ============================================

-- Error Logs Table (Raw crash data)
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    user_id UUID REFERENCES auth.users(id),
    app_id UUID REFERENCES public.apps(app_id),
    platform TEXT NOT NULL CHECK (platform IN ('web', 'android', 'ios', 'windows', 'macos', 'linux')),
    app_version TEXT,
    
    -- Error Details
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    
    -- Environment
    url TEXT,
    user_agent TEXT,
    extra_context JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'seen', 'ignored', 'resolved', 'promoted')),
    promoted_to_issue_id UUID REFERENCES public.known_issues(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_error_logs_status ON public.error_logs(status);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);

-- RLS for error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view error logs
CREATE POLICY "Admins can view all error logs"
    ON public.error_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role)::text IN ('admin', 'super_admin')
        )
    );

-- Anyone can insert (for capturing errors from any user)
CREATE POLICY "Anyone can insert error logs"
    ON public.error_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow anonymous inserts for unauthenticated crashes
CREATE POLICY "Anonymous can insert error logs"
    ON public.error_logs
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- RPC to safely log errors (handles auth gracefully)
CREATE OR REPLACE FUNCTION public.log_error(
    p_platform TEXT,
    p_error_type TEXT,
    p_error_message TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_app_version TEXT DEFAULT NULL,
    p_app_id UUID DEFAULT NULL,
    p_extra_context JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_error_id UUID;
BEGIN
    INSERT INTO public.error_logs (
        user_id,
        app_id,
        platform,
        app_version,
        error_type,
        error_message,
        stack_trace,
        url,
        user_agent,
        extra_context
    ) VALUES (
        auth.uid(),
        p_app_id,
        p_platform,
        p_app_version,
        p_error_type,
        p_error_message,
        p_stack_trace,
        p_url,
        p_user_agent,
        p_extra_context
    )
    RETURNING id INTO v_error_id;
    
    RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to promote error to known issue
CREATE OR REPLACE FUNCTION public.promote_error_to_issue(
    p_error_id UUID,
    p_title TEXT,
    p_root_cause TEXT DEFAULT NULL,
    p_resolution TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_error RECORD;
    v_issue_id UUID;
BEGIN
    -- Get the error
    SELECT * INTO v_error FROM public.error_logs WHERE id = p_error_id;
    
    IF v_error IS NULL THEN
        RAISE EXCEPTION 'Error not found';
    END IF;
    
    -- Create the known issue
    INSERT INTO public.known_issues (
        title,
        description,
        error_message,
        root_cause,
        resolution,
        status,
        severity,
        created_by
    ) VALUES (
        p_title,
        'Auto-generated from error log',
        v_error.error_message,
        p_root_cause,
        p_resolution,
        'open',
        'medium',
        auth.uid()
    )
    RETURNING id INTO v_issue_id;
    
    -- Update the error log
    UPDATE public.error_logs
    SET status = 'promoted', promoted_to_issue_id = v_issue_id
    WHERE id = p_error_id;
    
    RETURN v_issue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_error TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_error TO anon;
GRANT EXECUTE ON FUNCTION public.promote_error_to_issue TO authenticated;
