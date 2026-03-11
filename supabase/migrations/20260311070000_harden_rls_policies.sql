-- Migration: Harden RLS Policies
-- Description: Add missing tenant isolation policies for attempts, sessions, and skill_progress.

-- 1. Attempts Isolation
DO $$ BEGIN
    DROP POLICY IF EXISTS attempts_isolation ON public.attempts;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY attempts_isolation ON public.attempts
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- 2. Sessions Isolation
DO $$ BEGIN
    DROP POLICY IF EXISTS sessions_isolation ON public.sessions;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY sessions_isolation ON public.sessions
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- 3. Skill Progress Isolation
DO $$ BEGIN
    DROP POLICY IF EXISTS skill_progress_isolation ON public.skill_progress;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY skill_progress_isolation ON public.skill_progress
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- 4. Verify RLS is enabled (redundant but safe)
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;
