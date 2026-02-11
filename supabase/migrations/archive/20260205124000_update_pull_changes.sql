-- ══════════════════════════════════════════════════════════════════════════════
-- RPC UPDATE: ENHANCE PULL_CHANGES FOR MASTERY SYNC
-- Migration: 20260205124000_update_pull_changes.sql
-- Purpose: Add skill_progress to allowed tables in pull_changes to enable 
--          cross-device mastery synchronization.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.pull_changes(table_name text, last_sync_time timestamp with time zone)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_records JSONB;
  deleted_records JSONB;
  allowed_tables TEXT[] := ARRAY['questions', 'skills', 'domains', 'skill_progress'];
BEGIN
  -- Security check
  IF NOT (table_name = ANY(allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- 1. Fetch active records updated since last_sync_time
  -- Note: FOR SELECT policies handle multi-tenant isolation (user_id = auth.uid())
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (
      SELECT * FROM %I 
      WHERE updated_at > $1 
        AND deleted_at IS NULL 
      ORDER BY updated_at ASC 
      LIMIT 1000
    ) t',
    table_name
  ) INTO active_records USING last_sync_time;

  -- 2. Fetch tombstoned records deleted since last_sync_time
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(jsonb_build_object(''id'', id, ''deleted_at'', deleted_at)), ''[]''::jsonb) FROM (
      SELECT id, deleted_at FROM %I 
      WHERE deleted_at > $1 
        AND deleted_at IS NULL = FALSE
      ORDER BY deleted_at ASC 
      LIMIT 1000
    ) t',
    table_name
  ) INTO deleted_records USING last_sync_time;

  -- 3. Return both active and deleted records
  RETURN jsonb_build_object(
    'active', active_records,
    'deleted', deleted_records,
    'synced_at', NOW()
  );
END;
$$;
