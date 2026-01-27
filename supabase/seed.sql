-- Seed Data for AppShell Development
-- =================================
-- This file is run automatically after migrations via `supabase db reset`
-- 
-- IMPORTANT NOTES:
-- 1. Admin users must be created via Supabase Dashboard or Auth API first
-- 2. The handle_new_user() trigger auto-creates profiles with role='student'
-- 3. To make a user an admin: UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- 4. All content is created with is_published=false for safety
-- 5. Run `UPDATE public.domains SET is_published = true WHERE slug = 'mathematics';` to publish

BEGIN;

-- =============================================================================
-- SAMPLE DOMAIN
-- =============================================================================

INSERT INTO public.domains (id, slug, title, description, sort_order, is_published)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'mathematics',
  'Mathematics',
  'Fundamental mathematical concepts and problem-solving skills.',
  1,
  false  -- Set to true when ready to publish
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- SAMPLE SKILL
-- =============================================================================

INSERT INTO public.skills (id, domain_id, slug, title, description, difficulty_level, sort_order, is_published)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'basic_algebra',
  'Basic Algebra',
  'Introduction to algebraic expressions and equations.',
  1,
  1,
  false
)
ON CONFLICT (domain_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty_level = EXCLUDED.difficulty_level,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- SAMPLE QUESTIONS (All 5 question types demonstrated)
-- =============================================================================

-- Question 1: Multiple Choice (single answer)
INSERT INTO public.questions (id, skill_id, type, content, options, solution, explanation, points, is_published)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'multiple_choice',
  'What is the value of x in the equation: 2x + 4 = 10?',
  '{"options": [{"id": "a", "text": "2"}, {"id": "b", "text": "3"}, {"id": "c", "text": "4"}, {"id": "d", "text": "5"}]}'::jsonb,
  '{"correct_option_id": "b"}'::jsonb,
  'Subtract 4 from both sides: 2x = 6. Divide by 2: x = 3.',
  1,
  false
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  options = EXCLUDED.options,
  solution = EXCLUDED.solution,
  explanation = EXCLUDED.explanation;

-- Question 2: Text Input
INSERT INTO public.questions (id, skill_id, type, content, options, solution, explanation, points, is_published)
VALUES (
  'd4e5f6a7-b8c9-0123-def0-234567890123',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'text_input',
  'Simplify the expression: 3(x + 2) - x',
  '{"placeholder": "Enter simplified expression (e.g., 2x + 6)"}'::jsonb,
  '{"exact_match": "2x + 6", "case_sensitive": false}'::jsonb,
  'Distribute: 3x + 6 - x = 2x + 6',
  2,
  false
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  options = EXCLUDED.options,
  solution = EXCLUDED.solution,
  explanation = EXCLUDED.explanation;

-- Question 3: Boolean (True/False)
INSERT INTO public.questions (id, skill_id, type, content, options, solution, explanation, points, is_published)
VALUES (
  'e5f6a7b8-c9d0-1234-ef01-345678901234',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'boolean',
  'True or False: The equation x + 5 = 5 has the solution x = 0.',
  '{}'::jsonb,
  '{"correct_value": true}'::jsonb,
  'Subtracting 5 from both sides gives x = 0.',
  1,
  false
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  solution = EXCLUDED.solution,
  explanation = EXCLUDED.explanation;

-- Question 4: Multiple Choice Multi-Select (MCQ Multi)
INSERT INTO public.questions (id, skill_id, type, content, options, solution, explanation, points, is_published)
VALUES (
  'f6a7b8c9-d0e1-2345-f012-456789012345',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'mcq_multi',
  'Which of the following are valid algebraic expressions? (Select all that apply)',
  '{"options": [{"id": "a", "text": "3x + 2"}, {"id": "b", "text": "5 = 10"}, {"id": "c", "text": "y - 7"}, {"id": "d", "text": "2 + 2 = 4"}]}'::jsonb,
  '{"correct_option_ids": ["a", "c"]}'::jsonb,
  'An expression does not contain an equals sign. "3x + 2" and "y - 7" are expressions. The others are equations.',
  2,
  false
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  options = EXCLUDED.options,
  solution = EXCLUDED.solution,
  explanation = EXCLUDED.explanation;

-- Question 5: Reorder Steps
INSERT INTO public.questions (id, skill_id, type, content, options, solution, explanation, points, is_published)
VALUES (
  'a7b8c9d0-e1f2-3456-0123-567890123456',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'reorder_steps',
  'Put these steps in the correct order to solve 3x - 6 = 12:',
  '{"steps": [{"id": "1", "text": "Add 6 to both sides"}, {"id": "2", "text": "Divide both sides by 3"}, {"id": "3", "text": "x = 6"}]}'::jsonb,
  '{"correct_order": ["1", "2", "3"]}'::jsonb,
  'Step 1: 3x - 6 + 6 = 12 + 6 → 3x = 18. Step 2: 3x/3 = 18/3 → x = 6.',
  2,
  false
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  options = EXCLUDED.options,
  solution = EXCLUDED.solution,
  explanation = EXCLUDED.explanation;

-- =============================================================================
-- INITIALIZE SINGLETON ROWS (if not already created by migration)
-- =============================================================================

INSERT INTO public.curriculum_meta (id) VALUES ('singleton') ON CONFLICT DO NOTHING;

INSERT INTO public.sync_meta (table_name) VALUES
  ('domains'),
  ('skills'),
  ('questions'),
  ('attempts'),
  ('sessions'),
  ('skill_progress')
ON CONFLICT (table_name) DO NOTHING;

COMMIT;

-- =============================================================================
-- POST-SEED INSTRUCTIONS
-- =============================================================================
-- 
-- To create an admin user:
-- 1. Create user via Supabase Dashboard (Authentication > Users > Add User)
-- 2. Run: UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
--
-- To publish content for students:
-- 1. Review content in Admin Panel
-- 2. Run: UPDATE public.domains SET is_published = true WHERE slug = 'mathematics';
--    Run: UPDATE public.skills SET is_published = true WHERE domain_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
--    Run: UPDATE public.questions SET is_published = true WHERE skill_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
-- 
-- Or use the Admin Panel's publish workflow (preferred).
-- =============================================================================
