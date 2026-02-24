-- Migration: 20260222145000_fix_list_snapshots_auth.sql
-- Description: Fix list_curriculum_snapshots RPC to use 'role' instead of 'is_admin'.

CREATE OR REPLACE FUNCTION public.list_curriculum_snapshots(
  p_app_id UUID
)
RETURNS TABLE (
  version           INTEGER,
  domains_count     INTEGER,
  skills_count      INTEGER,
  questions_count   INTEGER,
  published_at      TIMESTAMPTZ,
  published_by      UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only admins of this app may list snapshots
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id      = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND app_id   = p_app_id
  ) THEN
    RAISE EXCEPTION 'list_curriculum_snapshots: Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    cs.version,
    cs.domains_count,
    cs.skills_count,
    cs.questions_count,
    cs.published_at,
    cs.published_by
  FROM public.curriculum_snapshots cs
  WHERE cs.app_id = p_app_id
  ORDER BY cs.version DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_curriculum_snapshots(UUID) TO authenticated;
