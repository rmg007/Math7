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
