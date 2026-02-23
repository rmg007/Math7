-- Migration: 20260206000005_sync_tombstones.sql
-- Description: Implement Tombstone Pattern for deletion propagation
-- Fixes: Ghost Data Bug - ensures deleted records are propagated to offline devices

-- ========================================
-- TOMBSTONE SYNC RPC
-- ========================================
-- This RPC bypasses RLS to return both active and deleted records
-- Enables clients to properly handle deletions in offline-first sync

CREATE OR REPLACE FUNCTION public.pull_changes(
  table_name TEXT,
  last_sync_time TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_records JSONB;
  deleted_records JSONB;
  allowed_tables TEXT[] := ARRAY['questions', 'skills', 'domains'];
BEGIN
  -- Security: Only allow specific tables
  IF NOT (table_name = ANY(allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Fetch active records (normal sync)
  -- Only published, non-deleted records
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (
      SELECT * FROM %I 
      WHERE updated_at > $1 
        AND deleted_at IS NULL
        AND is_published = true
      ORDER BY updated_at ASC
      LIMIT 1000
    ) t',
    table_name
  ) INTO active_records USING last_sync_time;
  
  -- Fetch tombstones (deleted records)
  -- Return minimal data: just ID and deletion timestamp
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(jsonb_build_object(''id'', id, ''deleted_at'', deleted_at)), ''[]''::jsonb) FROM (
      SELECT id, deleted_at FROM %I 
      WHERE deleted_at > $1
        AND deleted_at IS NOT NULL
      ORDER BY deleted_at ASC
      LIMIT 1000
    ) t',
    table_name
  ) INTO deleted_records USING last_sync_time;
  
  -- Return both active and deleted records
  RETURN jsonb_build_object(
    'active', active_records,
    'deleted', deleted_records,
    'synced_at', NOW()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.pull_changes(TEXT, TIMESTAMPTZ) TO authenticated;

-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON FUNCTION public.pull_changes IS 
'Tombstone Pattern sync RPC. Returns both active and deleted records for offline-first sync.
Security: DEFINER mode bypasses RLS to return tombstones, but only for allowed tables.
Performance: Limited to 1000 records per call to prevent memory issues.';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Test the function:
-- SELECT public.pull_changes('questions', '2026-01-01T00:00:00Z'::timestamptz);
-- 
-- Expected output:
-- {
--   "active": [...array of active questions...],
--   "deleted": [...array of {id, deleted_at}...],
--   "synced_at": "2026-02-06T10:15:30Z"
-- }
