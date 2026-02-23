-- ============================================================================
-- PROJECT HADES: PHASE 2.1 (JWT HELPER HARDENING & UI FIXES - REVISED)
-- Date: 2026-02-16
-- Description: Fixes Super Admin visibility and JWT helper function search paths.
-- ============================================================================

-- 1. HARDEN CURRENT_APP_ID (FIX SEARCH PATH)
CREATE OR REPLACE FUNCTION public.current_app_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
 SET row_security TO 'off'
AS $function$
    SELECT app_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- 2. HARDEN JWT_IS_TENANT_ADMIN (ENSURE IT USES THE CORRECT APP CONTEXT)
CREATE OR REPLACE FUNCTION public.jwt_is_tenant_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin' -- Using 'admin' as the tenant admin role
      AND app_id = public.current_app_id()
    ),
    false
  );
$function$;

-- 3. UPDATE JWT_IS_ADMIN (INCLUDE SUPER ADMINS)
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$ 
  SELECT public.jwt_is_tenant_admin() OR public.jwt_is_super_admin(); 
$function$;

-- 4. HARDEN JWT_IS_SUPER_ADMIN (ENSURE SEARCH PATH)
CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    ),
    false
  );
$function$;

-- 5. RE-APPLY PULL_CHANGES HARDENING (ROBUST CHECKS)
CREATE OR REPLACE FUNCTION public.pull_changes(table_name text, last_sync_time timestamp with time zone DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  active_json JSONB;
  deleted_json JSONB;
  v_last_sync TIMESTAMPTZ;
  v_app_id UUID;
  v_is_super BOOLEAN;
BEGIN
  v_last_sync := COALESCE(last_sync_time, '1970-01-01'::timestamptz);
  v_app_id := public.current_app_id();
  v_is_super := public.jwt_is_super_admin();

  IF v_app_id IS NULL AND NOT v_is_super THEN
    RAISE EXCEPTION 'Unauthorized: Missing tenant context';
  END IF;

  IF table_name = 'domains' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT domain_id as id, app_id, slug, title, description, icon, sort_order, color, (status IN ('live', 'published')) as is_published, created_at, updated_at
      FROM public.domains 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL AND (app_id = v_app_id OR v_is_super)
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT domain_id as id, deleted_at FROM public.domains 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL AND (app_id = v_app_id OR v_is_super)
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;
  ELSIF table_name = 'skills' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT skill_id as id, domain_id, app_id, slug, title, description, sort_order, difficulty_level, (status IN ('live', 'published')) as is_published, created_at, updated_at
      FROM public.skills 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL AND (app_id = v_app_id OR v_is_super)
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT skill_id as id, deleted_at FROM public.skills 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL AND (app_id = v_app_id OR v_is_super)
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;
  ELSIF table_name = 'questions' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT question_id as id, skill_id, app_id, type, content::text as content, options, solution, explanation, points, sort_order, (status IN ('live', 'published')) as is_published, created_at, updated_at
      FROM public.questions 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL AND (app_id = v_app_id OR v_is_super)
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT question_id as id, deleted_at FROM public.questions 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL AND (app_id = v_app_id OR v_is_super)
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;
  ELSIF table_name = 'skill_progress' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT id, user_id, skill_id, mastery_level, total_attempts, correct_attempts, total_points, current_streak, longest_streak, last_attempt_at, created_at, updated_at
      FROM public.skill_progress 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL AND (user_id = auth.uid()) 
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT id, deleted_at FROM public.skill_progress 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL AND (user_id = auth.uid())
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;
  ELSE
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  RETURN jsonb_build_object('active', active_json,'deleted', deleted_json,'synced_at', NOW());
END;
$function$;
