-- =============================================================================
-- ALL MIGRATIONS COMBINED FOR SUPABASE DASHBOARD SQL EDITOR
-- =============================================================================
-- Project: Math7
-- Generated: 2026-01-27
-- Instructions:
--   1. Go to https://supabase.com/dashboard/project/qvslbiceoonrgjxzkotb/sql
--   2. Copy and paste this entire file into the SQL Editor
--   3. Click "Run" to execute all migrations
-- =============================================================================

-- Migration: 20260127000001_create_extensions_and_enums.sql
-- Description: Create enum types for user roles and question types

-- User Roles
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Question Types
DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM (
    'multiple_choice',  -- Single correct answer from options
    'mcq_multi',        -- Multiple correct answers allowed
    'text_input',       -- Free text entry
    'boolean',          -- True/False
    'reorder_steps'     -- Order items correctly
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Migration: 20260127000002_create_profiles.sql
-- Description: Create profiles table extending auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);
-- Migration: 20260127000003_create_domains.sql
-- Description: Create domains table for top-level subjects

CREATE TABLE IF NOT EXISTS public.domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9_]+$'),
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);
-- Migration: 20260127000004_create_skills.sql
-- Description: Create skills table for specific topics within domains

CREATE TABLE IF NOT EXISTS public.skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9_]+$'),
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  sort_order INTEGER DEFAULT 0 NOT NULL,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE(domain_id, slug)
);
-- Migration: 20260127000005_create_questions.sql
-- Description: Create questions table

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  type public.question_type DEFAULT 'multiple_choice'::public.question_type NOT NULL,
  content TEXT NOT NULL,
  options JSONB DEFAULT '{}'::jsonb NOT NULL,
  solution JSONB NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1 NOT NULL,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);
-- Migration: 20260127000006_create_attempts.sql
-- Description: Create attempts table for student answers

CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  response JSONB NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE NOT NULL,
  score_awarded INTEGER DEFAULT 0 NOT NULL,
  time_spent_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON public.attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_updated ON public.attempts(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_attempts_updated_at ON public.attempts(updated_at);
-- Migration: 20260127000007_create_sessions.sql
-- Description: Create sessions table for practice sessions

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  questions_attempted INTEGER DEFAULT 0 NOT NULL,
  questions_correct INTEGER DEFAULT 0 NOT NULL,
  total_time_ms INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON public.sessions(updated_at);
-- Migration: 20260127000008_create_skill_progress.sql
-- Description: Create skill_progress table for mastery tracking

CREATE TABLE IF NOT EXISTS public.skill_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  total_attempts INTEGER DEFAULT 0 NOT NULL,
  correct_attempts INTEGER DEFAULT 0 NOT NULL,
  total_points INTEGER DEFAULT 0 NOT NULL,
  mastery_level INTEGER DEFAULT 0 NOT NULL CHECK (mastery_level BETWEEN 0 AND 100),
  current_streak INTEGER DEFAULT 0 NOT NULL,
  best_streak INTEGER DEFAULT 0 NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, skill_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_progress_user_id ON public.skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_skill_id ON public.skill_progress(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_updated_at ON public.skill_progress(updated_at);
-- Migration: 20260127000009_create_outbox.sql
-- Description: Create outbox table for offline sync queue

CREATE TABLE IF NOT EXISTS public.outbox (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'UPSERT')),
  record_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  synced_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL
);
-- Migration: 20260127000010_create_sync_meta.sql
-- Description: Create sync_meta table for tracking sync timestamps

CREATE TABLE IF NOT EXISTS public.sync_meta (
  table_name TEXT PRIMARY KEY,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01T00:00:00Z',
  sync_version INTEGER DEFAULT 1 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
-- Migration: 20260127000011_create_curriculum_meta.sql
-- Description: Create curriculum_meta singleton table

CREATE TABLE IF NOT EXISTS public.curriculum_meta (
  id TEXT PRIMARY KEY DEFAULT 'singleton' CHECK (id = 'singleton'),
  version INTEGER DEFAULT 1 NOT NULL,
  last_published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Initialize singleton row
INSERT INTO public.curriculum_meta (id) VALUES ('singleton') ON CONFLICT DO NOTHING;
-- Migration: 20260127000012_create_indexes.sql
-- Description: Create performance indexes for domains, skills, questions
-- Note: Indexes for attempts, sessions, skill_progress are in their respective table files

-- Sync optimization indexes
CREATE INDEX IF NOT EXISTS idx_domains_updated_at ON public.domains(updated_at);
CREATE INDEX IF NOT EXISTS idx_skills_updated_at ON public.skills(updated_at);
CREATE INDEX IF NOT EXISTS idx_questions_updated_at ON public.questions(updated_at);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_skills_domain_id ON public.skills(domain_id);
CREATE INDEX IF NOT EXISTS idx_questions_skill_id ON public.questions(skill_id);

-- Published content indexes
CREATE INDEX IF NOT EXISTS idx_domains_published ON public.domains(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_skills_published ON public.skills(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_published ON public.questions(is_published) WHERE deleted_at IS NULL;
-- Migration: 20260127000013_create_triggers.sql
-- Description: Create triggers for updated_at and user creation

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile for new auth users (including anonymous)
-- If user_metadata contains role='admin', create as admin; otherwise create as student
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- Check if user should be admin (set via signup metadata)
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    user_role := 'admin'::public.user_role;
  ELSE
    user_role := 'student'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, role, email, full_name)
  VALUES (
    NEW.id,
    user_role,
    COALESCE(NEW.email, 'anonymous-' || NEW.id::text || '@device.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers: updated_at for all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at 
  BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_skills_updated_at ON public.skills;
CREATE TRIGGER update_skills_updated_at 
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at 
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_attempts_updated_at ON public.attempts;
CREATE TRIGGER update_attempts_updated_at 
  BEFORE UPDATE ON public.attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_skill_progress_updated_at ON public.skill_progress;
CREATE TRIGGER update_skill_progress_updated_at 
  BEFORE UPDATE ON public.skill_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_meta_updated_at ON public.sync_meta;
CREATE TRIGGER update_sync_meta_updated_at 
  BEFORE UPDATE ON public.sync_meta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260127000014_create_rls_policies.sql
-- Description: Create RLS policies and admin check function

-- Check if current user is admin (uses profiles.role)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_meta ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin());

-- Domains policies
DROP POLICY IF EXISTS "Admins full access to domains" ON public.domains;
CREATE POLICY "Admins full access to domains" ON public.domains
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Students can read published domains" ON public.domains;
CREATE POLICY "Students can read published domains" ON public.domains
  FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- Skills policies
DROP POLICY IF EXISTS "Admins full access to skills" ON public.skills;
CREATE POLICY "Admins full access to skills" ON public.skills
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Students can read published skills" ON public.skills;
CREATE POLICY "Students can read published skills" ON public.skills
  FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- Questions policies
DROP POLICY IF EXISTS "Admins full access to questions" ON public.questions;
CREATE POLICY "Admins full access to questions" ON public.questions
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Students can read published questions" ON public.questions;
CREATE POLICY "Students can read published questions" ON public.questions
  FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- Attempts policies
DROP POLICY IF EXISTS "Students can insert own attempts" ON public.attempts;
CREATE POLICY "Students can insert own attempts" ON public.attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can view own attempts" ON public.attempts;
CREATE POLICY "Students can view own attempts" ON public.attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all attempts" ON public.attempts;
CREATE POLICY "Admins can view all attempts" ON public.attempts
  FOR SELECT USING (is_admin());

-- Sessions policies
DROP POLICY IF EXISTS "Students can insert own sessions" ON public.sessions;
CREATE POLICY "Students can insert own sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can view own sessions" ON public.sessions;
CREATE POLICY "Students can view own sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own sessions" ON public.sessions;
CREATE POLICY "Students can update own sessions" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;
CREATE POLICY "Admins can view all sessions" ON public.sessions
  FOR SELECT USING (is_admin());

-- Skill Progress policies
DROP POLICY IF EXISTS "Students can insert own progress" ON public.skill_progress;
CREATE POLICY "Students can insert own progress" ON public.skill_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can view own progress" ON public.skill_progress;
CREATE POLICY "Students can view own progress" ON public.skill_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own progress" ON public.skill_progress;
CREATE POLICY "Students can update own progress" ON public.skill_progress
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all progress" ON public.skill_progress;
CREATE POLICY "Admins can view all progress" ON public.skill_progress
  FOR SELECT USING (is_admin());

-- Outbox policies (Server-side reference only, Admin only)
DROP POLICY IF EXISTS "Admins full access to outbox" ON public.outbox;
CREATE POLICY "Admins full access to outbox" ON public.outbox
  FOR ALL USING (is_admin());

-- Sync Meta policies (Server-side reference only, Admin only)
DROP POLICY IF EXISTS "Admins full access to sync_meta" ON public.sync_meta;
CREATE POLICY "Admins full access to sync_meta" ON public.sync_meta
  FOR ALL USING (is_admin());

-- Curriculum Meta policies (Public Read for version check, Admin Write)
DROP POLICY IF EXISTS "Everyone can read curriculum_meta" ON public.curriculum_meta;
CREATE POLICY "Everyone can read curriculum_meta" ON public.curriculum_meta
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update curriculum_meta" ON public.curriculum_meta;
CREATE POLICY "Admins can update curriculum_meta" ON public.curriculum_meta
  FOR UPDATE USING (is_admin());
-- Migration: 20260127000015_create_rpc_functions.sql
-- Description: Create RPC functions for curriculum publishing and batch attempts

-- Atomic Publish Curriculum
CREATE OR REPLACE FUNCTION public.publish_curriculum()
RETURNS void AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can publish';
  END IF;

  -- Validate: No orphaned skills
  IF EXISTS (
    SELECT 1 FROM public.skills s
    LEFT JOIN public.domains d ON s.domain_id = d.id
    WHERE d.id IS NULL OR d.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned skills detected';
  END IF;

  -- Validate: No orphaned questions
  IF EXISTS (
    SELECT 1 FROM public.questions q
    LEFT JOIN public.skills s ON q.skill_id = s.id
    WHERE s.id IS NULL OR s.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned questions detected';
  END IF;

  -- Validate: All published domains have at least one skill
  IF EXISTS (
    SELECT 1 FROM public.domains d
    WHERE d.is_published = true AND d.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.skills s 
      WHERE s.domain_id = d.id AND s.deleted_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'Cannot publish: empty domains detected';
  END IF;

  -- Bump curriculum version
  UPDATE public.curriculum_meta SET 
    version = version + 1,
    last_published_at = NOW(),
    updated_at = NOW()
  WHERE id = 'singleton';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Batch Submit Attempts (for offline sync)
-- This is the PRIMARY and ONLY way students submit attempts
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
    INSERT INTO public.attempts (
      id,
      user_id,
      question_id,
      response,
      is_correct,
      score_awarded,
      time_spent_ms,
      created_at,
      updated_at
    ) VALUES (
      (attempt_item->>'id')::UUID,
      auth.uid(),
      (attempt_item->>'question_id')::UUID,
      attempt_item->'response',
      (attempt_item->>'is_correct')::BOOLEAN,
      COALESCE((attempt_item->>'score_awarded')::INTEGER, 0),
      (attempt_item->>'time_spent_ms')::INTEGER,
      COALESCE((attempt_item->>'created_at')::TIMESTAMPTZ, NOW()),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      response = EXCLUDED.response,
      is_correct = EXCLUDED.is_correct,
      score_awarded = EXCLUDED.score_awarded,
      time_spent_ms = EXCLUDED.time_spent_ms,
      updated_at = NOW()
    WHERE public.attempts.user_id = auth.uid()
    RETURNING * INTO result_record;
    
    IF result_record.id IS NOT NULL THEN
      RETURN NEXT result_record;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Delete own account (soft delete profile, user must be re-created to login again)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Soft delete the profile
  UPDATE public.profiles 
  SET deleted_at = NOW(),
      email = 'deleted-' || auth.uid()::text || '@deleted.local',
      full_name = 'Deleted User'
  WHERE id = auth.uid();
  
  -- Delete related data (attempts, sessions, skill_progress)
  UPDATE public.attempts SET deleted_at = NOW() WHERE user_id = auth.uid();
  UPDATE public.sessions SET deleted_at = NOW() WHERE user_id = auth.uid();
  UPDATE public.skill_progress SET deleted_at = NOW() WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Deactivate own account (sets deleted_at, can be reactivated by admin)
CREATE OR REPLACE FUNCTION public.deactivate_own_account()
RETURNS void AS $$
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Set deleted_at to mark as deactivated
  UPDATE public.profiles 
  SET deleted_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restrict RPC execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.deactivate_own_account() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_own_account() TO authenticated;

-- =============================================================================
-- SEED DATA
-- =============================================================================

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
