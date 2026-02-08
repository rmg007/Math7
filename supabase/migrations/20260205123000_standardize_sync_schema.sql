-- ══════════════════════════════════════════════════════════════════════════════
-- SCHEMA STANDARDIZATION: ALIGNING SQL WITH DRIFT CLIENT
-- Migration: 20260205123000_standardize_sync_schema.sql
-- Priority: HIGH
-- Purpose: Standardize column names in skill_progress to match the Flutter app's 
--          sync expectations. Renames best_streak to longest_streak.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Rename columns in skill_progress
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'skill_progress' AND column_name = 'best_streak'
    ) THEN
        ALTER TABLE public.skill_progress RENAME COLUMN best_streak TO longest_streak;
    END IF;
END $$;

-- 2. Update submit_attempt_and_update_progress RPC
-- This RPC needs to return the standardized column names
CREATE OR REPLACE FUNCTION public.submit_attempt_and_update_progress(
  attempts_json JSONB
)
RETURNS SETOF public.skill_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_item JSONB;
  result_record public.skill_progress;
BEGIN
  FOR attempt_item IN SELECT * FROM jsonb_array_elements(attempts_json)
  LOOP
    -- 1. Insert the attempt
    INSERT INTO public.attempts (
      id,
      user_id,
      question_id,
      response,
      is_correct,
      score_awarded,
      time_spent_ms,
      created_at
    ) VALUES (
      COALESCE((attempt_item->>'id')::UUID, gen_random_uuid()),
      auth.uid(),
      (attempt_item->>'question_id')::UUID,
      COALESCE(attempt_item->'response', '{}'::jsonb),
      COALESCE((attempt_item->>'is_correct')::BOOLEAN, false),
      COALESCE((attempt_item->>'score_awarded')::INTEGER, 0),
      (attempt_item->>'time_spent_ms')::INTEGER,
      COALESCE((attempt_item->>'created_at')::TIMESTAMPTZ, NOW())
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. The trigger (trigger_update_skill_progress) automatically handles 
    -- the skill_progress table update logic.
    
    -- 3. Fetch the latest progress for this skill to return to the client
    SELECT * INTO result_record
    FROM public.skill_progress
    WHERE user_id = auth.uid()
      AND skill_id = (SELECT skill_id FROM public.questions WHERE id = (attempt_item->>'question_id')::UUID)
    LIMIT 1;

    IF FOUND THEN
      RETURN NEXT result_record;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- 3. Update existing trigger if it used old column names
-- We already have update_skill_progress_on_attempt() in 20260206000003_implement_mastery_trigger.sql
-- Let's ensure it's updated to use 'longest_streak' as well if it's already there.
-- Since that migration is futuristic (dated Feb 6), we might be overwriting its logic here.
-- Standard practice: The latest migration wins.

CREATE OR REPLACE FUNCTION public.update_skill_progress_on_attempt()
RETURNS TRIGGER AS $$
DECLARE
  skill_id_var UUID;
  total_attempts_var INT;
  correct_attempts_var INT;
  total_points_var INT;
  mastery_var DECIMAL(5,2);
  current_streak_var INT;
  best_streak_var INT;
BEGIN
  SELECT q.skill_id INTO skill_id_var FROM public.questions q WHERE q.id = NEW.question_id;
  IF skill_id_var IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*), SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), SUM(score_awarded)
  INTO total_attempts_var, correct_attempts_var, total_points_var
  FROM public.attempts
  WHERE user_id = NEW.user_id 
    AND question_id IN (SELECT id FROM public.questions WHERE skill_id = skill_id_var);

  mastery_var := CASE WHEN total_attempts_var >= 3 THEN ROUND((correct_attempts_var::DECIMAL / total_attempts_var) * 100, 2) ELSE 0 END;

  -- Simplified streak calc
  WITH recent AS (
    SELECT is_correct FROM public.attempts
    WHERE user_id = NEW.user_id AND question_id IN (SELECT id FROM public.questions WHERE skill_id = skill_id_var)
    ORDER BY created_at DESC LIMIT 100
  )
  SELECT count(*) INTO current_streak_var FROM (
    SELECT is_correct, row_number() OVER () as rn FROM recent
  ) s WHERE is_correct = true AND rn <= (SELECT COALESCE(min(rn)-1, 100) FROM (SELECT is_correct, row_number() OVER () as rn FROM recent) s2 WHERE is_correct = false);

  SELECT COALESCE(longest_streak, 0) INTO best_streak_var
  FROM public.skill_progress
  WHERE user_id = NEW.user_id AND skill_id = skill_id_var;

  best_streak_var := GREATEST(best_streak_var, COALESCE(current_streak_var, 0));

  INSERT INTO public.skill_progress (
    user_id, skill_id, total_attempts, correct_attempts, total_points, 
    mastery_level, current_streak, longest_streak, last_attempt_at, created_at, updated_at
  ) VALUES (
    NEW.user_id, skill_id_var, total_attempts_var, correct_attempts_var, total_points_var,
    mastery_var, COALESCE(current_streak_var, 0), best_streak_var, NEW.created_at, NOW(), NOW()
  ) ON CONFLICT (user_id, skill_id) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    correct_attempts = EXCLUDED.correct_attempts,
    total_points = EXCLUDED.total_points,
    mastery_level = EXCLUDED.mastery_level,
    current_streak = EXCLUDED.current_streak,
    longest_streak = GREATEST(skill_progress.longest_streak, EXCLUDED.longest_streak),
    last_attempt_at = EXCLUDED.last_attempt_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
