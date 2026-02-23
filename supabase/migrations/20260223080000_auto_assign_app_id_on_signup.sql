-- ============================================================================
-- AUTO-ASSIGN APP_ID ON SIGNUP
-- Migration: 20260223080000_auto_assign_app_id_on_signup.sql
-- Date: 2026-02-23
-- Problem: New users created without an app_id in their profile row cause
--          pull_changes() to throw 'Unauthorized: Missing tenant context'
--          because current_app_id() reads from profiles.app_id.
-- Solution: Update handle_new_user to always assign app_id by:
--   1. Using the app_id passed via raw_user_meta_data (for explicit tenant flows)
--   2. Falling back to the first published app_id (single-tenant / dev setup)
-- ============================================================================

-- Helper: Returns the default (first/only) app_id for single-tenant deployments.
-- This is used as a fallback when no app_id is supplied at signup.
CREATE OR REPLACE FUNCTION public.get_default_app_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT DISTINCT app_id
  FROM public.domains
  WHERE app_id IS NOT NULL
    AND deleted_at IS NULL
  ORDER BY app_id
  LIMIT 1;
$$;

-- Update handle_new_user to use the app_id fallback.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  v_app_id UUID;
BEGIN
  -- 1. Prefer explicit app_id from signup metadata (multi-tenant flows)
  v_app_id := (NEW.raw_user_meta_data->>'app_id')::UUID;

  -- 2. Fall back to the platform default (single-tenant / dev)
  IF v_app_id IS NULL THEN
    v_app_id := public.get_default_app_id();
  END IF;

  INSERT INTO public.profiles (id, role, email, full_name, app_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.email, 'anonymous-' || NEW.id::text || '@device.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_app_id
  )
  ON CONFLICT (id) DO UPDATE
    SET
      -- Only backfill app_id if it is currently NULL (don't clobber existing value)
      app_id = CASE
                 WHEN profiles.app_id IS NULL THEN EXCLUDED.app_id
                 ELSE profiles.app_id
               END,
      updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Ensure the trigger still exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- BACKFILL: bring any existing profiles with NULL app_id up to date
-- This covers accounts created before this migration was applied.
-- ============================================================================
UPDATE public.profiles
SET app_id    = public.get_default_app_id(),
    updated_at = NOW()
WHERE app_id IS NULL
  AND public.get_default_app_id() IS NOT NULL;
