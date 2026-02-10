-- FIX: is_tenant_admin() referenced non-existent 'is_admin' column on profiles table.
-- The profiles table uses 'role' enum (user_role), not a boolean 'is_admin'.
-- Applied via Supabase Dashboard SQL Editor on 2026-02-09.
-- See: docs/supabase/rls-policy-debugging.md

-- ============================================================================
-- 1. Fix the broken SECURITY DEFINER function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
        AND app_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 2. Drop conflicting policies from hardening migration (20260210001105)
--    These redundantly queried profiles with its own RLS, causing issues.
-- ============================================================================
DROP POLICY IF EXISTS "Super Admins full access to domains" ON domains;
DROP POLICY IF EXISTS "Admins full access to their app domains" ON domains;
DROP POLICY IF EXISTS "Admins can access their app domains" ON domains;

DROP POLICY IF EXISTS "Super Admins full access to skills" ON skills;
DROP POLICY IF EXISTS "Admins full access to their app skills" ON skills;
DROP POLICY IF EXISTS "Admins can access their app skills" ON skills;

DROP POLICY IF EXISTS "Super Admins full access to questions" ON questions;
DROP POLICY IF EXISTS "Admins full access to their app questions" ON questions;
DROP POLICY IF EXISTS "Admins can access their app questions" ON questions;

DROP POLICY IF EXISTS "Super Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view their app profiles" ON profiles;

DROP POLICY IF EXISTS "Super Admins full access to subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can view subjects" ON subjects;

DROP POLICY IF EXISTS "Super Admins can view all apps" ON apps;
DROP POLICY IF EXISTS "Admins can view their own app" ON apps;
DROP POLICY IF EXISTS "Super Admins full access to apps" ON apps;

DROP POLICY IF EXISTS "Super Admins can manage invitation codes" ON invitation_codes;
