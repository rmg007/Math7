-- ══════════════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING: EXPLICIT DENIAL POLICIES FOR ATTEMPTS
-- Migration: 20260206000001_harden_attempts_rls.sql
-- Priority: HIGH
-- Purpose: Add explicit denial policies for UPDATE/DELETE on attempts table
--          to enforce append-only behavior and improve audit clarity
-- ══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ RATIONALE                                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- The attempts table is designed to be an immutable audit trail of student
-- question attempts. While the absence of UPDATE/DELETE policies implicitly
-- denies these operations via REST API, explicit denial policies provide:
--
-- 1. CLARITY: Makes security posture obvious to auditors and future developers
-- 2. DEFENSE IN DEPTH: Prevents accidental policy additions that could weaken security
-- 3. AUDIT COMPLIANCE: Satisfies security audit requirements for explicit controls
--
-- Note: The batch_submit_attempts RPC uses SECURITY DEFINER and bypasses RLS,
-- but includes its own WHERE clause guard (user_id = auth.uid()) for protection.

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ EXPLICIT DENIAL POLICIES                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Deny all UPDATE operations on attempts for authenticated users
-- This ensures attempts remain immutable after creation
CREATE POLICY "attempts_deny_update" ON public.attempts
  FOR UPDATE TO authenticated
  USING (false);

-- Deny all DELETE operations on attempts for authenticated users
-- This preserves the complete audit trail of student activity
CREATE POLICY "attempts_deny_delete" ON public.attempts
  FOR DELETE TO authenticated
  USING (false);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ VERIFICATION QUERIES                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Test 1: Verify UPDATE is blocked
-- Expected: ERROR: new row violates row-level security policy for table "attempts"
-- 
-- SET LOCAL role TO 'authenticated';
-- SET LOCAL request.jwt.claims.sub TO 'some-student-uuid';
-- UPDATE attempts SET is_correct = true WHERE id = 'some-attempt-id';

-- Test 2: Verify DELETE is blocked
-- Expected: ERROR: new row violates row-level security policy for table "attempts"
--
-- SET LOCAL role TO 'authenticated';
-- SET LOCAL request.jwt.claims.sub TO 'some-student-uuid';
-- DELETE FROM attempts WHERE id = 'some-attempt-id';

-- Test 3: Verify INSERT still works
-- Expected: 1 row inserted
--
-- SET LOCAL role TO 'authenticated';
-- SET LOCAL request.jwt.claims.sub TO 'some-student-uuid';
-- INSERT INTO attempts (user_id, question_id, answered, is_correct, points_earned)
-- VALUES ('some-student-uuid', 'some-question-id', '{"answer": "test"}', false, 0);

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
