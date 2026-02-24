-- HARDEN JWT HELPER FUNCTIONS
-- This migration redefines the JWT helper functions as SECURITY DEFINER
-- to prevent infinite recursion in RLS policies that query the profiles table.

-- 1. jwt_is_admin
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    ),
    false
  );
$$;

-- 2. jwt_is_super_admin
CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    ),
    false
  );
$$;

-- 3. jwt_is_mentor
CREATE OR REPLACE FUNCTION public.jwt_is_mentor()
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'mentor'
    ),
    false
  );
$$;

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.jwt_is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.jwt_is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.jwt_is_mentor() TO authenticated, anon;

-- 5. Set Ownership
ALTER FUNCTION public.jwt_is_admin() OWNER TO postgres;
ALTER FUNCTION public.jwt_is_super_admin() OWNER TO postgres;
ALTER FUNCTION public.jwt_is_mentor() OWNER TO postgres;
