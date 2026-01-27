-- Migration: 20260127000015_create_rpc_functions.sql
-- Description: Create RPC functions for curriculum publishing and batch attempts

-- Atomic Publish Curriculum
CREATE OR REPLACE FUNCTION public.publish_curriculum()
RETURNS void AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can publish';
  END IF;

  -- Validate: No orphaned skills
  IF EXISTS (
    SELECT 1 FROM public.skills s
    LEFT JOIN public.domains d ON s.domain_id = d.id
    WHERE d.id IS NULL OR d.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned skills detected';
  END IF;

  -- Validate: No orphaned questions
  IF EXISTS (
    SELECT 1 FROM public.questions q
    LEFT JOIN public.skills s ON q.skill_id = s.id
    WHERE s.id IS NULL OR s.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned questions detected';
  END IF;

  -- Validate: All published domains have at least one skill
  IF EXISTS (
    SELECT 1 FROM public.domains d
    WHERE d.is_published = true AND d.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.skills s 
      WHERE s.domain_id = d.id AND s.deleted_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'Cannot publish: empty domains detected';
  END IF;

  -- Bump curriculum version
  UPDATE public.curriculum_meta SET 
    version = version + 1,
    last_published_at = NOW(),
    updated_at = NOW()
  WHERE id = 'singleton';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Batch Submit Attempts (for offline sync)
-- This is the PRIMARY and ONLY way students submit attempts
CREATE OR REPLACE FUNCTION public.batch_submit_attempts(
  attempts_json JSONB
)
RETURNS SETOF public.attempts AS $$
DECLARE
  attempt_item JSONB;
  result_record public.attempts;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR attempt_item IN SELECT * FROM jsonb_array_elements(attempts_json)
  LOOP
    -- IMPORTANT: user_id is ALWAYS set from auth.uid(), never from client payload
    INSERT INTO public.attempts (
      id,
      user_id,
      question_id,
      response,
      is_correct,
      score_awarded,
      time_spent_ms,
      created_at,
      updated_at
    ) VALUES (
      (attempt_item->>'id')::UUID,
      auth.uid(),
      (attempt_item->>'question_id')::UUID,
      attempt_item->'response',
      (attempt_item->>'is_correct')::BOOLEAN,
      COALESCE((attempt_item->>'score_awarded')::INTEGER, 0),
      (attempt_item->>'time_spent_ms')::INTEGER,
      COALESCE((attempt_item->>'created_at')::TIMESTAMPTZ, NOW()),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      response = EXCLUDED.response,
      is_correct = EXCLUDED.is_correct,
      score_awarded = EXCLUDED.score_awarded,
      time_spent_ms = EXCLUDED.time_spent_ms,
      updated_at = NOW()
    WHERE public.attempts.user_id = auth.uid()
    RETURNING * INTO result_record;
    
    IF result_record.id IS NOT NULL THEN
      RETURN NEXT result_record;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
