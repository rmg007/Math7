-- Migration: 20260210001600_fix_and_restore_tenant_hardening.sql
-- Description: 
-- 1. Fixes typo and vulnerability in import_questions_bulk RPC.
-- 2. Restores tenant isolation for profiles, apps, and subjects without recursion.
-- 3. Hardens profile update access for admins.

-- ============================================================================
-- 1. Fix and Harden Bulk Import Questions RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.import_questions_bulk(
  questions_data JSONB
)
RETURNS TABLE (
  inserted_count INTEGER,
  skipped_count INTEGER,
  success BOOLEAN
) 
SET search_path = public, extensions
AS $$
DECLARE
  q_record JSONB;
  v_inserted INTEGER := 0;
  v_skipped INTEGER := 0;
  v_skill_id UUID;
  v_target_app_id UUID;
  v_caller_app_id UUID;
  v_is_super_admin BOOLEAN;
  v_hash TEXT;
BEGIN
  -- 1. Security Check: Are you an admin?
  v_is_super_admin := (auth.jwt() ->> 'user_role') = 'super_admin';
  
  IF NOT v_is_super_admin AND (auth.jwt() ->> 'user_role') != 'admin' THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  -- 2. Tenant Context for regular admins
  IF NOT v_is_super_admin THEN
    v_caller_app_id := public.current_app_id();
    IF v_caller_app_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: Admin user lacks app_id assignment';
    END IF;
  END IF;

  -- Iterate through JSON array
  FOR q_record IN SELECT * FROM jsonb_array_elements(questions_data)
  LOOP
    -- 3. Structural Validation
    IF (q_record->>'skill_id') IS NULL OR (q_record->>'content') IS NULL OR (q_record->>'solution') IS NULL THEN
        RAISE EXCEPTION 'Missing required fields in question data: skill_id, content, or solution';
    END IF;

    v_skill_id := (q_record->>'skill_id')::UUID;

    -- 4. Fetch parent context (app_id inheritance)
    -- FIX: Column name is 'id', not 'skill_id'
    SELECT app_id INTO v_target_app_id FROM public.skills WHERE id = v_skill_id;
    
    IF v_target_app_id IS NULL THEN
       RAISE EXCEPTION 'Invalid skill_id or skill lacks app_id: %', v_skill_id;
    END IF;

    -- 5. Multi-Tenant Hardening: Admin can only insert into their own app
    IF NOT v_is_super_admin AND v_target_app_id != v_caller_app_id THEN
       RAISE EXCEPTION 'Access denied: Cannot import into different tenant (Target: %, Caller: %)', v_target_app_id, v_caller_app_id;
    END IF;

    -- 6. Generate Content Hash
    v_hash := encode(digest(
      (q_record->>'content') || 
      (q_record->>'type') || 
      (COALESCE(q_record->>'options', '')) || 
      (q_record->>'solution') || 
      v_skill_id::TEXT, 
      'sha256'
    ), 'hex');

    -- 7. Duplicate Check
    IF EXISTS (
      SELECT 1 FROM public.questions 
      WHERE content_hash = v_hash AND deleted_at IS NULL
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- 8. Insert
    INSERT INTO public.questions (
      skill_id,
      app_id,
      type,
      content,
      options,
      solution,
      explanation,
      points,
      is_published,
      content_hash
    ) VALUES (
      v_skill_id,
      v_target_app_id,
      COALESCE((q_record->>'type')::public.question_type, 'multiple_choice'::public.question_type),
      q_record->'content', -- USE -> to keep as JSONB
      COALESCE(q_record->'options', '{}'::JSONB),
      q_record->'solution',
      q_record->>'explanation',
      COALESCE((q_record->>'points')::INTEGER, 1),
      COALESCE((q_record->>'is_published')::BOOLEAN, FALSE),
      v_hash
    );
    
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN QUERY SELECT v_inserted, v_skipped, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 2. Restore and Harden RLS Policies
-- ============================================================================

-- Clean up any conflicting policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "Admins can view their app profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage their app profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin all access to profiles" ON profiles;

-- PROFILES: Admin access
CREATE POLICY "Admins manage their app profiles" ON profiles
FOR ALL TO authenticated
USING (
    (public.is_tenant_admin() AND app_id = public.current_app_id())
    OR
    ((auth.jwt() ->> 'user_role') = 'super_admin')
)
WITH CHECK (
    (public.is_tenant_admin() AND app_id = public.current_app_id())
    OR
    ((auth.jwt() ->> 'user_role') = 'super_admin')
);

-- APPS: Admin access
DROP POLICY IF EXISTS "Admins can view their own app" ON apps;
DROP POLICY IF EXISTS "Admins can view all apps" ON apps;
DROP POLICY IF EXISTS "Super Admins can view all apps" ON apps;

CREATE POLICY "Admins view their own app" ON apps
FOR SELECT TO authenticated
USING (
    (public.is_tenant_admin() AND app_id = public.current_app_id())
    OR
    ((auth.jwt() ->> 'user_role') = 'super_admin')
);

-- SUBJECTS: All admins can view, only super admins can manage
DROP POLICY IF EXISTS "Admins can view subjects" ON subjects;
DROP POLICY IF EXISTS "Super Admins full access to subjects" ON subjects;

CREATE POLICY "Admins view subjects" ON subjects
FOR SELECT TO authenticated
USING (public.is_tenant_admin());

CREATE POLICY "Super Admins manage subjects" ON subjects
FOR ALL TO authenticated
USING ((auth.jwt() ->> 'user_role') = 'super_admin');

-- INVITATION CODES: Super Admin only
DROP POLICY IF EXISTS "Super Admins can manage invitation codes" ON invitation_codes;
CREATE POLICY "Super Admins manage invitation codes" ON invitation_codes
FOR ALL TO authenticated
USING ((auth.jwt() ->> 'user_role') = 'super_admin');
