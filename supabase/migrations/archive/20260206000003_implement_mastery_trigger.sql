-- ══════════════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING: SERVER-SIDE MASTERY TRIGGER
-- Migration: 20260206000003_implement_mastery_trigger.sql
-- Priority: MEDIUM
-- Purpose: Implement automatic server-side mastery calculation via database trigger
--          to eliminate any theoretical client-side authority over skill_progress
-- ══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ RATIONALE                                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- Currently, skill_progress updates are mediated through RPCs, which provides
-- server-side authority. However, this migration moves to a PURE server-authoritative
-- model by using a database trigger that automatically recalculates mastery whenever
-- a new attempt is inserted.
--
-- BENEFITS:
-- 1. ZERO CLIENT AUTHORITY: Clients cannot influence mastery calculation
-- 2. CONSISTENCY: Mastery is always derived from attempts ledger
-- 3. AUDITABILITY: Single source of truth for mastery logic
-- 4. SIMPLICITY: No need for client-side or RPC-based mastery updates
--
-- TRADE-OFFS:
-- 1. PERFORMANCE: Trigger adds overhead to attempt inserts (mitigated by indexing)
-- 2. COMPLEXITY: Mastery logic is now in database, not application code

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ MASTERY CALCULATION TRIGGER FUNCTION                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

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
  -- Get skill_id from the question
  SELECT q.skill_id INTO skill_id_var 
  FROM public.questions q 
  WHERE q.id = NEW.question_id;

  -- If question has no skill (orphaned), skip mastery update
  IF skill_id_var IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate aggregates for this user + skill combination
  SELECT 
    COUNT(*), 
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END),
    SUM(points_earned)
  INTO total_attempts_var, correct_attempts_var, total_points_var
  FROM public.attempts
  WHERE user_id = NEW.user_id 
    AND question_id IN (
      SELECT id FROM public.questions WHERE skill_id = skill_id_var
    );

  -- Calculate mastery level (0-100 scale)
  -- Minimum 3 attempts required before mastery is calculated
  mastery_var := CASE 
    WHEN total_attempts_var >= 3 THEN 
      ROUND((correct_attempts_var::DECIMAL / total_attempts_var) * 100, 2)
    ELSE 0
  END;

  -- Calculate current streak (consecutive correct answers)
  -- This is a simplified version; for production, consider a more sophisticated algorithm
  WITH recent_attempts AS (
    SELECT is_correct, created_at
    FROM public.attempts
    WHERE user_id = NEW.user_id 
      AND question_id IN (
        SELECT id FROM public.questions WHERE skill_id = skill_id_var
      )
    ORDER BY created_at DESC
    LIMIT 100
  ),
  streak_calc AS (
    SELECT 
      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) OVER (
        ORDER BY created_at DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) as running_streak,
      is_correct,
      ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM recent_attempts
  )
  SELECT COALESCE(MAX(running_streak), 0) INTO current_streak_var
  FROM streak_calc
  WHERE rn = (SELECT MIN(rn) FROM streak_calc WHERE is_correct = false)
     OR NOT EXISTS (SELECT 1 FROM streak_calc WHERE is_correct = false);

  -- If no incorrect answers found, current streak is all attempts
  IF current_streak_var IS NULL THEN
    current_streak_var := LEAST(total_attempts_var, 100);
  END IF;

  -- Get best streak from existing record (if any)
  SELECT COALESCE(MAX(streak_best), 0) INTO best_streak_var
  FROM public.skill_progress
  WHERE user_id = NEW.user_id AND skill_id = skill_id_var;

  -- Update best streak if current streak is higher
  best_streak_var := GREATEST(best_streak_var, current_streak_var);

  -- Upsert skill_progress
  INSERT INTO public.skill_progress (
    user_id, 
    skill_id, 
    total_attempts, 
    correct_attempts, 
    mastery_level,
    streak_current,
    streak_best,
    last_practiced_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id, 
    skill_id_var, 
    total_attempts_var, 
    correct_attempts_var, 
    mastery_var,
    current_streak_var,
    best_streak_var,
    NEW.created_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, skill_id) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    correct_attempts = EXCLUDED.correct_attempts,
    mastery_level = EXCLUDED.mastery_level,
    streak_current = EXCLUDED.streak_current,
    streak_best = GREATEST(skill_progress.streak_best, EXCLUDED.streak_best),
    last_practiced_at = EXCLUDED.last_practiced_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ATTACH TRIGGER TO ATTEMPTS TABLE                                             │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_update_skill_progress ON public.attempts;

-- Create trigger that fires AFTER each attempt insert
CREATE TRIGGER trigger_update_skill_progress
  AFTER INSERT ON public.attempts
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_skill_progress_on_attempt();

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PERFORMANCE OPTIMIZATION                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Ensure indexes exist for efficient trigger execution
-- (These may already exist from baseline migration, but we ensure them here)

CREATE INDEX IF NOT EXISTS idx_attempts_user_question 
  ON public.attempts(user_id, question_id);

CREATE INDEX IF NOT EXISTS idx_questions_skill_id 
  ON public.questions(skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_progress_user_skill 
  ON public.skill_progress(user_id, skill_id);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ VERIFICATION QUERIES                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Test 1: Insert a new attempt and verify skill_progress is auto-updated
-- INSERT INTO attempts (user_id, question_id, answered, is_correct, points_earned)
-- VALUES (
--   'test-user-uuid',
--   'test-question-uuid',
--   '{"answer": "test"}',
--   true,
--   10
-- );
-- 
-- SELECT * FROM skill_progress 
-- WHERE user_id = 'test-user-uuid' 
--   AND skill_id = (SELECT skill_id FROM questions WHERE id = 'test-question-uuid');
-- Expected: 1 row with total_attempts = 1, correct_attempts = 1, mastery_level calculated

-- Test 2: Insert multiple attempts and verify mastery calculation
-- INSERT INTO attempts (user_id, question_id, answered, is_correct, points_earned)
-- SELECT 
--   'test-user-uuid',
--   'test-question-uuid',
--   '{"answer": "test"}',
--   (random() > 0.5),  -- Random correct/incorrect
--   CASE WHEN (random() > 0.5) THEN 10 ELSE 0 END
-- FROM generate_series(1, 10);
--
-- SELECT * FROM skill_progress WHERE user_id = 'test-user-uuid';
-- Expected: mastery_level = (correct_attempts / total_attempts) * 100

-- Test 3: Performance test (measure trigger overhead)
-- EXPLAIN ANALYZE
-- INSERT INTO attempts (user_id, question_id, answered, is_correct, points_earned)
-- SELECT 
--   gen_random_uuid(),
--   'test-question-uuid',
--   '{"answer": "test"}',
--   true,
--   10
-- FROM generate_series(1, 1000);
-- Expected: Trigger overhead should be < 10ms per insert on average

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
