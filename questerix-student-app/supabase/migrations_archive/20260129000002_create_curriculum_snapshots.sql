-- Migration: 20260129000002_create_curriculum_snapshots.sql
-- Description: Create curriculum_snapshots table and update publish_curriculum to save history

-- Create the snapshots table
CREATE TABLE IF NOT EXISTS public.curriculum_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version integer NOT NULL UNIQUE,
  published_at timestamptz NOT NULL DEFAULT NOW(),
  domains_count integer NOT NULL DEFAULT 0,
  skills_count integer NOT NULL DEFAULT 0,
  questions_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.curriculum_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: admins can view snapshots
CREATE POLICY "Admins can view snapshots" ON public.curriculum_snapshots
  FOR SELECT USING (is_admin());

-- Update publish_curriculum to save snapshots and validate content exists
CREATE OR REPLACE FUNCTION public.publish_curriculum()
RETURNS void AS $$
DECLARE
  v_domains_count integer;
  v_skills_count integer;
  v_questions_count integer;
  v_new_version integer;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can publish';
  END IF;

  -- Count published content
  SELECT COUNT(*) INTO v_domains_count FROM public.domains WHERE is_published = true AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_skills_count FROM public.skills WHERE is_published = true AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_questions_count FROM public.questions WHERE is_published = true AND deleted_at IS NULL;

  -- Validate: Must have content to publish
  IF v_domains_count = 0 AND v_skills_count = 0 AND v_questions_count = 0 THEN
    RAISE EXCEPTION 'Cannot publish: no content marked as published';
  END IF;

  -- Validate: No orphaned skills (only check non-deleted skills)
  IF EXISTS (
    SELECT 1 FROM public.skills s
    LEFT JOIN public.domains d ON s.domain_id = d.id AND d.deleted_at IS NULL
    WHERE s.deleted_at IS NULL AND (d.id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned skills detected';
  END IF;

  -- Validate: No orphaned questions (only check non-deleted questions)
  IF EXISTS (
    SELECT 1 FROM public.questions q
    LEFT JOIN public.skills s ON q.skill_id = s.id AND s.deleted_at IS NULL
    WHERE q.deleted_at IS NULL AND (s.id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned questions detected';
  END IF;

  -- Validate: All published domains have at least one skill
  IF EXISTS (
    SELECT 1 FROM public.domains d
    WHERE d.is_published = true AND d.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.skills s 
      WHERE s.domain_id = d.id AND s.deleted_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'Cannot publish: empty domains detected';
  END IF;

  -- Bump curriculum version
  UPDATE public.curriculum_meta SET 
    version = version + 1,
    last_published_at = NOW(),
    updated_at = NOW()
  WHERE id = 'singleton'
  RETURNING version INTO v_new_version;

  -- Save snapshot for version history
  INSERT INTO public.curriculum_snapshots (version, published_at, domains_count, skills_count, questions_count)
  VALUES (v_new_version, NOW(), v_domains_count, v_skills_count, v_questions_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
