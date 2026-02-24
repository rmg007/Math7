-- Migration: Reconcile Schema Gap and Missing RPCs
-- Date: 2026-02-13
-- Author: Antigravity

-- ============================================================================
-- 1. Table & Column Alignments
-- ============================================================================

DO $$
BEGIN
    -- Apps: grade_number -> grade_level
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'grade_number') THEN
        ALTER TABLE public.apps RENAME COLUMN grade_number TO grade_level;
    END IF;

    -- Groups: allow_anonymous -> allow_anonymous_join
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'allow_anonymous') THEN
        ALTER TABLE public.groups RENAME COLUMN allow_anonymous TO allow_anonymous_join;
    END IF;

    -- Subjects: add color_hex and icon_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'color_hex') THEN
        ALTER TABLE public.subjects ADD COLUMN color_hex TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'icon_url') THEN
        ALTER TABLE public.subjects ADD COLUMN icon_url TEXT;
    END IF;

    -- Group Members: add nickname
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'nickname') THEN
        ALTER TABLE public.group_members ADD COLUMN nickname TEXT;
    END IF;
END $$;

-- 2. Landing Pages Table
CREATE TABLE IF NOT EXISTS public.app_landing_pages (
    app_id UUID PRIMARY KEY REFERENCES public.apps(app_id) ON DELETE CASCADE,
    meta_title TEXT,
    meta_description TEXT,
    hero_headline TEXT,
    hero_subheadline TEXT,
    cta_text TEXT DEFAULT 'Get Started',
    features JSONB DEFAULT '[]'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. Invitation Code Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_invitation_code(
  p_max_uses INTEGER DEFAULT 1,
  p_expires_days INTEGER DEFAULT NULL
)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Strict Check: Only Super Admins can generate invitation codes
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Requires super_admin role';
  END IF;

  v_code := 'INV-' || upper(substr(md5(random()::text), 1, 8));
  
  INSERT INTO public.invitation_codes (
    code,
    max_uses,
    expires_at,
    created_by
  ) VALUES (
    v_code,
    p_max_uses,
    CASE WHEN p_expires_days IS NOT NULL THEN NOW() + (p_expires_days || ' days')::INTERVAL ELSE NULL END,
    auth.uid()
  );

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_invitation_code(
  p_code_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security check
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.invitation_codes
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE id = p_code_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_invitation_code(
  p_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.invitation_codes
    WHERE code = p_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR times_used < max_uses)
  );
END;
$$;

-- ============================================================================
-- 4. Account Management Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.deactivate_own_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hard delete of profile
  DELETE FROM public.profiles
  WHERE id = auth.uid();
  
  -- Account record in auth.users remains for audit/billing but profile is gone.
END;
$$;

-- ============================================================================
-- 5. Curriculum & Content Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.import_questions_bulk(
  questions_data JSONB
)
RETURNS TABLE (
  inserted_count INTEGER,
  success BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  q_record JSONB;
  counter INTEGER := 0;
  v_skill_id UUID;
BEGIN
  -- Check if admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Iterate through JSON array
  FOR q_record IN SELECT * FROM jsonb_array_elements(questions_data)
  LOOP
    v_skill_id := (q_record->>'skill_id')::UUID;

    IF NOT EXISTS (SELECT 1 FROM public.skills WHERE skill_id = v_skill_id) THEN
       CONTINUE; -- Or RAISE EXCEPTION
    END IF;

    INSERT INTO public.questions (
      skill_id,
      type,
      content,
      options,
      solution,
      explanation,
      points,
      is_published
    ) VALUES (
      v_skill_id,
      COALESCE((q_record->>'type')::public.question_type, 'multiple_choice'::public.question_type),
      q_record->>'content',
      COALESCE(q_record->'options', '{}'::JSONB),
      q_record->'solution',
      q_record->>'explanation',
      COALESCE((q_record->>'points')::INTEGER, 1),
      COALESCE((q_record->>'is_published')::BOOLEAN, FALSE)
    );
    counter := counter + 1;
  END LOOP;

  RETURN QUERY SELECT counter, TRUE;
END;
$$;

-- ============================================================================
-- 6. Observability & Error Tracking
-- ============================================================================

CREATE OR REPLACE FUNCTION public.promote_error_to_issue(
  p_error_id UUID,
  p_title TEXT,
  p_root_cause TEXT DEFAULT NULL,
  p_resolution TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_issue_id UUID;
BEGIN
  -- Create the known issue
  INSERT INTO public.known_issues (
    title,
    description,
    root_cause,
    resolution,
    status
  )
  SELECT 
    p_title,
    error_message,
    COALESCE(p_root_cause, 'Auto-promoted from error log'),
    p_resolution,
    'open'
  FROM public.error_logs
  WHERE id = p_error_id
  RETURNING id INTO v_issue_id;

  -- Update the error log status
  UPDATE public.error_logs
  SET status = 'promoted'
  WHERE id = p_error_id;

  RETURN v_issue_id;
END;
$$;

-- ============================================================================
-- 7. Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.generate_invitation_code(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_invitation_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invitation_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_own_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_questions_bulk(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_error_to_issue(UUID, TEXT, TEXT, TEXT) TO authenticated;
