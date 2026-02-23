-- ============================================================================
-- PROJECT HADES: PHASE 1 REMEDIATION (CRITICAL & HIGH VULNERABILITIES)
-- Date: 2026-02-16
-- Description: Fixes cross-tenant leaks in RLS, ghosting in snapshots, 
--              and global admin bypasses.
-- ============================================================================

-- 1. CURRICULUM SNAPSHOTS: Remove permissive read access
DROP POLICY IF EXISTS "curriculum_snapshots_read" ON public.curriculum_snapshots;
CREATE POLICY "curriculum_snapshots_read" ON public.curriculum_snapshots
  FOR SELECT TO authenticated
  USING (app_id = public.current_app_id() OR public.jwt_is_super_admin());

-- 2. ATTEMPTS: Restrict admin access to tenant scope
-- Note: 'user_id = auth.uid()' check remains for student's own data
DROP POLICY IF EXISTS "attempts_own_or_admin" ON public.attempts;
CREATE POLICY "attempts_tenant_isolation" ON public.attempts
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR (public.jwt_is_admin() AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = public.attempts.user_id 
        AND app_id = public.current_app_id()
    ))
    OR public.jwt_is_super_admin()
  );

-- 3. SKILL PROGRESS: Restrict admin access to tenant scope
DROP POLICY IF EXISTS "skill_progress_own_or_admin" ON public.skill_progress;
CREATE POLICY "skill_progress_tenant_isolation" ON public.skill_progress
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR (public.jwt_is_admin() AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = public.skill_progress.user_id 
        AND app_id = public.current_app_id()
    ))
    OR public.jwt_is_super_admin()
  );

-- 4. AI TOKEN USAGE: Restrict admin access to tenant scope
DROP POLICY IF EXISTS "ai_token_usage_admin_read" ON public.ai_token_usage;
CREATE POLICY "ai_token_usage_tenant_isolation" ON public.ai_token_usage
  FOR SELECT TO authenticated
  USING (
    (public.jwt_is_admin() AND app_id = public.current_app_id())
    OR public.jwt_is_super_admin()
  );

-- 5. SUBJECTS: Hide non-live subjects from non-related admins
DROP POLICY IF EXISTS "subjects_all_read" ON public.subjects;
CREATE POLICY "subjects_tenant_isolation" ON public.subjects
  FOR SELECT TO authenticated
  USING (
    status = 'live'
    OR (public.jwt_is_admin() AND EXISTS (
        SELECT 1 FROM public.apps 
        WHERE subject_id = public.subjects.subject_id 
        AND app_id = public.current_app_id()
    ))
    OR public.jwt_is_super_admin()
  );

-- 6. CURRICULUM META: Secondary check for cleanup (Ensure no overlapping permissive policies)
DROP POLICY IF EXISTS "curriculum_meta_read" ON public.curriculum_meta;
CREATE POLICY "curriculum_meta_tenant_read" ON public.curriculum_meta
  FOR SELECT TO authenticated
  USING (
    app_id = public.current_app_id()
    OR public.jwt_is_super_admin()
  );

-- 7. Ensure security definer functions have search_path set (Supabase Best Practice)
ALTER FUNCTION public.current_app_id() SET search_path = 'public', 'auth';
ALTER FUNCTION public.is_tenant_admin() SET search_path = 'public', 'auth';
