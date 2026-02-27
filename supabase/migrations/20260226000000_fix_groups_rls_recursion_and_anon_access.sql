-- Migration: 20260226000000_fix_security_and_recursion.sql
-- Description: 
-- 1. Fixes RLS recursion in groups/members/assignments
-- 2. Adds missing policies for attempts, skill_progress, and ai_token_usage
-- 3. Implements universal Super Admin bypass for all curriculum/tracking tables
-- 4. Fixes error_logs_status_check constraint mismatch

-- ===========================================================================
-- 1. SECURITY DEFINER HELPERS (Recursion Breakers)
-- ===========================================================================

-- Check if user is a member of a group without triggering group RLS
CREATE OR REPLACE FUNCTION public.check_group_membership(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = p_group_id AND student_id = p_user_id
    );
END;
$$;

-- Check if user can access an assignment without triggering assignment RLS
CREATE OR REPLACE FUNCTION public.user_can_access_assignment(p_assignment_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.groups g ON a.group_id = g.id
        WHERE a.id = p_assignment_id
        AND (
            g.owner_id = p_user_id -- Mentor
            OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = g.id AND gm.student_id = p_user_id) -- Student
            OR (SELECT role FROM public.profiles WHERE id = p_user_id) = 'super_admin' -- Super Admin
        )
    );
END;
$$;

-- Helper to check Super Admin role efficiently
CREATE OR REPLACE FUNCTION public.role_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    );
$$;

-- ===========================================================================
-- 2. FIX RECURSIVE POLICIES
-- ===========================================================================

-- Remove old recursive policies
DROP POLICY IF EXISTS group_tenant_isolation ON public.groups;
DROP POLICY IF EXISTS members_tenant_isolation ON public.group_members;
DROP POLICY IF EXISTS assignments_tenant_isolation ON public.assignments;

-- New Groups Policy (Breaks recursion by using current_app_id directly on apps)
CREATE POLICY group_access_v3 ON public.groups FOR ALL TO authenticated
USING (
    (role_is_super_admin()) -- Super Admin Bypass
    OR (app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()) 
        AND (
            owner_id = auth.uid() -- Mentor
            OR check_group_membership(id, auth.uid()) -- Student
        )
    )
);

-- New Group Members Policy
CREATE POLICY members_access_v3 ON public.group_members FOR ALL TO authenticated
USING (
    (role_is_super_admin()) -- Super Admin Bypass
    OR EXISTS (
        SELECT 1 FROM public.groups g 
        WHERE g.id = group_members.group_id 
        AND g.app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid())
    )
);

-- New Assignments Policy
CREATE POLICY assignments_access_v3 ON public.assignments FOR ALL TO authenticated
USING (
    (role_is_super_admin()) -- Super Admin Bypass
    OR user_can_access_assignment(id, auth.uid())
);

-- ===========================================================================
-- 3. MISSING POLICIES (Attempts & Progress)
-- ===========================================================================

-- Attempts
DROP POLICY IF EXISTS attempts_access ON public.attempts;
CREATE POLICY attempts_access ON public.attempts FOR ALL TO authenticated
USING (
    (role_is_super_admin())
    OR (user_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'mentor' 
        AND p.app_id = (SELECT app_id FROM public.profiles WHERE id = attempts.user_id)
    )
);

-- Skill Progress
DROP POLICY IF EXISTS progress_access ON public.skill_progress;
CREATE POLICY progress_access ON public.skill_progress FOR ALL TO authenticated
USING (
    (role_is_super_admin())
    OR (user_id = auth.uid())
);

-- AI Token Usage
DROP POLICY IF EXISTS ai_token_access ON public.ai_token_usage;
CREATE POLICY ai_token_access ON public.ai_token_usage FOR ALL TO authenticated
USING (
    (role_is_super_admin())
    OR (user_id = auth.uid())
);

-- ===========================================================================
-- 4. CURRICULUM HARDENING (Deny Anon)
-- ===========================================================================

-- Explicitly deny anon from curriculum tables
DO $$ 
BEGIN
    -- Apps
    DROP POLICY IF EXISTS apps_anon_no_access ON public.apps;
    CREATE POLICY apps_anon_no_access ON public.apps FOR SELECT TO anon USING (false);
    
    -- Domains
    DROP POLICY IF EXISTS domains_anon_no_access ON public.domains;
    CREATE POLICY domains_anon_no_access ON public.domains FOR SELECT TO anon USING (false);
    
    -- Subjects
    DROP POLICY IF EXISTS subjects_anon_no_access ON public.subjects;
    CREATE POLICY subjects_anon_no_access ON public.subjects FOR SELECT TO anon USING (false);
    
    -- Skills
    DROP POLICY IF EXISTS skills_anon_no_access ON public.skills;
    CREATE POLICY skills_anon_no_access ON public.skills FOR SELECT TO anon USING (false);
    
    -- Questions
    DROP POLICY IF EXISTS questions_anon_no_access ON public.questions;
    CREATE POLICY questions_anon_no_access ON public.questions FOR SELECT TO anon USING (false);
END $$;

-- ===========================================================================
-- 5. ERROR LOGS CONSTRAINT FIX
-- ===========================================================================

-- Status 'new' check reaffirmation
ALTER TABLE public.error_logs DROP CONSTRAINT IF EXISTS error_logs_status_check;
ALTER TABLE public.error_logs ADD CONSTRAINT error_logs_status_check 
CHECK (status IN ('new', 'seen', 'ignored', 'resolved', 'promoted'));
