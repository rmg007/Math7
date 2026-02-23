-- ============================================================
-- pgTAP RLS Regression Tests
-- ============================================================
-- Tests critical Row Level Security policies to ensure:
--   1. Students can only see their OWN data
--   2. Admins can see all data
--   3. Anonymous users cannot access protected data
--   4. Cross-tenant isolation works correctly
--
-- Run with: psql $DATABASE_URL -f supabase/tests/rls/rls_core_tests.sql
-- ============================================================

BEGIN;

SELECT plan(16);

-- ============================================================
-- SETUP: Create test users and data
-- ============================================================

-- Create test users in auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pgtap-student-a@test.com', crypt('test', gen_salt('bf')), NOW(), '{}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'pgtap-student-b@test.com', crypt('test', gen_salt('bf')), NOW(), '{}'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'pgtap-admin@test.com', crypt('test', gen_salt('bf')), NOW(), '{}')
ON CONFLICT (id) DO NOTHING;

-- Create test app
INSERT INTO public.apps (app_id, app_name, owner_id, is_active)
VALUES ('aaaaaaaa-1111-0000-0000-000000000001', 'pgTAP Test App', 'aaaaaaaa-0000-0000-0000-000000000003', true)
ON CONFLICT (app_id) DO NOTHING;

-- Create profiles (student A, student B, admin)
INSERT INTO public.profiles (id, display_name, role, app_id)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Student A', 'student', 'aaaaaaaa-1111-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Student B', 'student', 'aaaaaaaa-1111-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Admin', 'admin', 'aaaaaaaa-1111-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Create test curriculum hierarchy
INSERT INTO public.subjects (subject_id, subject_name, app_id)
VALUES ('aaaaaaaa-2222-0000-0000-000000000001', 'pgTAP Subject', 'aaaaaaaa-1111-0000-0000-000000000001')
ON CONFLICT (subject_id) DO NOTHING;

INSERT INTO public.domains (domain_id, domain_name, subject_id, app_id)
VALUES ('aaaaaaaa-3333-0000-0000-000000000001', 'pgTAP Domain', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001')
ON CONFLICT (domain_id) DO NOTHING;

INSERT INTO public.skills (skill_id, skill_name, domain_id, app_id)
VALUES ('aaaaaaaa-4444-0000-0000-000000000001', 'pgTAP Skill', 'aaaaaaaa-3333-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001')
ON CONFLICT (skill_id) DO NOTHING;

-- Create skill_progress for both students
INSERT INTO public.skill_progress (user_id, skill_id, app_id, mastery_level, total_attempts, correct_attempts)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-4444-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 50, 10, 5),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-4444-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 80, 10, 8)
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ============================================================
-- TEST GROUP 1: skill_progress isolation (Student A)
-- ============================================================

-- Impersonate Student A
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}';
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT COUNT(*)::int FROM public.skill_progress WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  'Student A can see their own skill_progress'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.skill_progress WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  0,
  'Student A CANNOT see Student B skill_progress (data isolation)'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.skill_progress),
  1,
  'Student A sees exactly 1 row total in skill_progress'
);


-- ============================================================
-- TEST GROUP 2: profiles isolation (Student A)
-- ============================================================

SELECT is(
  (SELECT COUNT(*)::int FROM public.profiles WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  'Student A can see their own profile'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.profiles WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  0,
  'Student A CANNOT see Student B profile (data isolation)'
);


-- ============================================================
-- TEST GROUP 3: skill_progress isolation (Student B)
-- ============================================================

-- Switch to Student B
RESET ROLE;
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-0000-0000-0000-000000000002", "role": "authenticated"}';
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT COUNT(*)::int FROM public.skill_progress WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  1,
  'Student B can see their own skill_progress'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.skill_progress WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'Student B CANNOT see Student A skill_progress (data isolation)'
);


-- ============================================================
-- TEST GROUP 4: Admin access
-- ============================================================

-- Switch to Admin
RESET ROLE;
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-0000-0000-0000-000000000003", "role": "authenticated", "user_role": "admin"}';
SET LOCAL ROLE authenticated;

SELECT cmp_ok(
  (SELECT COUNT(*)::int FROM public.skill_progress),
  '>=',
  2,
  'Admin can see all skill_progress rows (admin policy)'
);


-- ============================================================
-- TEST GROUP 5: Anonymous access prevention
-- ============================================================

RESET ROLE;
SET LOCAL "request.jwt.claims" = '{}';
SET LOCAL ROLE anon;

SELECT is(
  (SELECT COUNT(*)::int FROM public.skill_progress),
  0,
  'Anonymous users CANNOT see any skill_progress'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.profiles),
  0,
  'Anonymous users CANNOT see any profiles'
);


-- ============================================================
-- TEST GROUP 6: Attempts immutability
-- ============================================================

RESET ROLE;
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}';
SET LOCAL ROLE authenticated;

-- Insert a test attempt
INSERT INTO public.attempts (user_id, skill_id, app_id, is_correct, question_id)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-4444-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000001',
  true,
  NULL
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.attempts WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  'Student can insert their own attempts'
);

-- Test that updates are denied
SELECT throws_ok(
  $$UPDATE public.attempts SET is_correct = false WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  NULL,
  NULL,
  'Students CANNOT update attempts (immutability)'
);

-- Test that deletes are denied
SELECT throws_ok(
  $$DELETE FROM public.attempts WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  NULL,
  NULL,
  'Students CANNOT delete attempts (immutability)'
);


-- ============================================================
-- TEST GROUP 7: Groups multi-tenant isolation
-- ============================================================

RESET ROLE;

-- Create a group owned by Admin, with Student A as member
INSERT INTO public.groups (id, owner_id, type, name, app_id)
VALUES ('aaaaaaaa-5555-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 'class', 'pgTAP Test Group', 'aaaaaaaa-1111-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.group_members (group_id, user_id, nickname)
VALUES ('aaaaaaaa-5555-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Student A')
ON CONFLICT DO NOTHING;

-- Student B should NOT see this group
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-0000-0000-0000-000000000002", "role": "authenticated"}';
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT COUNT(*)::int FROM public.groups WHERE id = 'aaaaaaaa-5555-0000-0000-000000000001'),
  0,
  'Student B CANNOT see groups they are not a member of'
);

-- Student A SHOULD see this group
RESET ROLE;
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}';
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT COUNT(*)::int FROM public.groups WHERE id = 'aaaaaaaa-5555-0000-0000-000000000001'),
  1,
  'Student A CAN see groups they are a member of'
);


-- ============================================================
-- FINISH
-- ============================================================

SELECT * FROM finish();

-- Rollback everything — no test data persists
ROLLBACK;
