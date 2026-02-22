-- ============================================================================
-- SECURITY HARDENING: Fix search_path vulnerabilities + RLS gaps
-- Date: 2026-02-16
-- Source: Supabase Security Advisor findings
-- ============================================================================

-- 1. Enable RLS on app_landing_pages (ERROR-level finding)
ALTER TABLE public.app_landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_pages_public_read" ON public.app_landing_pages
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "landing_pages_admin_insert" ON public.app_landing_pages
  FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_admin() OR public.jwt_is_super_admin());
CREATE POLICY "landing_pages_admin_update" ON public.app_landing_pages
  FOR UPDATE TO authenticated
  USING (public.jwt_is_admin() OR public.jwt_is_super_admin());
CREATE POLICY "landing_pages_admin_delete" ON public.app_landing_pages
  FOR DELETE TO authenticated
  USING (public.jwt_is_admin() OR public.jwt_is_super_admin());

-- 2. Fix search_path on all flagged functions
ALTER FUNCTION public.log_security_event(text, text, jsonb, uuid, text) SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.jwt_is_admin() SET search_path = '';
ALTER FUNCTION public.jwt_is_mentor() SET search_path = '';
ALTER FUNCTION public.jwt_is_super_admin() SET search_path = '';
ALTER FUNCTION public.is_tenant_admin() SET search_path = '';
ALTER FUNCTION public.current_app_id() SET search_path = '';
ALTER FUNCTION public.publish_curriculum(uuid) SET search_path = '';
ALTER FUNCTION public.log_error(text, text, text, text, text, text, text, jsonb, uuid) SET search_path = '';
ALTER FUNCTION public.validate_invitation_code(text) SET search_path = '';
ALTER FUNCTION public.generate_invitation_code(integer, integer) SET search_path = '';
ALTER FUNCTION public.deactivate_invitation_code(uuid) SET search_path = '';
ALTER FUNCTION public.import_questions_bulk(jsonb) SET search_path = '';
ALTER FUNCTION public.promote_error_to_issue(uuid, text, text, text) SET search_path = '';

-- 3. Add RLS policies for tables with RLS but no policies

-- ai_token_usage: admins can read
CREATE POLICY "ai_token_usage_admin_read" ON public.ai_token_usage
  FOR SELECT TO authenticated
  USING (public.jwt_is_admin() OR public.jwt_is_super_admin());

-- attempts: students see own, admins see all
CREATE POLICY "attempts_own_or_admin" ON public.attempts
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR public.jwt_is_admin()
    OR public.jwt_is_super_admin()
  );

-- curriculum_meta: tenant-scoped read, admin write
CREATE POLICY "curriculum_meta_read" ON public.curriculum_meta
  FOR SELECT TO authenticated
  USING (
    app_id = public.current_app_id()
    OR public.jwt_is_super_admin()
  );
CREATE POLICY "curriculum_meta_admin_write" ON public.curriculum_meta
  FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_admin() OR public.jwt_is_super_admin());
CREATE POLICY "curriculum_meta_admin_update" ON public.curriculum_meta
  FOR UPDATE TO authenticated
  USING (public.jwt_is_admin() OR public.jwt_is_super_admin());

-- skill_progress: students see own, admins see all
CREATE POLICY "skill_progress_own_or_admin" ON public.skill_progress
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR public.jwt_is_admin()
    OR public.jwt_is_super_admin()
  );

