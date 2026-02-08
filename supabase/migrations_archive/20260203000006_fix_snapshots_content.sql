-- Migration: 20260203000006_fix_snapshots_content.sql
-- Description: Add content column to snapshots and update publish_curriculum to save actual data.

-- 1. Add the content column (JSONB for flexibility)
ALTER TABLE public.curriculum_snapshots 
ADD COLUMN IF NOT EXISTS content JSONB;

-- 2. Update the publish_curriculum function to actually SAVE the data
CREATE OR REPLACE FUNCTION public.publish_curriculum()
RETURNS void AS $$
DECLARE
  v_domains_count integer;
  v_skills_count integer;
  v_questions_count integer;
  v_new_version integer;
  v_snapshot_content JSONB;
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

  -- Validate: No orphaned skills
  IF EXISTS (
    SELECT 1 FROM public.skills s
    LEFT JOIN public.domains d ON s.domain_id = d.id AND d.deleted_at IS NULL
    WHERE s.deleted_at IS NULL AND (d.id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot publish: orphaned skills detected';
  END IF;

  -- Validate: No orphaned questions
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

  -- BUILD THE SNAPSHOT CONTENT
  -- We aggregate all published data into a single JSON structure.
  SELECT json_build_object(
    'domains', (SELECT coalesce(json_agg(d), '[]'::json) FROM public.domains d WHERE d.is_published = true AND d.deleted_at IS NULL),
    'skills', (SELECT coalesce(json_agg(s), '[]'::json) FROM public.skills s WHERE s.is_published = true AND s.deleted_at IS NULL),
    'questions', (SELECT coalesce(json_agg(q), '[]'::json) FROM public.questions q WHERE q.is_published = true AND q.deleted_at IS NULL)
  ) INTO v_snapshot_content;

  -- Bump curriculum version
  UPDATE public.curriculum_meta SET 
    version = version + 1,
    last_published_at = NOW(),
    updated_at = NOW()
  WHERE id = 'singleton'
  RETURNING version INTO v_new_version;

  -- Save snapshot with ACTUAL CONTENT
  INSERT INTO public.curriculum_snapshots (
    version, 
    published_at, 
    domains_count, 
    skills_count, 
    questions_count,
    content
  )
  VALUES (
    v_new_version, 
    NOW(), 
    v_domains_count, 
    v_skills_count, 
    v_questions_count,
    v_snapshot_content
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
