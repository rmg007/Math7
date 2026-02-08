-- Fix infinite recursion in groups RLS policies
-- The issue is that super admin policy queries profiles table which might trigger recursion
-- Solution: Drop all existing policies and recreate them in the correct order

-- Drop all existing policies on groups
DROP POLICY IF EXISTS "Mentors manage their own groups" ON groups;
DROP POLICY IF EXISTS "Students read their groups" ON groups;
DROP POLICY IF EXISTS "Super admins read all groups" ON groups;
DROP POLICY IF EXISTS "Super admins manage all groups" ON groups;

-- Create new policies without recursion
-- Policy 1: Super admins can do everything (check role from JWT claims)
CREATE POLICY "Super admins full access" ON groups
    FOR ALL
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
    );

-- Policy 2: Mentors manage their own groups
CREATE POLICY "Mentors manage own groups" ON groups
    FOR ALL
    USING (auth.uid() = owner_id);

-- Policy 3: Students can read groups they're members of
CREATE POLICY "Students read their groups" ON groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );
