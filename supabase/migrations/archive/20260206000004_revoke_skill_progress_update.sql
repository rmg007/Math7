-- ══════════════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING: REVOKE STUDENT UPDATE ON SKILL_PROGRESS
-- Migration: 20260206000004_revoke_skill_progress_update.sql
-- Priority: MEDIUM
-- Purpose: Revoke student UPDATE permission on skill_progress table now that
--          mastery is calculated server-side via trigger
-- ══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ RATIONALE                                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- With the mastery trigger in place (20260206000003), students no longer need
-- UPDATE permission on skill_progress. This migration enforces pure server
-- authority by:
--
-- 1. Dropping the permissive "skill_progress_own_all" policy
-- 2. Creating separate SELECT and INSERT policies
-- 3. Denying UPDATE and DELETE operations
--
-- Students can still:
-- - SELECT their own progress (for display in UI)
-- - INSERT initial progress rows (for new skills)
--
-- Students cannot:
-- - UPDATE mastery_level, total_attempts, etc. (trigger handles this)
-- - DELETE progress records (preserves audit trail)

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ DROP PERMISSIVE POLICY                                                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Remove the existing "FOR ALL" policy that grants UPDATE permission
DROP POLICY IF EXISTS "skill_progress_own_all" ON public.skill_progress;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ CREATE GRANULAR POLICIES                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Allow students to SELECT their own progress
CREATE POLICY "skill_progress_own_select" ON public.skill_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow students to INSERT initial progress rows
-- (Trigger will handle updates, but initial row creation may be needed)
CREATE POLICY "skill_progress_own_insert" ON public.skill_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Explicitly deny UPDATE operations
-- (Mastery is now calculated server-side via trigger)
CREATE POLICY "skill_progress_deny_update" ON public.skill_progress
  FOR UPDATE TO authenticated
  USING (false);

-- Explicitly deny DELETE operations
-- (Preserve audit trail of student progress)
CREATE POLICY "skill_progress_deny_delete" ON public.skill_progress
  FOR DELETE TO authenticated
  USING (false);

-- Admin policies remain unchanged (they already have full access via jwt_is_admin())

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ VERIFICATION QUERIES                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Test 1: Verify students can SELECT their own progress
-- SET LOCAL role TO 'authenticated';
-- SET LOCAL request.jwt.claims.sub TO 'test-student-uuid';
-- SELECT * FROM skill_progress WHERE user_id = 'test-student-uuid';
-- Expected: Returns rows

-- Test 2: Verify students CANNOT UPDATE their progress
-- SET LOCAL role TO 'authenticated';
-- SET LOCAL request.jwt.claims.sub TO 'test-student-uuid';
-- UPDATE skill_progress SET mastery_level = 100 WHERE user_id = 'test-student-uuid';
-- Expected: ERROR: new row violates row-level security policy

-- Test 3: Verify students CANNOT DELETE their progress
-- SET LOCAL role TO 'authenticated';
-- SET LOCAL request.jwt.claims.sub TO 'test-student-uuid';
-- DELETE FROM skill_progress WHERE user_id = 'test-student-uuid';
-- Expected: ERROR: new row violates row-level security policy

-- Test 4: Verify trigger still updates progress automatically
-- INSERT INTO attempts (user_id, question_id, answered, is_correct, points_earned)
-- VALUES ('test-student-uuid', 'test-question-uuid', '{"answer": "test"}', true, 10);
-- 
-- SELECT * FROM skill_progress WHERE user_id = 'test-student-uuid';
-- Expected: Row exists with updated mastery_level (trigger bypasses RLS)

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
