-- Migration: 20260127000010_create_sync_meta.sql
-- Description: Create sync_meta table for tracking sync timestamps

CREATE TABLE IF NOT EXISTS public.sync_meta (
  table_name TEXT PRIMARY KEY,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01T00:00:00Z',
  sync_version INTEGER DEFAULT 1 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
