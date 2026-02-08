-- 20260202000004_create_security_monitoring.sql

-- 1. Create the Security Logs Table (Partitioning candidate, but kept simple for now)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event Classification
    event_type TEXT NOT NULL, -- e.g., 'login', 'logout', 'export_data', 'failed_login', 'schema_change', 'sensitive_view'
    severity TEXT CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')) DEFAULT 'info',
    
    -- Context
    ip_address TEXT,
    location TEXT,       -- 'City, Country' (filled by client or edge function)
    user_agent TEXT,
    device_info JSONB,   -- { "device": "iPhone", "os": "iOS 16" }
    
    -- Analysis
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Indexes for Dashboard Performance
CREATE INDEX idx_security_logs_app_id ON public.security_logs(app_id);
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_created_at_brin ON public.security_logs USING brin(created_at); -- Efficient for time-series

-- 3. RLS Policies
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Admins: View all logs (optionally filtered by their app if we had multi-tenant admins, but super admins see all)
CREATE POLICY "Admins can view all security logs"
ON public.security_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Users: View their own logs (for "Recent Activity" user dashboard)
CREATE POLICY "Users can view own logs"
ON public.security_logs FOR SELECT
USING (auth.uid() = user_id);

-- System: Insert only (via functions) or Admins
CREATE POLICY "Admins can insert security logs"
ON public.security_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 4. RPC Function for Secure Logging (Callable from Client)
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_app_id UUID DEFAULT NULL,
    p_location TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to ensure log capture
AS $$
DECLARE
    v_log_id UUID;
    v_ip TEXT;
    v_ua TEXT;
    v_risk_score INTEGER := 0;
BEGIN
    -- standard headers extraction if available
    BEGIN
        v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
        v_ua := current_setting('request.headers', true)::json->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        v_ip := NULL;
        v_ua := NULL;
    END;

    -- Basic Risk Calculation (Heuristic Skeleton)
    -- Example: High severity = Higher risk score
    IF p_severity = 'critical' THEN v_risk_score := 90;
    ELSIF p_severity = 'high' THEN v_risk_score := 75;
    ELSIF p_severity = 'medium' THEN v_risk_score := 50;
    ELSE v_risk_score := 0;
    END IF;

    -- Insert Log
    INSERT INTO public.security_logs (
        user_id,
        app_id,
        event_type,
        severity,
        risk_score,
        metadata,
        ip_address,
        user_agent,
        location
    ) VALUES (
        auth.uid(),
        p_app_id,
        p_event_type,
        p_severity,
        v_risk_score,
        p_metadata,
        v_ip,
        v_ua,
        p_location
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 5. Retention Management Function
-- This function deletes logs older than 90 days.
-- Intended to be called by a scheduled job (pg_cron).
CREATE OR REPLACE FUNCTION public.cleanup_security_logs(retention_days INT DEFAULT 90)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.security_logs
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
END;
$$;

-- 6. Comment on Scheduling (Manual setup required for pg_cron)
-- SELECT cron.schedule('0 2 * * *', $$SELECT public.cleanup_security_logs(90)$$);
