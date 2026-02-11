-- Migration: Bulk Import Hardening & Duplicate Prevention
-- Description: Adds content_hash to questions and hardens the RPC with security best practices and duplicate detection.

-- 1. Add content_hash column
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 2. Create index for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_questions_content_hash ON public.questions (content_hash) WHERE deleted_at IS NULL;

-- 3. Update the RPC function
-- We add skipped_count to the return table to inform the UI about duplicates.
CREATE OR REPLACE FUNCTION public.import_questions_bulk(
  questions_data JSONB
)
RETURNS TABLE (
  inserted_count INTEGER,
  skipped_count INTEGER,
  success BOOLEAN
) 
-- Security Hardening: Ensure we use the correct search path to avoid attacks
SET search_path = public, extensions
AS $$
DECLARE
  q_record JSONB;
  v_inserted INTEGER := 0;
  v_skipped INTEGER := 0;
  v_skill_id UUID;
  v_app_id UUID;
  v_hash TEXT;
BEGIN
  -- Check if admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  -- Iterate through JSON array
  FOR q_record IN SELECT * FROM jsonb_array_elements(questions_data)
  LOOP
    -- 1. Structural Validation
    IF (q_record->>'skill_id') IS NULL OR (q_record->>'content') IS NULL OR (q_record->>'solution') IS NULL THEN
        RAISE EXCEPTION 'Missing required fields in question data: skill_id, content, or solution';
    END IF;

    v_skill_id := (q_record->>'skill_id')::UUID;

    -- 2. Fetch parent context (app_id inheritance)
    -- We inherit app_id from the skill to maintain multi-tenant isolation.
    SELECT app_id INTO v_app_id FROM public.skills WHERE skill_id = v_skill_id;
    
    IF v_app_id IS NULL THEN
       RAISE EXCEPTION 'Invalid skill_id or skill lacks app_id: %', v_skill_id;
    END IF;

    -- 3. Generate Content Hash (content + type + options + solution + skill_id)
    -- This prevents exact duplicates WITHIN the same skill.
    -- We include skill_id in the hash to allow the same question content in DIFFERENT skills.
    v_hash := encode(digest(
      (q_record->>'content') || 
      (q_record->>'type') || 
      (COALESCE(q_record->>'options', '')) || 
      (q_record->>'solution') || 
      v_skill_id::TEXT, 
      'sha256'
    ), 'hex');

    -- 4. Duplicate Check
    -- If a question with this hash already exists and is not deleted, we skip it.
    IF EXISTS (
      SELECT 1 FROM public.questions 
      WHERE content_hash = v_hash AND deleted_at IS NULL
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- 5. Insert
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
      v_app_id,
      COALESCE((q_record->>'type')::public.question_type, 'multiple_choice'::public.question_type),
      q_record->>'content',
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
