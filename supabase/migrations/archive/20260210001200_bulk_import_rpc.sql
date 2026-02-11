-- Migration: Bulk Import Questions RPC
-- Description: Adds a secure RPC function to batch insert questions.
-- Author: AI Agent (Questrix)
-- Date: 2026-02-10

-- 1. Create the RPC function
CREATE OR REPLACE FUNCTION public.import_questions_bulk(
  questions_data JSONB
)
RETURNS TABLE (
  inserted_count INTEGER,
  success BOOLEAN
) AS $$
DECLARE
  q_record JSONB;
  counter INTEGER := 0;
  v_skill_id UUID;
BEGIN
  -- Check if admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  -- Iterate through JSON array
  FOR q_record IN SELECT * FROM jsonb_array_elements(questions_data)
  LOOP
    -- Validate required fields
    IF (q_record->>'skill_id') IS NULL OR (q_record->>'content') IS NULL OR (q_record->>'solution') IS NULL THEN
        RAISE EXCEPTION 'Missing required fields in question data: skill_id, content, or solution';
    END IF;

    v_skill_id := (q_record->>'skill_id')::UUID;

    -- Validate IDs (Soft check: if skill missing/deleted, error)
    -- We allow inserting into soft-deleted skills if admin explicitly wants to (though specific policy might block reading)
    -- But logical integrity: parent must exist.
    IF NOT EXISTS (SELECT 1 FROM public.skills WHERE id = v_skill_id) THEN
       RAISE EXCEPTION 'Invalid skill_id: %', v_skill_id;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execution permission to authenticated users (admins only inside function)
GRANT EXECUTE ON FUNCTION public.import_questions_bulk(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_questions_bulk(JSONB) TO service_role;
