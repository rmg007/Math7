-- Security Logs Table
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    app_id UUID REFERENCES public.apps(app_id),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Known Issues Table (for Knowledge Base)
CREATE TABLE IF NOT EXISTS public.known_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    error_message TEXT,
    root_cause TEXT,
    resolution TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- open, closed, recurring
    severity TEXT NOT NULL DEFAULT 'medium',
    sentry_link TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security logs"
    ON public.security_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- RLS for known_issues
ALTER TABLE public.known_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view known issues"
    ON public.known_issues
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage known issues"
    ON public.known_issues
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- RPC for logging security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_app_id UUID DEFAULT NULL,
    p_location TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_logs (
        user_id,
        app_id,
        event_type,
        severity,
        metadata
    ) VALUES (
        auth.uid(),
        p_app_id,
        p_event_type,
        p_severity,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
