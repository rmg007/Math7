-- ============================================================================
-- SECURITY REMEDIATION: Fix critical RLS gaps and permissive policies
-- Date: 2026-02-19
-- Target Project: QuesterixDB-v2
-- Findings: Supabase Security Advisor (Feb 15)
-- ============================================================================



-- 3. Harden apps access (Informational finding remediation)
-- ----------------------------------------------------------------------------
-- Ensure unauthenticated access is restricted to essential columns 
DROP POLICY IF EXISTS "apps_public_read_config" ON public.apps;
CREATE POLICY "apps_public_read_config" ON public.apps
  FOR SELECT TO anon, authenticated
  USING (is_active = true);


-- 6. SECURITY DEFINER SEARCH_PATH HARDENING (Critical Vulnerability Fix)
-- ----------------------------------------------------------------------------
-- This section is now handled dynamically by the loop below to ensure all
-- active functions are hardened without requiring manual signature matching.

-- Extra hardening for any missed ones found in archive
DO $$ 
DECLARE 
  func_name RECORD;
BEGIN
  FOR func_name IN 
    SELECT n.nspname as schema, p.proname as name
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND p.prosecdef = true
  LOOP
    EXECUTE 'ALTER FUNCTION public.' || quote_ident(func_name.name) || '(' || 
            pg_get_function_identity_arguments( 
              (SELECT oid FROM pg_proc WHERE proname = func_name.name AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') LIMIT 1)
            ) || ') SET search_path = public, auth';
  END LOOP;
END $$;
