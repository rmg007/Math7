-- 🧪 VUL-003 Regression Test: Server-Side Answer Validation
-- ============================================================
-- Purpose: Verify server recalculates answer correctness instead of trusting client
-- Vulnerability: Client can tamper with local SQLite to fake correct answers
-- Fix Status: ⚠️ PARTIAL (Server-side  triggers exist, but sync RPC validation unclear)
--
-- Test Scenario:
-- 1. Create question with known correct answer
-- 2. Simulate sync attempts with:
--    Case A: Correct answer + is_correct=true  ✅ Should pass
--    Case B: Wrong answer + is_correct=true ❌ Should fail (tampered client)
--    Case C: Correct answer + is_correct=false ✅ Should pass with correction
-- 3. Assert server overrides client's is_correct value

BEGIN;

-- Cleanup test data
DELETE FROM public.attempts WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'test-validate@example.com');
DELETE FROM public.questions WHERE content LIKE 'Test Validation%';

-- Step 1: Create test question with known answer
INSERT INTO public.apps (app_id, app_name, owner_id)
VALUES ('00000000-0000-0000-0000-000000000009', 'Test Validation App', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (app_id) DO NOTHING;

INSERT INTO public.subjects (subject_id, subject_name, app_id)
VALUES ('99999999-0000-0000-0000-000000000001', 'Test Subject', '00000000-0000-0000-0000-000000000009')
ON CONFLICT (subject_id) DO NOTHING;

INSERT INTO public.domains (domain_id, domain_name, subject_id, app_id)
VALUES ('99999999-0000-0000-0000-000000000002', 'Test Domain', '99999999-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009')
ON CONFLICT (domain_id) DO NOTHING;

INSERT INTO public.skills (skill_id, skill_name, domain_id, app_id)
VALUES ('99999999-0000-0000-0000-000000000003', 'Test Skill', '99999999-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000009')
ON CONFLICT (skill_id) DO NOTHING;

-- Create test question: 2 + 2 = ?
INSERT INTO public.questions (question_id, content, type, solution, app_id, skill_id, points)
VALUES (
  '99999999-0000-0000-0000-000000000010',
  'Test Validation: What is 2 + 2?',
  'text_input',
  '{"answer": "4"}'::jsonb,  -- Correct answer is "4"
  '00000000-0000-0000-0000-000000000009',
  '99999999-0000-0000-0000-000000000003',
  1
)
ON CONFLICT (question_id) DO NOTHING;

-- Step 2: Create test user
DO $$
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES ('99999999-0000-0000-0000-000000000020', 'test-validate@example.com', crypt('password', gen_salt('bf')), NOW())
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Step 3: Test Cases

-- CASE A: Correct answer + is_correct=true (Normal honest client)
INSERT INTO public.attempts (
  user_id,
  question_id,
  app_id,
  skill_id,
  answer,
  is_correct,
  points_earned
) VALUES (
  '99999999-0000-0000-0000-000000000020',
  '99999999-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000009',
  '99999999-0000-0000-0000-000000000003',
  '{"answer": "4"}'::jsonb,  -- Correct answer
  true,                       -- Client says correct
  1
);

-- CASE B: Wrong answer + is_correct=true (Tampered client!)
INSERT INTO public.attempts (
  user_id,
  question_id,
  app_id,
  skill_id,
  answer,
  is_correct,
  points_earned
) VALUES (
  '99999999-0000-0000-0000-000000000020',
  '99999999-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000009',
  '99999999-0000-0000-0000-000000000003',
  '{"answer": "999"}'::jsonb,  -- WRONG answer
  true,                         -- Client LIES and says correct!
  1
);

-- CASE C: Correct answer + is_correct=false (Client made mistake in grading)
INSERT INTO public.attempts (
  user_id,
  question_id,
  app_id,
  skill_id,
  answer,
  is_correct,
  points_earned
) VALUES (
  '99999999-0000-0000-0000-000000000020',
  '99999999-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000009',
  '99999999-0000-0000-0000-000000000003',
  '{"answer": "4"}'::jsonb,  -- Correct answer
  false,                      -- Client incorrectly says wrong
  0
);

-- Step 4: Verify server validation
-- NOTE: If server-side validation exists, it would be in:
-- 1. A trigger on attempts table (BEFORE INSERT/UPDATE)
-- 2. The sync RPC function
-- 3. The update_skill_progress_on_attempt() trigger

DO $$
DECLARE
  case_a_result BOOLEAN;
  case_b_result BOOLEAN;
  case_c_result BOOLEAN;
  case_b_points INTEGER;
BEGIN
  -- Check CASE A: Should remain correct
  SELECT is_correct INTO case_a_result
  FROM public.attempts
  WHERE user_id = '99999999-0000-0000-0000-000000000020'
  AND answer->>'answer' = '4'
  AND points_earned = 1
  LIMIT 1;

  -- Check CASE B: Should be CORRECTED to false by server
  SELECT is_correct, points_earned INTO case_b_result, case_b_points
  FROM public.attempts
  WHERE user_id = '99999999-0000-0000-0000-000000000020'
  AND answer->>'answer' = '999'
  LIMIT 1;

  -- Check CASE C: Should be CORRECTED to true by server
  SELECT is_correct INTO case_c_result
  FROM public.attempts
  WHERE user_id = '99999999-0000-0000-0000-000000000020'
  AND answer->>'answer' = '4'
  AND points_earned = 0
  LIMIT 1;

  -- ASSERTIONS
  IF case_a_result IS TRUE AND case_b_result IS FALSE AND case_b_points = 0 AND case_c_result IS TRUE THEN
    RAISE NOTICE '✅ PASS: Server validates answers server-side';
    RAISE NOTICE '  - Case A (honest correct): ✅ Remains correct';
    RAISE NOTICE '  - Case B (tampered wrong): ✅ Corrected to incorrect, 0 points';
    RAISE NOTICE '  - Case C (client error): ✅ Corrected to correct';
  ELSIF case_b_result IS TRUE THEN
    RAISE EXCEPTION '❌ FAIL: VUL-003 DETECTED - Server trusts client! Case B (wrong answer) still marked is_correct=true';
  ELSIF case_b_points > 0 THEN
    RAISE EXCEPTION '❌ FAIL: VUL-003 DETECTED - Server awarded points for wrong answer! Case B got % points', case_b_points;
  ELSE
    RAISE EXCEPTION '❌ FAIL: Server validation partially works but has issues. Case A: %, Case B: %, Case C: %', case_a_result, case_b_result, case_c_result;
  END IF;
END $$;

-- Cleanup
ROLLBACK;

-- ====================
-- EXPECTED OUTCOME
-- ====================
-- ✅ PASS: If server-side validation trigger exists
-- ❌ FAIL: If server trusts client's is_correct value
--
-- REMEDIATION (if test fails):
-- Create server-side validation trigger:
--
-- CREATE OR REPLACE FUNCTION validate_attempt_correctness()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   correct_solution JSONB;
--   is_answer_correct BOOLEAN;
-- BEGIN
--   -- Fetch the question's solution
--   SELECT solution INTO correct_solution
--   FROM public.questions
--   WHERE question_id = NEW.question_id;
--
--   -- Compare answer with solution (implement comparison logic based on question type)
--   is_answer_correct := (NEW.answer->>'answer' = correct_solution->>'answer');
--
--   -- Override client's is_correct value with server's calculation
--   NEW.is_correct := is_answer_correct;
--   NEW.points_earned := CASE WHEN is_answer_correct THEN (
--     SELECT points FROM public.questions WHERE question_id = NEW.question_id
--   ) ELSE 0 END;
--
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER trigger_validate_attempt
-- BEFORE INSERT OR UPDATE ON public.attempts
-- FOR EACH ROW EXECUTE FUNCTION validate_attempt_correctness();
