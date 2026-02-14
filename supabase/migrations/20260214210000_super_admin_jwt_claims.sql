-- ============================================================================
-- SUPER ADMIN CROSS-TENANT ACCESS: JWT CLAIMS SETUP
-- Date: 2026-02-14
-- Author: Antigravity
-- Description: Ensure user_role is included in JWT claims for RLS policies
-- ============================================================================

-- Function to set custom JWT claims with user role
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    user_role text;
    claims jsonb;
BEGIN
    -- Get user role from profiles table
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = (event->>'user_id')::uuid;

    -- Set default role if not found
    user_role := COALESCE(user_role, 'student');

    -- Get existing claims
    claims := COALESCE(event->'claims', '{}'::jsonb);

    -- Add user_role to claims
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));

    -- Return updated event
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;

-- Note: This function needs to be configured in Supabase Auth settings
-- In the Supabase dashboard, go to Authentication > Hooks and set:
-- Custom Access Token Hook: public.custom_access_token_hook

-- Alternative approach: Update existing JWT helper functions to check database
-- instead of relying on JWT claims (more reliable but slightly slower)

CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_is_mentor()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'mentor'
    ),
    false
  );
$$;</content>
<parameter name="filePath">/workspaces/Questerix/supabase/migrations/20260214210000_super_admin_jwt_claims.sql