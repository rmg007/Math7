-- Migration: 20260127000011_create_curriculum_meta.sql
-- Description: Create curriculum_meta singleton table

CREATE TABLE IF NOT EXISTS public.curriculum_meta (
  id TEXT PRIMARY KEY DEFAULT 'singleton' CHECK (id = 'singleton'),
  version INTEGER DEFAULT 1 NOT NULL,
  last_published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Initialize singleton row
INSERT INTO public.curriculum_meta (id) VALUES ('singleton') ON CONFLICT DO NOTHING;
