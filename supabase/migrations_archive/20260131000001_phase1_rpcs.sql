-- Migration: 20260131000001_phase1_rpcs.sql
-- Description: Implement centralized business logic RPCs for Phase 1

-- 1. Submit Attempt and Update Progress (Transactional)
CREATE OR REPLACE FUNCTION public.submit_attempt_and_update_progress(
  attempts_json JSONB
)
RETURNS SETOF public.skill_progress AS $$
DECLARE
  attempt_item JSONB;
  current_user_id UUID;
  current_skill_id UUID;
  is_correct BOOLEAN;
  points_earned INTEGER;
  
  -- Progress tracking variables
  old_progress public.skill_progress;
  new_total_attempts INTEGER;
  new_correct_attempts INTEGER;
  new_total_points INTEGER;
  new_current_streak INTEGER;
  new_longest_streak INTEGER;
  new_mastery_level INTEGER;
  
  -- Return buffer
  result_progress public.skill_progress;
BEGIN
  -- 1. Auth Check
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Loop through attempts
  FOR attempt_item IN SELECT * FROM jsonb_array_elements(attempts_json)
  LOOP
    -- Extract attempt data
    current_skill_id := (attempt_item->>'skill_id')::UUID; -- Ensure client sends skill_id
    is_correct := (attempt_item->>'is_correct')::BOOLEAN;
    points_earned := COALESCE((attempt_item->>'score_awarded')::INTEGER, 0);

    -- 3. Insert Attempt (Idempotent upsert)
    INSERT INTO public.attempts (
      id, user_id, question_id, response, is_correct, score_awarded, time_spent_ms, created_at, updated_at
    ) VALUES (
      (attempt_item->>'id')::UUID,
      current_user_id,
      (attempt_item->>'question_id')::UUID,
      attempt_item->'response',
      is_correct,
      points_earned,
      (attempt_item->>'time_spent_ms')::INTEGER,
      COALESCE((attempt_item->>'created_at')::TIMESTAMPTZ, NOW()),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      response = EXCLUDED.response,
      is_correct = EXCLUDED.is_correct,
      score_awarded = EXCLUDED.score_awarded,
      time_spent_ms = EXCLUDED.time_spent_ms,
      updated_at = NOW();

    -- 4. Lock & Get Skill Progress
    -- We use FOR UPDATE to prevent race conditions if multiple submissions happen simultaneously
    SELECT * INTO old_progress 
    FROM public.skill_progress 
    WHERE user_id = current_user_id AND skill_id = current_skill_id
    FOR UPDATE;

    -- 5. Calculate New Values
    IF old_progress IS NULL THEN
      -- Init new progress
      new_total_attempts := 1;
      new_correct_attempts := CASE WHEN is_correct THEN 1 ELSE 0 END;
      new_total_points := points_earned;
      new_current_streak := CASE WHEN is_correct THEN 1 ELSE 0 END;
      new_longest_streak := new_current_streak;
    ELSE
      -- Update existing
      new_total_attempts := old_progress.total_attempts + 1;
      new_correct_attempts := old_progress.correct_attempts + CASE WHEN is_correct THEN 1 ELSE 0 END;
      new_total_points := old_progress.total_points + points_earned;
      
      -- Streak Logic: Reset if wrong, increment if correct
      IF is_correct THEN
        new_current_streak := old_progress.current_streak + 1;
      ELSE
        new_current_streak := 0;
      END IF;
      
      -- Longest Streak Logic
      new_longest_streak := GREATEST(old_progress.longest_streak, new_current_streak);
    END IF;

    -- Mastery Logic: (correct / total) * 100, but only if attempts >= 3
    IF new_total_attempts < 3 THEN
      new_mastery_level := 0;
    ELSE
      new_mastery_level := ROUND((new_correct_attempts::NUMERIC / new_total_attempts::NUMERIC) * 100);
      -- Clamp to 0-100 just in case
      new_mastery_level := GREATEST(0, LEAST(100, new_mastery_level));
    END IF;

    -- 6. Upsert Skill Progress
    INSERT INTO public.skill_progress (
      id, user_id, skill_id, 
      total_attempts, correct_attempts, total_points, 
      current_streak, longest_streak, mastery_level, 
      last_attempt_at, created_at, updated_at
    ) VALUES (
      COALESCE(old_progress.id, gen_random_uuid()), -- Use existing ID or new UUID
      current_user_id,
      current_skill_id,
      new_total_attempts,
      new_correct_attempts,
      new_total_points,
      new_current_streak,
      new_longest_streak,
      new_mastery_level,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, skill_id) DO UPDATE SET
      total_attempts = EXCLUDED.total_attempts,
      correct_attempts = EXCLUDED.correct_attempts,
      total_points = EXCLUDED.total_points,
      current_streak = EXCLUDED.current_streak,
      longest_streak = EXCLUDED.longest_streak,
      mastery_level = EXCLUDED.mastery_level,
      last_attempt_at = NOW(),
      updated_at = NOW()
    RETURNING * INTO result_progress;

    -- 7. Add to result set
    RETURN NEXT result_progress;
    
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Session Management
CREATE OR REPLACE FUNCTION public.start_session(
  session_type TEXT DEFAULT 'practice'
)
RETURNS public.sessions AS $$
DECLARE
  new_session public.sessions;
BEGIN
  INSERT INTO public.sessions (
    user_id, 
    started_at, 
    status,
    metadata
  ) VALUES (
    auth.uid(),
    NOW(),
    'active',
    jsonb_build_object('type', session_type)
  )
  RETURNING * INTO new_session;
  
  RETURN new_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.end_session(
  session_id UUID
)
RETURNS public.sessions AS $$
DECLARE
  updated_session public.sessions;
BEGIN
  UPDATE public.sessions
  SET 
    ended_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    status = 'completed'
  WHERE id = session_id AND user_id = auth.uid()
  RETURNING * INTO updated_session;
  
  RETURN updated_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Progress Summary
CREATE OR REPLACE FUNCTION public.get_user_progress_summary()
RETURNS JSONB AS $$
DECLARE
  summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalAttempts', COALESCE(SUM(total_attempts), 0),
    'totalCorrect', COALESCE(SUM(correct_attempts), 0),
    'totalPoints', COALESCE(SUM(total_points), 0),
    'averageMastery', COALESCE(AVG(mastery_level), 0)::INTEGER,
    'totalSkillsPractice', COUNT(*) FILTER (WHERE total_attempts > 0)
  ) INTO summary
  FROM public.skill_progress
  WHERE user_id = auth.uid();
  
  RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
