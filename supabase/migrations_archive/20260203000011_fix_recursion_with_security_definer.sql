-- Fix infinite recursion by using a SECURITY DEFINER function
-- This prevents the RLS policy from recursively checking profiles

-- Drop all policies again
DROP POLICY IF EXISTS "Super admins full access" ON groups;
DROP POLICY IF EXISTS "Mentors manage own groups" ON groups;
DROP POLICY IF EXISTS "Students read their groups" ON groups;

-- Create a SECURITY DEFINER function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the function
CREATE POLICY "Super admins full access" ON groups
    FOR ALL
    USING (is_super_admin());

CREATE POLICY "Mentors manage own groups" ON groups
    FOR ALL
    USING (auth.uid() = owner_id);

CREATE POLICY "Students read their groups" ON groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );
