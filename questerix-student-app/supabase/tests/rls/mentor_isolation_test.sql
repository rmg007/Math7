-- 🧪 VUL-002 Regression Test: Mentor Subject Isolation
-- ========================================================
-- Purpose: Verify mentors can only see student progress for their assigned subjects/domains
-- Vulnerability: Mentors seeing student work across ALL subjects, not just their own
-- Fix Status: 🔴 NOT IMPLEMENTED (Test documents expected behavior)
--
-- Test Scenario:
-- 1. Create app with 2 subjects (Math, Science)
-- 2. Create mental assigned to Math subject only
-- 3. Create student with progress in BOTH subjects
-- 4. Query skill_progress as mentor
-- 5. Assert ONLY Math subject progress is visible (Science should be filtered out)

BEGIN;

-- Cleanup any existing test data
DELETE FROM public.skill_progress WHERE user_id IN (SELECT user_id FROM auth.users WHERE email LIKE 'test-mentor%' OR email LIKE 'test-student%');
DELETE FROM public.group_members WHERE user_id IN (SELECT user_id FROM auth.users WHERE email LIKE 'test-mentor%' OR email LIKE 'test-student%');
DELETE FROM public.groups WHERE name LIKE 'Test%';
DELETE FROM public.skills WHERE skill_name LIKE 'Test%';
DELETE FROM public.domains WHERE domain_name LIKE 'Test%';
DELETE FROM public.subjects WHERE subject_name LIKE 'Test%';

-- Step 1: Create test app and subjects
INSERT INTO public.apps (app_id, app_name, owner_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test App VUL002', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (app_id) DO NOTHING;

INSERT INTO public.subjects (subject_id, subject_name, app_id)
VALUES 
  ('11111111-0000-0000-0000-000000000001', 'Test Math', '00000000-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002', 'Test Science', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (subject_id) DO NOTHING;

-- Step 2: Create domains within subjects
INSERT INTO public.domains (domain_id, domain_name, subject_id, app_id)
VALUES
  ('33333333-0000-0000-0000-000000000001', 'Test Algebra', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('44444444-0000-0000-0000-000000000002', 'Test Physics', '22222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (domain_id) DO NOTHING;

-- Step 3: Create skills within domains
INSERT INTO public.skills (skill_id, skill_name, domain_id, app_id)
VALUES
  ('55555555-0000-0000-0000-000000000001', 'Test Linear Equations', '33333333-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('66666666-0000-0000-0000-000000000002', 'Test Newton Laws', '44444444-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (skill_id) DO NOTHING;

-- Step 4: Create mentor user (assigned to Math subject only)
-- NOTE: In real implementation, there should be a mentor_subjects join table
-- For now, we'll use groups as the authorization mechanism
DO $$
DECLARE
  mentor_user_id UUID;
  student_user_id UUID;
  math_group_id UUID;
BEGIN
  -- Create mentor user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES ('77777777-0000-0000-0000-000000000001', 'test-mentor-math@example.com', crypt('password', gen_salt('bf')), NOW())
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO mentor_user_id;

  -- Create student user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES ('88888888-0000-0000-0000-000000000001', 'test-student-alice@example.com', crypt('password', gen_salt('bf')), NOW())
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO student_user_id;

  -- Create mentor's group (Math only)
  INSERT INTO public.groups (owner_id, type, name, settings, app_id)
  VALUES ('77777777-0000-0000-0000-000000000001', 'class', 'Test Math Class', '{"assigned_subject_id": "11111111-0000-0000-0000-000000000001"}', '00000000-0000-0000-0000-000000000001')
  RETURNING id INTO math_group_id;

  -- Add student to math group
  INSERT INTO public.group_members (group_id, user_id, nickname)
  VALUES (math_group_id, '88888888-0000-0000-0000-000000000001', 'Alice');

  -- Step 5: Create student progress in BOTH subjects
  INSERT INTO public.skill_progress (user_id, skill_id, app_id, mastery_level, total_attempts, correct_attempts)
  VALUES
    -- Math progress (should be visible to mentor)
    ('88888888-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 75, 10, 8),
    -- Science progress (should be HIDDEN from Math mentor)
    ('88888888-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 85, 12, 10)
  ON CONFLICT (user_id, skill_id) DO NOTHING;

END $$;

-- Step 6: Test mentor query with RLS (simulating mentor's JWT)
-- Expected: Mentor should see ONLY Math progress (1 row), NOT Science
SET LOCAL app.current_app_id = '00000000-0000-0000-0000-000000000001';
SET LOCAL "request.jwt.claims" = '{"sub": "77777777-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Query as mentor
DO $$
DECLARE
  visible_count INTEGER;
  math_visible BOOLEAN;
  science_visible BOOLEAN;
BEGIN
  -- Count total visible rows
  SELECT COUNT(*) INTO visible_count
  FROM public.skill_progress sp
  JOIN public.skills s ON sp.skill_id = s.skill_id
  JOIN public.domains d ON s.domain_id = d.domain_id
  JOIN public.subjects sub ON d.subject_id = sub.subject_id
  WHERE sp.user_id = '88888888-0000-0000-0000-000000000001';

  -- Check if Math progress is visible
  SELECT EXISTS(
    SELECT 1 FROM public.skill_progress sp
    JOIN public.skills s ON sp.skill_id = s.skill_id
    WHERE sp.skill_id = '55555555-0000-0000-0000-000000000001'
    AND sp.user_id = '88888888-0000-0000-0000-000000000001'
  ) INTO math_visible;

  -- Check if Science progress is visible (should be FALSE)
  SELECT EXISTS(
    SELECT 1 FROM public.skill_progress sp
    JOIN public.skills s ON sp.skill_id = s.skill_id
    WHERE sp.skill_id = '66666666-0000-0000-0000-000000000002'
    AND sp.user_id = '88888888-0000-0000-0000-000000000001'
  ) INTO science_visible;

  -- ASSERTIONS
  IF visible_count = 1 AND math_visible AND NOT science_visible THEN
    RAISE NOTICE '✅ PASS: Mentor sees only Math subject progress (1 row)';
  ELSIF visible_count = 2 THEN
    RAISE EXCEPTION '❌ FAIL: VUL-002 DETECTED - Mentor sees cross-subject data! Expected 1 row (Math), got % rows (Math + Science)', visible_count;
  ELSIF visible_count = 0 THEN
    RAISE EXCEPTION '❌ FAIL: Mentor cannot see ANY student progress (RLS too restrictive)';
  ELSE
    RAISE EXCEPTION '❌ FAIL: Unexpected result. Visible count: %, Math visible: %, Science visible: %', visible_count, math_visible, science_visible;
  END IF;
END $$;

-- Cleanup
ROLLBACK;

-- ====================
-- EXPECTED OUTCOME
-- ====================
-- ✅ PASS: If proper RLS policies exist that filter by subject/domain assignment
-- ❌ FAIL: If mentor can see Science progress (vulnerability exists)
--
-- REMEDIATION (if test fails):
-- 1. Create mentor_subjects join table to track mentor assignments
-- 2. Update skill_progress RLS policy to check:
--    - Mentor owns a group containing the student
--    - Skill belongs to a subject/domain assigned to that mentor
-- 3. Example RLS policy:
--    CREATE POLICY mentor_view_assigned_subjects ON skill_progress FOR SELECT
--    USING (
--      app_id = current_setting('app.current_app_id')::uuid AND
--      user_id IN (
--        SELECT gm.user_id FROM group_members gm
--        JOIN groups g ON gm.group_id = g.id
--        WHERE g.owner_id = auth.uid()
--      ) AND
--      skill_id IN (
--        SELECT s.skill_id FROM skills s
--        JOIN domains d ON s.domain_id = d.domain_id
--        WHERE d.subject_id IN (
--          SELECT ms.subject_id FROM mentor_subjects ms
--          WHERE ms.mentor_id = auth.uid()
--        )
--      )
--    );
