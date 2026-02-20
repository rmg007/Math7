-- ============================================================================
-- PROJECT HADES: PHASE 2 REMEDIATION (TENANT ISOLATION & SECURITY HARDENING)
-- Date: 2026-02-16
-- Description: Harden RLS policies against cross-tenant leaks.
--              Adds missing app_id columns and fixes global admin bypasses.
-- ============================================================================

-- 1. ADD MISSING APP_ID COLUMNS FOR TENANT ISOLATION
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
    -- ai_generation_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_generation_sessions' AND column_name = 'app_id') THEN
        ALTER TABLE public.ai_generation_sessions ADD COLUMN app_id UUID REFERENCES public.apps(app_id);
    END IF;

    -- Update Backfill for sessions
    UPDATE public.ai_generation_sessions s
    SET app_id = p.app_id
    FROM public.profiles p
    WHERE s.created_by = p.id AND s.app_id IS NULL;

    -- invitation_codes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitation_codes' AND column_name = 'app_id') THEN
        ALTER TABLE public.invitation_codes ADD COLUMN app_id UUID REFERENCES public.apps(app_id);
    END IF;

    -- Update Backfill for codes
    UPDATE public.invitation_codes i
    SET app_id = p.app_id
    FROM public.profiles p
    WHERE i.created_by = p.id AND i.app_id IS NULL;

    -- known_issues
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'known_issues' AND column_name = 'app_id') THEN
        ALTER TABLE public.known_issues ADD COLUMN app_id UUID REFERENCES public.apps(app_id);
    END IF;

    -- Update Backfill for issues
    UPDATE public.known_issues k
    SET app_id = p.app_id
    FROM public.profiles p
    WHERE k.created_by = p.id AND k.app_id IS NULL;
END $$;

-- 2. HARDEN JWT HELPER FUNCTIONS (TENANT-AWARE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public', 'auth' AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_is_tenant_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public', 'auth' AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin', 'admin')
      AND p.app_id = public.current_app_id()
    ),
    false
  );
$$;

-- Backward compatibility wrapper
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT public.jwt_is_tenant_admin();
$$;

-- 3. APPLY TENANT-AWARE RLS POLICIES (CROSS-TENANT LOCKDOWN)
-- ----------------------------------------------------------------------------

-- ERROR LOGS
DROP POLICY IF EXISTS "Admins can view error logs" ON public.error_logs;
CREATE POLICY "error_logs_tenant_isolation" ON public.error_logs
  FOR SELECT TO authenticated
  USING (
    (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- SECURITY LOGS
DROP POLICY IF EXISTS "Admins can view all security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_logs;
CREATE POLICY "security_logs_tenant_isolation" ON public.security_logs
  FOR SELECT TO authenticated
  USING (
    (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- AI GENERATION SESSIONS
DROP POLICY IF EXISTS "Admins can manage generation sessions" ON public.ai_generation_sessions;
CREATE POLICY "ai_generation_sessions_tenant_isolation" ON public.ai_generation_sessions
  FOR ALL TO authenticated
  USING (
    (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- INVITATION CODES
DROP POLICY IF EXISTS "invitation_codes_admin" ON public.invitation_codes;
CREATE POLICY "invitation_codes_tenant_isolation" ON public.invitation_codes
  FOR ALL TO authenticated
  USING (
    (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- KNOWN ISSUES
DROP POLICY IF EXISTS "Admins can manage known issues" ON public.known_issues;
CREATE POLICY "known_issues_tenant_isolation" ON public.known_issues
  FOR ALL TO authenticated
  USING (
    (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- TENANT QUOTAS
DROP POLICY IF EXISTS "Admins can manage tenant quotas" ON public.tenant_quotas;
CREATE POLICY "tenant_quotas_tenant_isolation" ON public.tenant_quotas
  FOR ALL TO authenticated
  USING (
    (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- CONTENT VALIDATION RULES
DROP POLICY IF EXISTS "Admins can manage validation rules" ON public.content_validation_rules;
CREATE POLICY "content_validation_rules_tenant_isolation" ON public.content_validation_rules
  FOR ALL TO authenticated
  USING (
    (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- APPROVAL WORKFLOWS
DROP POLICY IF EXISTS "Admins can manage approval workflows" ON public.approval_workflows;
CREATE POLICY "approval_workflows_tenant_isolation" ON public.approval_workflows
  FOR ALL TO authenticated
  USING (
    (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- PROFILES
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON public.profiles;
CREATE POLICY "profiles_tenant_isolation" ON public.profiles
  FOR ALL TO authenticated
  USING (
    id = auth.uid()
    OR (public.jwt_is_tenant_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- 4. CLEANUP DEPRECATED GLOBAL FUNCTIONS
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_tenant_admin();
