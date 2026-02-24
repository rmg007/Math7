-- Migration: 20260221220000_rollback_publish_rpc.sql
-- Description: Implement rollback_publish RPC to revert curriculum to a previous snapshot version.
--
-- Security model:
--   SECURITY DEFINER + SET search_path = public, pg_temp avoids search_path injection.
--   Only admins of the target app can invoke this function (RBAC check inside).
-- RLS intentionally omitted on this migration because the function operates
-- exclusively via SECURITY DEFINER and no new tables are created.

-- ============================================================
-- rollback_publish(p_app_id, p_target_version)
-- ============================================================
-- Reverts curriculum content (domains/skills/questions) to the state
-- captured in a specific curriculum_snapshots row.
--
-- Algorithm:
--   1. Verify the caller is an admin of the app.
--   2. Fetch the snapshot row for app_id + target_version.
--   3. Mark all current 'live' content as 'draft' (soft-unpublish).
--   4. Re-insert / restore each curriculum entity from the snapshot JSON.
--   5. Mark restored content as 'live'.
--   6. Update curriculum_meta to reflect the rollback.
--   7. Return a summary JSONB payload.
--
-- Usage:
--   SELECT rollback_publish('app-uuid', 3);
-- ============================================================

CREATE OR REPLACE FUNCTION public.rollback_publish(
  p_app_id       UUID,
  p_target_version INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_snapshot         RECORD;
  v_domain           JSONB;
  v_skill            JSONB;
  v_question         JSONB;
  v_domains_restored INTEGER := 0;
  v_skills_restored  INTEGER := 0;
  v_questions_restored INTEGER := 0;
BEGIN
  -- ----------------------------------------------------------------
  -- 1. Authorization — only admins of this app may roll back
  -- ----------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id      = auth.uid()
      AND is_admin = true
      AND app_id   = p_app_id
  ) THEN
    RAISE EXCEPTION 'rollback_publish: Unauthorized. Must be admin of app %', p_app_id;
  END IF;

  -- ----------------------------------------------------------------
  -- 2. Fetch the target snapshot
  -- ----------------------------------------------------------------
  SELECT * INTO v_snapshot
  FROM public.curriculum_snapshots
  WHERE app_id  = p_app_id
    AND version = p_target_version;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rollback_publish: No snapshot found for app % at version %',
      p_app_id, p_target_version;
  END IF;

  -- ----------------------------------------------------------------
  -- 3. Soft-unpublish all current live content for this app
  --    (set status back to 'draft' so we start from a clean slate)
  -- ----------------------------------------------------------------
  UPDATE public.domains
  SET status     = 'draft',
      updated_at = NOW()
  WHERE app_id   = p_app_id
    AND status   = 'live'
    AND deleted_at IS NULL;

  UPDATE public.skills
  SET status     = 'draft',
      updated_at = NOW()
  WHERE app_id   = p_app_id
    AND status   = 'live'
    AND deleted_at IS NULL;

  UPDATE public.questions
  SET status     = 'draft',
      updated_at = NOW()
  WHERE app_id   = p_app_id
    AND status   = 'live'
    AND deleted_at IS NULL;

  -- ----------------------------------------------------------------
  -- 4 & 5. Restore domains from snapshot
  -- ----------------------------------------------------------------
  FOR v_domain IN SELECT * FROM jsonb_array_elements(
      COALESCE(v_snapshot.content -> 'domains', '[]'::jsonb)
  )
  LOOP
    INSERT INTO public.domains (
      id, app_id, name, description, status, created_at, updated_at
    ) VALUES (
      (v_domain ->> 'id')::UUID,
      p_app_id,
      v_domain ->> 'name',
      v_domain ->> 'description',
      'live',
      (v_domain ->> 'created_at')::TIMESTAMPTZ,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name        = EXCLUDED.name,
      description = EXCLUDED.description,
      status      = 'live',
      updated_at  = NOW();

    v_domains_restored := v_domains_restored + 1;
  END LOOP;

  -- ----------------------------------------------------------------
  -- Restore skills from snapshot
  -- ----------------------------------------------------------------
  FOR v_skill IN SELECT * FROM jsonb_array_elements(
      COALESCE(v_snapshot.content -> 'skills', '[]'::jsonb)
  )
  LOOP
    INSERT INTO public.skills (
      id, app_id, domain_id, name, description, status, created_at, updated_at
    ) VALUES (
      (v_skill ->> 'id')::UUID,
      p_app_id,
      (v_skill ->> 'domain_id')::UUID,
      v_skill ->> 'name',
      v_skill ->> 'description',
      'live',
      (v_skill ->> 'created_at')::TIMESTAMPTZ,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      domain_id   = EXCLUDED.domain_id,
      name        = EXCLUDED.name,
      description = EXCLUDED.description,
      status      = 'live',
      updated_at  = NOW();

    v_skills_restored := v_skills_restored + 1;
  END LOOP;

  -- ----------------------------------------------------------------
  -- Restore questions from snapshot
  -- ----------------------------------------------------------------
  FOR v_question IN SELECT * FROM jsonb_array_elements(
      COALESCE(v_snapshot.content -> 'questions', '[]'::jsonb)
  )
  LOOP
    INSERT INTO public.questions (
      id, app_id, skill_id, question_text, question_type,
      options, correct_answer, explanation, difficulty,
      status, created_at, updated_at
    ) VALUES (
      (v_question ->> 'id')::UUID,
      p_app_id,
      (v_question ->> 'skill_id')::UUID,
      v_question ->> 'question_text',
      v_question ->> 'question_type',
      (v_question -> 'options'),
      v_question ->> 'correct_answer',
      v_question ->> 'explanation',
      v_question ->> 'difficulty',
      'live',
      (v_question ->> 'created_at')::TIMESTAMPTZ,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      skill_id      = EXCLUDED.skill_id,
      question_text = EXCLUDED.question_text,
      question_type = EXCLUDED.question_type,
      options       = EXCLUDED.options,
      correct_answer = EXCLUDED.correct_answer,
      explanation   = EXCLUDED.explanation,
      difficulty    = EXCLUDED.difficulty,
      status        = 'live',
      updated_at    = NOW();

    v_questions_restored := v_questions_restored + 1;
  END LOOP;

  -- ----------------------------------------------------------------
  -- 6. Update curriculum_meta to reflect the rollback
  -- ----------------------------------------------------------------
  INSERT INTO public.curriculum_meta (app_id, version, last_published_at)
  VALUES (p_app_id, p_target_version, NOW())
  ON CONFLICT (app_id) DO UPDATE SET
    version           = p_target_version,
    last_published_at = NOW();

  -- ----------------------------------------------------------------
  -- 7. Return summary
  -- ----------------------------------------------------------------
  RETURN jsonb_build_object(
    'success',          true,
    'app_id',           p_app_id,
    'rolled_back_to',   p_target_version,
    'snapshot_taken_at', v_snapshot.published_at,
    'restored', jsonb_build_object(
      'domains',   v_domains_restored,
      'skills',    v_skills_restored,
      'questions', v_questions_restored
    )
  );
END;
$$;

-- Grant execute to authenticated users (RBAC check is inside the function)
GRANT EXECUTE ON FUNCTION public.rollback_publish(UUID, INTEGER) TO authenticated;

-- ============================================================
-- list_curriculum_snapshots(p_app_id)
-- ============================================================
-- Returns all available snapshot versions for an app so the
-- admin UI can populate a "Roll back to version X" picker.
-- ============================================================

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
      AND is_admin = true
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
