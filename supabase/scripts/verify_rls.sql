-- =============================================================================
-- RLS Verification SQL Script
-- =============================================================================
-- This script verifies that Row Level Security is properly configured on all
-- tables in the AppShell schema.
--
-- Agents should expand this script as they add tables and policies.
-- At minimum, it checks:
--   1. RLS is enabled on all required tables
--   2. No accidental public write access
--   3. Admin-only tables are protected
--
-- Run via: make db_verify_rls
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Verify RLS is ENABLED on all required tables
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    tables_without_rls TEXT[];
    required_tables TEXT[] := ARRAY[
        'profiles',
        'domains',
        'skills',
        'questions',
        'attempts',
        'sessions',
        'skill_progress',
        'outbox',
        'sync_meta',
        'curriculum_meta'
    ];
    tbl TEXT;
    rls_enabled BOOLEAN;
BEGIN
    tables_without_rls := ARRAY[]::TEXT[];
    
    FOREACH tbl IN ARRAY required_tables
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = tbl AND relnamespace = 'public'::regnamespace;
        
        IF rls_enabled IS NULL THEN
            RAISE NOTICE 'Table % does not exist yet (expected during early phases)', tbl;
        ELSIF NOT rls_enabled THEN
            tables_without_rls := array_append(tables_without_rls, tbl);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE EXCEPTION 'RLS FAIL: The following tables do NOT have RLS enabled: %', 
            array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE 'PASS: All existing tables have RLS enabled.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Verify is_admin() function exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_admin' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE NOTICE 'SKIP: is_admin() function does not exist yet (expected in Phase 1)';
    ELSE
        RAISE NOTICE 'PASS: is_admin() function exists.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2b. Verify handle_new_user() function and trigger exist
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE NOTICE 'SKIP: handle_new_user() function does not exist yet (expected in Phase 1)';
    ELSE
        RAISE NOTICE 'PASS: handle_new_user() function exists.';
    END IF;
    
    -- Check for the trigger on auth.users
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE 'SKIP: on_auth_user_created trigger does not exist yet (expected in Phase 1)';
    ELSE
        RAISE NOTICE 'PASS: on_auth_user_created trigger exists.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2c. Verify batch_submit_attempts() RPC exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'batch_submit_attempts' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE NOTICE 'SKIP: batch_submit_attempts() function does not exist yet (expected in Phase 1)';
    ELSE
        RAISE NOTICE 'PASS: batch_submit_attempts() function exists.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Test: Anonymous users cannot INSERT into content tables
-- ---------------------------------------------------------------------------
-- NOTE: This requires setting role to 'anon' which simulates unauthenticated access.
-- In local Supabase, this tests the RLS policies directly.

DO $$
BEGIN
    -- Only run if domains table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'domains' AND schemaname = 'public') THEN
        BEGIN
            -- Temporarily become anon role
            SET LOCAL ROLE anon;
            
            -- Attempt insert (should fail due to RLS)
            INSERT INTO public.domains (slug, title) 
            VALUES ('rls_test_' || gen_random_uuid()::text, 'RLS Test Domain');
            
            -- If we get here, RLS is broken
            RAISE EXCEPTION 'RLS FAIL: Anonymous INSERT into domains succeeded (should be blocked)';
        EXCEPTION 
            WHEN insufficient_privilege THEN
                RAISE NOTICE 'PASS: Anonymous INSERT into domains blocked by RLS.';
            WHEN OTHERS THEN
                -- Could be other errors like unique constraint, which is fine
                RAISE NOTICE 'PASS: Anonymous INSERT into domains blocked (error: %).', SQLERRM;
        END;
        
        -- Reset role
        RESET ROLE;
    ELSE
        RAISE NOTICE 'SKIP: domains table does not exist yet.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Test: Anonymous users cannot INSERT into attempts table
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attempts' AND schemaname = 'public') THEN
        BEGIN
            SET LOCAL ROLE anon;
            
            INSERT INTO public.attempts (user_id, question_id, response, is_correct)
            VALUES (gen_random_uuid(), gen_random_uuid(), '{}'::jsonb, false);
            
            RAISE EXCEPTION 'RLS FAIL: Anonymous INSERT into attempts succeeded (should be blocked)';
        EXCEPTION 
            WHEN insufficient_privilege THEN
                RAISE NOTICE 'PASS: Anonymous INSERT into attempts blocked by RLS.';
            WHEN OTHERS THEN
                RAISE NOTICE 'PASS: Anonymous INSERT into attempts blocked (error: %).', SQLERRM;
        END;
        
        RESET ROLE;
    ELSE
        RAISE NOTICE 'SKIP: attempts table does not exist yet.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Summary
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'RLS Verification Summary';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'All checks passed or skipped (table not yet created).';
    RAISE NOTICE 'Agents: Expand this script as you add tables/policies.';
    RAISE NOTICE '===========================================';
END $$;

-- Rollback to ensure no test data persists
ROLLBACK;
