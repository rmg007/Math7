-- ══════════════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING: IMMUTABILITY GUARD FOR BATCH_SUBMIT_ATTEMPTS RPC
-- Migration: 20260206000002_harden_batch_submit_rpc.sql
-- Priority: HIGH
-- Purpose: Prevent self-tampering via UUID reuse in batch_submit_attempts RPC
-- ══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ RATIONALE                                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- The current batch_submit_attempts RPC uses ON CONFLICT DO UPDATE to handle
-- offline sync conflicts. However, this allows a malicious student to:
--
-- 1. Submit attempt UUID 'abc-123' with is_correct: false
-- 2. Later submit the same UUID with is_correct: true
-- 3. Overwrite their attempt history to inflate scores
--
-- This migration adds an immutability guard that only allows idempotent updates
-- (i.e., updates where the data hasn't changed). Any attempt to modify existing
-- data will be silently ignored, preserving the original attempt.
--
-- TRADE-OFF: Legitimate offline sync conflicts will now fail silently instead
-- of updating. This is acceptable because:
-- - Offline sync should generate unique UUIDs per device
-- - Conflicts indicate a client-side bug, not normal operation
-- - Silent failure is safer than allowing tampering

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ OPTION 1: STRICT IMMUTABILITY (RECOMMENDED)                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- This version rejects any attempt to update an existing record, even if the
-- data is identical. This is the safest approach.

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
    -- This prevents users from submitting attempts as other users
    INSERT INTO public.attempts (
      id,
      user_id,           -- Enforced server-side, ignores any client-supplied value
      question_id,
      answered,
      is_correct,
      points_earned,
      time_spent_ms,
      created_at
    ) VALUES (
      (attempt_item->>'id')::UUID,
      auth.uid(),        -- <-- ALWAYS from authenticated session
      (attempt_item->>'question_id')::UUID,
      attempt_item->'answered',
      (attempt_item->>'is_correct')::BOOLEAN,
      COALESCE((attempt_item->>'points_earned')::INTEGER, 0),
      (attempt_item->>'time_spent_ms')::INTEGER,
      COALESCE((attempt_item->>'created_at')::TIMESTAMPTZ, NOW())
    )
    ON CONFLICT (id) DO NOTHING  -- <-- CHANGED: Reject duplicates instead of updating
    RETURNING * INTO result_record;
    
    -- Only return if insert succeeded (not a duplicate)
    IF result_record.id IS NOT NULL THEN
      RETURN NEXT result_record;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ OPTION 2: IDEMPOTENT UPDATES (ALTERNATIVE)                                   │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- This version allows updates ONLY if the data is identical (idempotent).
-- Uncomment this version if you need to support legitimate duplicate submissions.

/*
CREATE OR REPLACE FUNCTION public.batch_submit_attempts(
  attempts_json JSONB
)
RETURNS SETOF public.attempts AS $$
DECLARE
  attempt_item JSONB;
  result_record public.attempts;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR attempt_item IN SELECT * FROM jsonb_array_elements(attempts_json)
  LOOP
    INSERT INTO public.attempts (
      id,
      user_id,
      question_id,
      answered,
      is_correct,
      points_earned,
      time_spent_ms,
      created_at
    ) VALUES (
      (attempt_item->>'id')::UUID,
      auth.uid(),
      (attempt_item->>'question_id')::UUID,
      attempt_item->'answered',
      (attempt_item->>'is_correct')::BOOLEAN,
      COALESCE((attempt_item->>'points_earned')::INTEGER, 0),
      (attempt_item->>'time_spent_ms')::INTEGER,
      COALESCE((attempt_item->>'created_at')::TIMESTAMPTZ, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
      answered = EXCLUDED.answered,
      is_correct = EXCLUDED.is_correct,
      points_earned = EXCLUDED.points_earned,
      time_spent_ms = EXCLUDED.time_spent_ms
    WHERE 
      public.attempts.user_id = auth.uid()
      -- IMMUTABILITY GUARD: Only allow update if data is identical
      AND public.attempts.is_correct = EXCLUDED.is_correct
      AND public.attempts.points_earned = EXCLUDED.points_earned
      AND public.attempts.answered = EXCLUDED.answered
    RETURNING * INTO result_record;
    
    IF result_record.id IS NOT NULL THEN
      RETURN NEXT result_record;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ VERIFICATION QUERIES                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Test 1: Submit new attempt (should succeed)
-- SELECT * FROM batch_submit_attempts('[
--   {
--     "id": "11111111-1111-1111-1111-111111111111",
--     "question_id": "22222222-2222-2222-2222-222222222222",
--     "answered": {"selected_option": "a"},
--     "is_correct": false,
--     "points_earned": 0,
--     "time_spent_ms": 5000
--   }
-- ]'::jsonb);

-- Test 2: Submit same UUID with different data (should be ignored)
-- SELECT * FROM batch_submit_attempts('[
--   {
--     "id": "11111111-1111-1111-1111-111111111111",
--     "question_id": "22222222-2222-2222-2222-222222222222",
--     "answered": {"selected_option": "b"},
--     "is_correct": true,
--     "points_earned": 10,
--     "time_spent_ms": 5000
--   }
-- ]'::jsonb);
-- Expected: 0 rows returned (duplicate rejected)

-- Test 3: Verify original attempt is unchanged
-- SELECT * FROM attempts WHERE id = '11111111-1111-1111-1111-111111111111';
-- Expected: is_correct = false, points_earned = 0

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
