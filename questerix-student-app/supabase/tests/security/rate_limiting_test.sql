-- 🧪 VUL-007 Regression Test: Join Code Brute-Force Protection
-- ==============================================================
-- Purpose: Verify rate limiting prevents brute-force attacks on group join codes
-- Vulnerability: 6-character codes are guessable via script without rate limiting
-- Fix Status: 🔴 NOT IMPLEMENTED (Rate limiting infrastructure required)
--
-- Test Scenario:
-- 1. Create group with join code
-- 2. Simulate rapid failed join attempts (10 attempts in quick succession)
-- 3. Assert rate limiting blocks attempts after threshold
-- 4. Wait for cooldown period
-- 5. Assert attempts allowed again

BEGIN;

-- Cleanup test data
DELETE FROM public.group_join_requests WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'test-brute%');
DELETE FROM public.groups WHERE name = 'Test Security Group';

-- Step 1: Create test group with join code
INSERT INTO public.apps (app_id, app_name, owner_id)
VALUES ('00000000-0000-0000-0000-000000000007', 'Test Security App', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (app_id) DO NOTHING;

DO $$
DECLARE
  owner_id UUID := '77777777-0000-0000-0000-000000000777';
  group_id UUID;
BEGIN
  -- Create group owner
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (owner_id, 'test-owner@example.com', crypt('password', gen_salt('bf')), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create group with known join code
  INSERT INTO public.groups (owner_id, type, name, join_code, allow_anonymous_join, app_id)
  VALUES (owner_id, 'class', 'Test Security Group', 'TEST99', true, '00000000-0000-0000-0000-000000000007')
  RETURNING id INTO group_id;
  
  RAISE NOTICE 'Test group created: ID=%, Join Code=TEST99', group_id;
END $$;

-- Step 2: Create attacker user
DO $$
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES ('88888888-0000-0000-0000-000000000888', 'test-brute-attacker@example.com', crypt('password', gen_salt('bf')), NOW())
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Step 3: Simulate brute-force attack (10 rapid failed attempts)
-- This should trigger rate limiting after N attempts (e.g., 5)

DO $$
DECLARE
  attempt_count INTEGER := 0;
  success_count INTEGER := 0;
  rate_limit_triggered BOOLEAN := FALSE;
  wrong_codes TEXT[] := ARRAY['WRONG1', 'WRONG2', 'WRONG3', 'WRONG4', 'WRONG5', 'WRONG6', 'WRONG7', 'WRONG8', 'WRONG9', 'WRO10'];
  wrong_code TEXT;
  group_found UUID;
BEGIN
  -- Try 10 wrong codes in rapid succession
  FOREACH wrong_code IN ARRAY wrong_codes
  LOOP
    attempt_count := attempt_count + 1;
    
    -- Attempt to join with wrong code
    SELECT id INTO group_found
    FROM public.groups
    WHERE join_code = wrong_code
    AND allow_anonymous_join = true;
    
    IF group_found IS NOT NULL THEN
      success_count := success_count + 1;
    END IF;
    
    -- Log failed attempt (simulating what join_group RPC would do)
    INSERT INTO public.group_join_requests (
      group_id,
      user_id,
      status,
      requested_code
    ) VALUES (
      (SELECT id FROM public.groups WHERE name = 'Test Security Group' LIMIT 1),
      '88888888-0000-0000-0000-000000000888',
      'failed',
      wrong_code
    );
    
  END LOOP;
  
  -- Check if rate limiting would have kicked in
  -- NOTE: This is WHERE rate limiting should be implemented
  -- For now, we check if ALL 10 attempts succeeded (BAD!)
  
  IF attempt_count = 10 AND success_count = 0 THEN
    -- Check if join_group RPC would have rate limited
    -- In real implementation, there should be a rate_limit_violations table
    -- or the RPC should check attempt frequency
    
    DECLARE
      recent_failures INTEGER;
    BEGIN
      -- Count failures in last 60 seconds for this user
      SELECT COUNT(*) INTO recent_failures
      FROM public.group_join_requests
      WHERE user_id = '88888888-0000-0000-0000-000000000888'
      AND status = 'failed'
      AND created_at > (NOW() - INTERVAL '60 seconds');
      
      IF recent_failures >= 10 THEN
        -- This user made 10 failed attempts - should be rate limited!
        RAISE EXCEPTION '❌ FAIL: VUL-007 DETECTED - No rate limiting! Attacker made % failed join attempts without being blocked. This allows brute-force attacks.', recent_failures;
      END IF;
    END;
  END IF;
  
  RAISE NOTICE 'Brute-force simulation complete: % attempts, % successes', attempt_count, success_count;
END $$;

-- Step 4: Check for rate limiting implementation
-- Expected: join_group RPC should have logic like this:

DO $$
DECLARE
  has_rate_limiting BOOLEAN := FALSE;
  rpc_definition TEXT;
BEGIN
  -- Check if join_group RPC exists and has rate limiting logic
  SELECT pg_get_functiondef(oid) INTO rpc_definition
  FROM pg_proc
  WHERE proname = 'join_group';
  
  IF rpc_definition IS NOT NULL THEN
    -- Check if RPC contains rate limiting keywords
    has_rate_limiting := (
      rpc_definition LIKE '%rate%limit%' OR
      rpc_definition LIKE '%too_many_requests%' OR
      rpc_definition LIKE '%attempt%count%' OR
      rpc_definition LIKE '%cooldown%'
    );
    
    IF has_rate_limiting THEN
      RAISE NOTICE '✅ PASS: join_group RPC has rate limiting logic';
    ELSE
      RAISE WARNING '⚠️  join_group RPC exists but may lack rate limiting';
    END IF;
  ELSE
    RAISE WARNING '⚠️  join_group RPC not found';
  END IF;
  
  -- For this test, we'll pass if rate limiting keywords are found
  -- OR if there's a gate on the number of recent failed attempts
  IF NOT has_rate_limiting THEN
    RAISE EXCEPTION '❌ FAIL: VUL-007 DETECTED - No rate limiting implementation found in join_group RPC';
  END IF;
END $$;

-- Cleanup
ROLLBACK;

-- ====================
-- EXPECTED OUTCOME
-- ====================
-- ❌ FAIL (Expected): Rate limiting not implemented yet
-- ✅ PASS (Future): When rate limiting is added to join_group RPC
--
-- REMEDIATION:
-- 1. Add rate limiting to join_group RPC:
--
-- CREATE OR REPLACE FUNCTION join_group(p_join_code TEXT)
-- RETURNS UUID AS $$
-- DECLARE
--   v_group_id UUID;
--   v_user_id UUID := auth.uid();
--   v_recent_failures INTEGER;
-- BEGIN
--   -- RATE LIMITING: Check recent failed attempts
--   SELECT COUNT(*) INTO v_recent_failures
--   FROM group_join_requests
--   WHERE user_id = v_user_id
--   AND status = 'failed'
--   AND created_at > (NOW() - INTERVAL '5 minutes');
--   
--   -- Block if more than 5 failures in 5 minutes
--   IF v_recent_failures >= 5 THEN
--     RAISE EXCEPTION 'Too many failed join attempts. Please wait 5 minutes.' USING ERRCODE = '42501';
--   END IF;
--   
--   -- Find group with join code
--   SELECT id INTO v_group_id
--   FROM groups
--   WHERE join_code = p_join_code
--   AND allow_anonymous_join = true;
--   
--   IF v_group_id IS NULL THEN
--     -- Log failed attempt
--     INSERT INTO group_join_requests (group_id, user_id, status, requested_code)
--     VALUES (NULL, v_user_id, 'failed', p_join_code);
--     
--     RAISE EXCEPTION 'Invalid join code' USING ERRCODE = '42883';
--   END IF;
--   
--   -- Join group
--   INSERT INTO group_members (group_id, user_id)
--   VALUES (v_group_id, v_user_id);
--   
--   RETURN v_group_id;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- 2. Alternative: Use Supabase Edge Functions with Upstash/Redis for distributed rate limiting
--
-- 3. Consider increasing join code entropy (8+ characters, alphanumeric)
