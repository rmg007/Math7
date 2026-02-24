-- ============================================================================
-- OBSERVABILITY & MAINTENANCE (QuesterixDB-v2 Alignment)
-- Date: 2026-02-14
-- Author: Antigravity
-- ============================================================================

-- 1. ERROR LOGS TABLE
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE,
    
    platform TEXT NOT NULL, -- 'web', 'android', 'ios', 'windows', 'macos', 'linux'
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    url TEXT,
    user_agent TEXT,
    app_version TEXT,
    extra_context JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored', 'promoted')),
    alert_sent BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_error_logs_status ON public.error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_app_id ON public.error_logs(app_id);

-- 2. SECURITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    event_type TEXT NOT NULL, -- 'login', 'logout', 'failed_login', 'unauthorized_access'
    severity TEXT CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')) DEFAULT 'info',
    
    ip_address TEXT,
    location TEXT,
    user_agent TEXT,
    device_info JSONB,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_security_logs_app_id ON public.security_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- 3. KNOWN ISSUES TABLE
CREATE TABLE IF NOT EXISTS public.known_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    root_cause TEXT,
    resolution TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'wontfix')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. LOG ERROR RPC
CREATE OR REPLACE FUNCTION public.log_error(
    p_platform TEXT,
    p_error_type TEXT,
    p_error_message TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_app_version TEXT DEFAULT NULL,
    p_extra_context JSONB DEFAULT '{}'::jsonb,
    p_app_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_error_id UUID;
BEGIN
    INSERT INTO public.error_logs (
        user_id,
        app_id,
        platform,
        error_type,
        error_message,
        stack_trace,
        url,
        user_agent,
        app_version,
        extra_context
    ) VALUES (
        auth.uid(),
        COALESCE(p_app_id, (SELECT app_id FROM public.profiles WHERE id = auth.uid())),
        p_platform,
        p_error_type,
        p_error_message,
        p_stack_trace,
        p_url,
        p_user_agent,
        p_app_version,
        p_extra_context
    ) RETURNING id INTO v_error_id;

    RETURN v_error_id;
END;
$$;

-- 5. LOG SECURITY EVENT RPC
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_app_id UUID DEFAULT NULL,
    p_location TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
    v_ip TEXT;
    v_ua TEXT;
BEGIN
    -- Extract IP and UA from headers if possible
    BEGIN
        v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
        v_ua := current_setting('request.headers', true)::json->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        v_ip := NULL;
        v_ua := NULL;
    END;

    INSERT INTO public.security_logs (
        user_id,
        app_id,
        event_type,
        severity,
        metadata,
        ip_address,
        user_agent,
        location
    ) VALUES (
        auth.uid(),
        COALESCE(p_app_id, (SELECT app_id FROM public.profiles WHERE id = auth.uid())),
        p_event_type,
        p_severity,
        p_metadata,
        v_ip,
        v_ua,
        p_location
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 6. MAINTENANCE: PRUNING FUNCTIONS
CREATE OR REPLACE FUNCTION public.prune_old_error_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.error_logs
    WHERE created_at < now() - interval '30 days'
    AND status != 'promoted';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_security_logs(retention_days INT DEFAULT 90)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.security_logs
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 7. CRITICAL ALERT TRIGGER
CREATE OR REPLACE FUNCTION public.trigger_critical_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.error_type ILIKE '%Critical%' OR (COALESCE(NEW.extra_context, '{}'::jsonb)->>'severity') = 'critical' THEN
        NEW.extra_context = jsonb_set(COALESCE(NEW.extra_context, '{}'::jsonb), '{alert_needed}', '"true"');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_critical_error ON public.error_logs;
CREATE TRIGGER on_critical_error
    BEFORE INSERT ON public.error_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_critical_alert();

-- 8. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.log_error(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, JSONB, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.prune_old_error_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_security_logs(INT) TO authenticated;

-- RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and manage error logs"
ON public.error_logs FOR ALL
TO authenticated
USING (jwt_is_admin() OR jwt_is_super_admin());

CREATE POLICY "Users can insert their own error logs"
ON public.error_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view and manage security logs"
ON public.security_logs FOR ALL
TO authenticated
USING (jwt_is_admin() OR jwt_is_super_admin());

CREATE POLICY "Admins can view and manage known issues"
ON public.known_issues FOR ALL
TO authenticated
USING (jwt_is_admin() OR jwt_is_super_admin());

CREATE POLICY "Everyone can view resolved known issues"
ON public.known_issues FOR SELECT
TO authenticated
USING (status = 'resolved');
