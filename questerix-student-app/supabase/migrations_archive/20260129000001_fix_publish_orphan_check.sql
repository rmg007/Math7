-- Migration: 20260129000001_fix_publish_orphan_check.sql
-- Description: Fix publish_curriculum to only check non-deleted records for orphan validation

CREATE OR REPLACE FUNCTION public.publish_curriculum()
RETURNS void AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can publish';
  END IF;

  -- Validate: No orphaned skills (only check non-deleted skills)
  IF EXISTS (
    SELECT 1 FROM public.skills s
    LEFT JOIN public.domains d ON s.domain_id = d.id AND d.deleted_at IS NULL
    WHERE s.deleted_at IS NULL
    AND (d.id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned skills detected';
  END IF;

  -- Validate: No orphaned questions (only check non-deleted questions)
  IF EXISTS (
    SELECT 1 FROM public.questions q
    LEFT JOIN public.skills s ON q.skill_id = s.id AND s.deleted_at IS NULL
    WHERE q.deleted_at IS NULL
    AND (s.id IS NULL)
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
  WHERE id = 'singleton';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
