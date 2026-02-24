-- ============================================================================
-- PROJECT HADES: PHASE 2 REMEDIATION (RPC HARDENING)
-- Date: 2026-02-16
-- Description: Secures RPC functions against cross-tenant leaks and unauthorized usage.
-- ============================================================================

-- 1. HARDEN PULL_CHANGES (ENFORCE TENANT ISOLATION)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pull_changes(table_name text, last_sync_time timestamp with time zone DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  active_json JSONB;
  deleted_json JSONB;
  v_last_sync TIMESTAMPTZ;
  v_app_id UUID;
BEGIN
  v_last_sync := COALESCE(last_sync_time, '1970-01-01'::timestamptz);
  v_app_id := public.current_app_id();

  -- CRITICAL: Ensure we have a valid app_id context
  IF v_app_id IS NULL AND NOT public.jwt_is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Missing tenant context';
  END IF;

  IF table_name = 'domains' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT 
        domain_id as id,
        app_id,
        slug,
        title,
        description,
        icon,
        sort_order,
        color,
        (status IN ('live', 'published')) as is_published,
        created_at,
        updated_at
      FROM public.domains 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL 
      AND (app_id = v_app_id OR public.jwt_is_super_admin())
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT domain_id as id, deleted_at FROM public.domains 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL 
      AND (app_id = v_app_id OR public.jwt_is_super_admin())
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;
    
  ELSIF table_name = 'skills' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT 
        skill_id as id,
        domain_id,
        app_id,
        slug,
        title,
        description,
        sort_order,
        difficulty_level,
        (status IN ('live', 'published')) as is_published,
        created_at,
        updated_at
      FROM public.skills 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL 
      AND (app_id = v_app_id OR public.jwt_is_super_admin())
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT skill_id as id, deleted_at FROM public.skills 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL 
      AND (app_id = v_app_id OR public.jwt_is_super_admin())
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;
    
  ELSIF table_name = 'questions' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT 
        question_id as id,
        skill_id,
        app_id,
        type,
        content::text as content,
        options,
        solution,
        explanation,
        points,
        sort_order,
        (status IN ('live', 'published')) as is_published,
        created_at,
        updated_at
      FROM public.questions 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL 
      AND (app_id = v_app_id OR public.jwt_is_super_admin())
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT question_id as id, deleted_at FROM public.questions 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL 
      AND (app_id = v_app_id OR public.jwt_is_super_admin())
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;
    
  ELSIF table_name = 'skill_progress' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT 
        id,
        user_id,
        skill_id,
        mastery_level,
        total_attempts,
        correct_attempts,
        total_points,
        current_streak,
        longest_streak,
        last_attempt_at,
        created_at,
        updated_at
      FROM public.skill_progress 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL 
      AND (user_id = auth.uid()) -- Skill progress is always user-specific
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT id, deleted_at FROM public.skill_progress 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL 
      AND (user_id = auth.uid())
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;
    
  ELSE
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  RETURN jsonb_build_object(
    'active', active_json,
    'deleted', deleted_json,
    'synced_at', NOW()
  );
END;
$function$;

-- 2. HARDEN CONSUME_TENANT_TOKENS (Table missing - Skipping function definition)
-- ----------------------------------------------------------------------------
-- Function public.consume_tenant_tokens depends on public.tenant_quotas which is not present.
