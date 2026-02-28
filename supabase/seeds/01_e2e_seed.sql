-- =============================================================================
-- 01_e2e_seed.sql — Declarative E2E Test Seed
-- =============================================================================
-- PURPOSE: Establish a predictable, idempotent database state for E2E tests.
--
-- DESIGN PRINCIPLES:
--   1. Declarative: Every INSERT uses ON CONFLICT DO UPDATE — running this
--      script multiple times always produces the same final state.
--   2. Isolated: All test data uses stable, well-known UUIDs so foreign
--      key relationships are portable across environments.
--   3. Documented: Each section explains WHY the data is structured as it is.
--
-- USAGE:
--   Local:  psql $DATABASE_URL -f supabase/seeds/01_e2e_seed.sql
--   CI:     Called automatically by scripts/e2e-seed.ts before each E2E run
--   Reset:  supabase db reset  (applies all migrations then all seed files)
--
-- CREDENTIALS CONVENTION: email == password for all test accounts
-- (e.g., testadmin@questerix.com password is "testadmin@questerix.com")
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. APPS (Tenant Configuration)
-- =============================================================================
-- These represent separate tenant "schools" or products.
-- Each gets its own subdomain, routing, and curriculum scope.
--
-- The 'app' subdomain is the default super-admin management app.
-- The 'fmath' and 'grammar' subdomains are example customer tenants.
-- Each app links to exactly ONE subject via subject_id (the tenant's curriculum scope).
-- grade_level is a descriptive label for the target student grade/level.
-- =============================================================================

INSERT INTO public.apps (app_id, display_name, subdomain, grade_level, subject_id, is_active)
VALUES
  (
    '7b8c9d0a-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    'Questerix App',
    'app',
    'All Levels',
    'e6b1f2a3-7c8d-4e5f-b0a1-d2c3e4f5a6b7',
    true
  ),
  (
    '94e353a4-5a29-49a4-9906-5c0866d8eb56',
    'fmath',
    'fmath',
    'Grade 7-9',
    'e6b1f2a3-7c8d-4e5f-b0a1-d2c3e4f5a6b7',
    true
  ),
  (
    'b34e5b5f-a5b2-4440-a500-83be2dc42dd8',
    'English Grammar App',
    'grammar',
    'General',
    '76a88d18-fead-428b-b763-1b6ec4fb9326',
    true
  )
ON CONFLICT (app_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  subdomain    = EXCLUDED.subdomain,
  grade_level  = EXCLUDED.grade_level,
  subject_id   = EXCLUDED.subject_id,
  is_active    = EXCLUDED.is_active;

-- =============================================================================
-- 2. SUBJECTS (Global Curriculum Branches)
-- =============================================================================
-- Subjects are NOT scoped to a tenant — they are shared globally.
-- An app gains access to a subject via app_subjects (join table).
-- All test subjects start as 'live' to support smoke tests that navigate
-- to subject content without needing to go through a publish workflow.
--
-- EXCEPTION: If you are testing the draft → published → live lifecycle,
-- seed the specific test subject as 'draft' within the test itself,
-- not here. This seed establishes the baseline happy-path state.
-- =============================================================================

INSERT INTO public.subjects (subject_id, title, slug, status, display_order)
VALUES
  ('e6b1f2a3-7c8d-4e5f-b0a1-d2c3e4f5a6b7', 'Mathematics', 'mathematics', 'live', 1),
  ('76a88d18-fead-428b-b763-1b6ec4fb9326', 'English',      'english',     'live', 2),
  -- Test-only subjects for lifecycle E2E — always start as 'draft'
  ('c1d2e3f4-a5b6-7890-abcd-ef1234567890', 'Test Science', 'test-science', 'draft', 99)
ON CONFLICT (subject_id) DO UPDATE SET
  title         = EXCLUDED.title,
  slug          = EXCLUDED.slug,
  status        = EXCLUDED.status,
  display_order = EXCLUDED.display_order;

-- =============================================================================
-- 3. INVITATION CODES
-- =============================================================================
-- Used by the auth-registration E2E test suite to verify the invite flow.
-- One ACTIVE code that allows registration, one EXHAUSTED code for error-path testing.
-- =============================================================================

INSERT INTO public.invitation_codes (code, max_uses, times_used, is_active, expires_at)
VALUES
  ('E2E-VALID-2026',    10, 0, true,  '2030-12-31 23:59:59+00'),
  ('E2E-EXPIRED-2024',   5, 5, true,  '2024-01-01 00:00:00+00'),
  ('E2E-INACTIVE-CODE',  5, 0, false, '2030-12-31 23:59:59+00')
ON CONFLICT (code) DO UPDATE SET
  max_uses   = EXCLUDED.max_uses,
  times_used = EXCLUDED.times_used,
  is_active  = EXCLUDED.is_active,
  expires_at = EXCLUDED.expires_at;

-- =============================================================================
-- 4. APP LANDING PAGES (Required for student app routing)
-- =============================================================================
-- Every active app requires a landing page record. Without it, the student
-- app returns a 404 for the tenant's public-facing URL.
-- =============================================================================

INSERT INTO public.app_landing_pages (
  app_id, meta_title, meta_description, hero_headline, hero_subheadline
)
VALUES
  (
    '7b8c9d0a-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    'Questerix | Learn Smarter',
    'The adaptive learning platform that grows with you.',
    'Master Any Subject',
    'Practice. Progress. Succeed.'
  ),
  (
    '94e353a4-5a29-49a4-9906-5c0866d8eb56',
    'fmath | Master Mathematics',
    'Adaptive math practice for every skill level.',
    'Ace Your Maths',
    'From basics to brilliance.'
  ),
  (
    'b34e5b5f-a5b2-4440-a500-83be2dc42dd8',
    'English Grammar App | Write with Confidence',
    'Master English grammar with adaptive exercises.',
    'Write with Confidence',
    'Grammar rules made simple.'
  )
ON CONFLICT (app_id) DO UPDATE SET
  meta_title       = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  hero_headline    = EXCLUDED.hero_headline,
  hero_subheadline = EXCLUDED.hero_subheadline;

COMMIT;

-- =============================================================================
-- POST-SEED: Role Elevation
-- =============================================================================
-- Auth users are created via Supabase Auth API (in global-setup.ts or manually).
-- The handle_new_user() trigger creates a profile with role='student' by default.
-- Run these statements after auth user creation to elevate test roles:
--
--   UPDATE public.profiles SET role = 'super_admin'
--     WHERE email IN ('testsuper@questerix.com', 'testsuper2@questerix.com', 'testsuper3@questerix.com');
--
--   UPDATE public.profiles SET role = 'admin'
--     WHERE email IN ('testadmin@questerix.com', 'testadmin2@questerix.com', 'testadmin3@questerix.com');
--
--   UPDATE public.profiles SET role = 'mentor'
--     WHERE email = 'testmentor@questerix.com';
--
-- See supabase/seeds/README.md for the complete test account roster.
-- =============================================================================
