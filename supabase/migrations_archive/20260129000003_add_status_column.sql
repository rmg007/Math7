-- Migration: 20260129000003_add_status_column.sql
-- Description: Add status enum and column to domains, skills, questions tables
-- Replaces boolean is_published with tri-state: draft, published, live

-- Create the status enum type
DO $$ BEGIN
  CREATE TYPE curriculum_status AS ENUM ('draft', 'published', 'live');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column to domains
ALTER TABLE public.domains 
ADD COLUMN IF NOT EXISTS status curriculum_status NOT NULL DEFAULT 'draft';

-- Add status column to skills
ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS status curriculum_status NOT NULL DEFAULT 'draft';

-- Add status column to questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS status curriculum_status NOT NULL DEFAULT 'draft';

-- Migrate existing data: is_published = true -> 'live', is_published = false -> 'draft'
UPDATE public.domains SET status = 'live' WHERE is_published = true AND status = 'draft';
UPDATE public.domains SET status = 'draft' WHERE is_published = false AND status = 'draft';

UPDATE public.skills SET status = 'live' WHERE is_published = true AND status = 'draft';
UPDATE public.skills SET status = 'draft' WHERE is_published = false AND status = 'draft';

UPDATE public.questions SET status = 'live' WHERE is_published = true AND status = 'draft';
UPDATE public.questions SET status = 'draft' WHERE is_published = false AND status = 'draft';

-- Create indexes for status column queries
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_skills_status ON public.skills(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status) WHERE deleted_at IS NULL;

-- Update publish_curriculum function for new status workflow
CREATE OR REPLACE FUNCTION public.publish_curriculum()
RETURNS void AS $$
DECLARE
  v_domains_transitioned integer;
  v_skills_transitioned integer;
  v_questions_transitioned integer;
  v_live_domains integer;
  v_live_skills integer;
  v_live_questions integer;
  v_new_version integer;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can publish';
  END IF;

  -- Validate: No orphaned skills (only check non-deleted skills)
  IF EXISTS (
    SELECT 1 FROM public.skills s
    LEFT JOIN public.domains d ON s.domain_id = d.id AND d.deleted_at IS NULL
    WHERE s.deleted_at IS NULL AND s.status = 'published' AND (d.id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned skills detected';
  END IF;

  -- Validate: No orphaned questions (only check non-deleted questions)
  IF EXISTS (
    SELECT 1 FROM public.questions q
    LEFT JOIN public.skills s ON q.skill_id = s.id AND s.deleted_at IS NULL
    WHERE q.deleted_at IS NULL AND q.status = 'published' AND (s.id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned questions detected';
  END IF;

  -- Transition domains from 'published' to 'live'
  WITH updated AS (
    UPDATE public.domains 
    SET status = 'live', updated_at = NOW()
    WHERE status = 'published' AND deleted_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO v_domains_transitioned FROM updated;

  -- Transition skills from 'published' to 'live'
  WITH updated AS (
    UPDATE public.skills 
    SET status = 'live', updated_at = NOW()
    WHERE status = 'published' AND deleted_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO v_skills_transitioned FROM updated;

  -- Transition questions from 'published' to 'live'
  WITH updated AS (
    UPDATE public.questions 
    SET status = 'live', updated_at = NOW()
    WHERE status = 'published' AND deleted_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO v_questions_transitioned FROM updated;

  -- Check if anything was transitioned
  IF v_domains_transitioned = 0 AND v_skills_transitioned = 0 AND v_questions_transitioned = 0 THEN
    RAISE EXCEPTION 'Nothing to publish: no content is marked as ready for publishing';
  END IF;

  -- Count current live content for snapshot
  SELECT COUNT(*) INTO v_live_domains FROM public.domains WHERE status = 'live' AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_live_skills FROM public.skills WHERE status = 'live' AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_live_questions FROM public.questions WHERE status = 'live' AND deleted_at IS NULL;

  -- Bump curriculum version
  UPDATE public.curriculum_meta SET 
    version = version + 1,
    last_published_at = NOW(),
    updated_at = NOW()
  WHERE id = 'singleton'
  RETURNING version INTO v_new_version;

  -- Save snapshot for version history
  INSERT INTO public.curriculum_snapshots (version, published_at, domains_count, skills_count, questions_count)
  VALUES (v_new_version, NOW(), v_live_domains, v_live_skills, v_live_questions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update RLS policies for student access (use status = 'live' instead of is_published)
DROP POLICY IF EXISTS "Students can view published domains" ON public.domains;
CREATE POLICY "Students can view live domains" ON public.domains
  FOR SELECT USING (status = 'live' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Students can view published skills" ON public.skills;
CREATE POLICY "Students can view live skills" ON public.skills
  FOR SELECT USING (status = 'live' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Students can view published questions" ON public.questions;
CREATE POLICY "Students can view live questions" ON public.questions
  FOR SELECT USING (status = 'live' AND deleted_at IS NULL);
