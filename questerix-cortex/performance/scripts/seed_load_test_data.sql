-- ─────────────────────────────────────────────────────────────────────────────
-- Questerix Load Test Data Seed
-- questerix-cortex/performance/scripts/seed_load_test_data.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Creates a deterministic, isolated load-test tenant with:
--   - One app (tenant)
--   - One subject
--   - One domain
--   - One skill
--   - One question (multiple_choice)
--   - One auth user + matching profile (the "loadtest" user k6 logs in as)
--
-- All IDs are hardcoded UUIDs so the .env.k6 template stays stable across runs.
-- Run once before any k6 test. Safe to run multiple times (uses ON CONFLICT DO NOTHING).
--
-- Usage:
--   psql $DATABASE_URL -f questerix-cortex/performance/scripts/seed_load_test_data.sql
--
-- DANGER: DO NOT run against production. Use staging / local Supabase only.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Deterministic IDs ────────────────────────────────────────────────────────

DO $$
DECLARE
  -- These UUIDs are fixed. Copy them directly into .env.k6.
  v_subject_id   UUID := 'a0000000-0000-4000-a000-000000000001';
  v_app_id       UUID := 'a0000000-0000-4000-a000-000000000002';
  v_domain_id    UUID := 'a0000000-0000-4000-a000-000000000003';
  v_skill_id     UUID := 'a0000000-0000-4000-a000-000000000004';
  v_question_id  UUID := 'a0000000-0000-4000-a000-000000000005';

  -- The load test user credentials must match K6_TEST_EMAIL / K6_TEST_PASSWORD
  v_user_email   TEXT := 'loadtest@questerix.com';
  v_user_id      UUID;
BEGIN

  -- ── 1. Subject ──────────────────────────────────────────────────────────
  INSERT INTO public.subjects (subject_id, title, slug, status)
  VALUES (v_subject_id, 'Load Test Subject', 'loadtest-subject', 'live')
  ON CONFLICT (subject_id) DO NOTHING;

  -- ── 2. App (tenant) ─────────────────────────────────────────────────────
  INSERT INTO public.apps (
    app_id, subject_id, subdomain, display_name, grade_level, is_active
  )
  VALUES (
    v_app_id, v_subject_id, 'loadtest', 'Load Test App', 'grade-1', true
  )
  ON CONFLICT (app_id) DO NOTHING;

  -- ── 3. Domain ────────────────────────────────────────────────────────────
  INSERT INTO public.domains (domain_id, app_id, slug, title, status)
  VALUES (v_domain_id, v_app_id, 'loadtest-domain', 'Load Test Domain', 'live')
  ON CONFLICT (domain_id) DO NOTHING;

  -- ── 4. Skill ─────────────────────────────────────────────────────────────
  INSERT INTO public.skills (skill_id, domain_id, app_id, slug, title, status)
  VALUES (v_skill_id, v_domain_id, v_app_id, 'loadtest-skill', 'Load Test Skill', 'live')
  ON CONFLICT (skill_id) DO NOTHING;

  -- ── 5. Question ───────────────────────────────────────────────────────────
  INSERT INTO public.questions (
    question_id, skill_id, app_id, type, content, options, solution, status
  )
  VALUES (
    v_question_id,
    v_skill_id,
    v_app_id,
    'multiple_choice',
    '{"text": "What is 2 + 2?", "hint": null}'::jsonb,
    '["A: 3", "B: 4", "C: 5", "D: 6"]'::jsonb,
    '{"correct_index": 1, "explanation": "2+2=4"}'::jsonb,
    'live'
  )
  ON CONFLICT (question_id) DO NOTHING;

  -- ── 6. Auth user ─────────────────────────────────────────────────────────
  -- Check if the load-test auth user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Create via Supabase Admin API instead — direct auth.users insert is
    -- unsupported in hosted Supabase. Run this via the Supabase dashboard or
    -- the Management API before running k6:
    --
    --   supabase auth user create --email loadtest@questerix.com \
    --     --password "LoadTest!!1" --project-id bkfhorslctqieetzqdtd
    --
    RAISE NOTICE 'Load test user not found in auth.users. Create it via Supabase Auth Admin API before running k6.';
    RAISE NOTICE 'Email: %', v_user_email;
    RAISE NOTICE 'Password: LoadTest!!1';
  ELSE
    -- ── 7. Profile ─────────────────────────────────────────────────────────
    INSERT INTO public.profiles (id, app_id, role, email, full_name)
    VALUES (v_user_id, v_app_id, 'student', v_user_email, 'k6 Load Test User')
    ON CONFLICT (id) DO UPDATE SET app_id = v_app_id, role = 'student';

    RAISE NOTICE 'Load test profile upserted for user_id=%', v_user_id;
  END IF;

  RAISE NOTICE '─────────────────────────────────────────────────';
  RAISE NOTICE 'K6_APP_ID      = %', v_app_id;
  RAISE NOTICE 'K6_QUESTION_ID = %', v_question_id;
  RAISE NOTICE 'K6_SKILL_ID    = %', v_skill_id;
  RAISE NOTICE '─────────────────────────────────────────────────';
  RAISE NOTICE 'Copy these values into questerix-cortex/performance/.env.k6';

END $$;
