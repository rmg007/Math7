-- PROPER FIX FOR GROUPS RLS INFINITE RECURSION
-- This migration properly implements RLS on groups table without infinite recursion

-- Step 1: Re-enable RLS on groups table (was disabled as temporary workaround)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on groups
DROP POLICY IF EXISTS "Super admins full access to groups" ON groups;
DROP POLICY IF EXISTS "Mentors manage own groups" ON groups;
DROP POLICY IF EXISTS "Students read their groups" ON groups;

-- Step 3: Update the is_super_admin function to properly bypass RLS
-- The key is SECURITY DEFINER which runs with the function OWNER's privileges
DROP FUNCTION IF EXISTS public.is_super_admin();
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- This makes the function run with elevated privileges
SET search_path = public  -- Security best practice
AS $$
DECLARE
  user_role text;
BEGIN
  -- This query will bypass RLS because of SECURITY DEFINER
  -- The function owner (postgres/supabase_admin) has full access to profiles
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'super_admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;  -- Fail safely if there's any error
END;
$$;

-- Step 4: Create helper function for checking if user is mentor (owner)
CREATE OR REPLACE FUNCTION public.is_group_owner(group_owner_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid() = group_owner_id;
END;
$$;

-- Step 5: Create the policies using these helper functions
-- Policy 1: Super admins can do everything
CREATE POLICY "Super admins full access"
ON groups
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Policy 2: Mentors can manage their own groups
CREATE POLICY "Mentors manage own groups"
ON groups
FOR ALL
TO authenticated
USING (is_group_owner(owner_id))
WITH CHECK (is_group_owner(owner_id));

-- Policy 3: Students can view groups they're members of
CREATE POLICY "Students read member groups"
ON groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- Step 6: Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_owner(uuid) TO authenticated;

-- Step 7: Set the function owner to ensure SECURITY DEFINER works correctly
-- The functions should be owned by a user with full access to profiles
ALTER FUNCTION public.is_super_admin() OWNER TO postgres;
ALTER FUNCTION public.is_group_owner(uuid) OWNER TO postgres;

-- Verification: List all policies on groups table
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'groups';
