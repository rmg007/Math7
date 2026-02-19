-- ============================================================================
-- SECURITY REMEDIATION: Fix critical RLS gaps and permissive policies
-- Date: 2026-02-19
-- Target Project: QuesterixDB-v2
-- Findings: Supabase Security Advisor (Feb 15)
-- ============================================================================

-- 1. Fix sync_meta (CRITICAL: RLS was missing/disabled)
-- ----------------------------------------------------------------------------
ALTER TABLE public.sync_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_meta_read_all" ON public.sync_meta;
CREATE POLICY "sync_meta_read_all" ON public.sync_meta
  FOR SELECT TO authenticated
  USING (true); -- Authenticated users can read sync metadata

-- 2. Fix invitation_codes (HIGH: Unauthorized read access)
-- ----------------------------------------------------------------------------
-- Anonymous users should use validate_invitation_code() RPC, not direct SELECT
DROP POLICY IF EXISTS "invitation_codes_check" ON public.invitation_codes;

-- 3. Harden apps access (Informational finding remediation)
-- ----------------------------------------------------------------------------
-- Ensure unauthenticated access is restricted to essential columns 
DROP POLICY IF EXISTS "apps_public_read_config" ON public.apps;
CREATE POLICY "apps_public_read_config" ON public.apps
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- 4. Audit generation_audit_log
-- ----------------------------------------------------------------------------
-- Ensure it has RLS enabled and a policy (Fixing potential gap)
ALTER TABLE public.generation_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.generation_audit_log;
CREATE POLICY "generation_audit_log_admin_all" ON public.generation_audit_log
  FOR ALL TO authenticated
  USING (public.jwt_is_super_admin() OR public.jwt_is_tenant_admin());

-- 5. Fix security_events (Old table remediation)
-- ----------------------------------------------------------------------------
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "security_events_admin_all" ON public.security_events;
CREATE POLICY "security_events_admin_all" ON public.security_events
  FOR ALL TO authenticated
  USING (public.jwt_is_super_admin() OR public.jwt_is_tenant_admin());

-- 6. SECURITY DEFINER SEARCH_PATH HARDENING (Critical Vulnerability Fix)
-- ----------------------------------------------------------------------------
-- Fixes search_path for all identified SECURITY DEFINER functions to prevent
-- search_path hijacking attacks.

-- From observability_and_maintenance.sql
ALTER FUNCTION public.log_error SET search_path = public, auth;
ALTER FUNCTION public.log_security_event SET search_path = public, auth;
ALTER FUNCTION public.prune_old_error_logs SET search_path = public;
ALTER FUNCTION public.cleanup_security_logs SET search_path = public;

-- From reconcile_schema_gap.sql
ALTER FUNCTION public.generate_invitation_code SET search_path = public, auth;
ALTER FUNCTION public.deactivate_invitation_code SET search_path = public, auth;
ALTER FUNCTION public.validate_invitation_code SET search_path = public;
ALTER FUNCTION public.deactivate_own_account SET search_path = public, auth;
ALTER FUNCTION public.delete_own_account SET search_path = public, auth;
ALTER FUNCTION public.import_questions_bulk SET search_path = public, auth;
ALTER FUNCTION public.promote_error_to_issue SET search_path = public;

-- From ai_governance.sql
ALTER FUNCTION public.consume_tenant_tokens SET search_path = public, auth;

-- From ai_content_generation.sql
ALTER FUNCTION public.mark_session_imported SET search_path = public, auth;

-- From validate_and_use_invitation_code.sql
ALTER FUNCTION public.validate_and_use_invitation_code SET search_path = public;

-- From automate_app_domains.sql
ALTER FUNCTION public.automate_landing_page_setup SET search_path = public, auth;

-- From current_schema helpers (ensure they are all covered)
ALTER FUNCTION public.current_app_id SET search_path = public, auth;
ALTER FUNCTION public.is_tenant_admin SET search_path = public, auth;
ALTER FUNCTION public.jwt_is_tenant_admin SET search_path = public, auth;

-- Extra hardening for any missed ones found in archive
DO $$ 
DECLARE 
  func_name RECORD;
BEGIN
  FOR func_name IN 
    SELECT n.nspname as schema, p.proname as name
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND p.prosecdef = true
  LOOP
    EXECUTE 'ALTER FUNCTION public.' || quote_ident(func_name.name) || '(' || 
            pg_get_function_identity_arguments( 
              (SELECT oid FROM pg_proc WHERE proname = func_name.name AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') LIMIT 1)
            ) || ') SET search_path = public, auth';
  END LOOP;
END $$;
