-- Migration: 20260222130000_fix_curriculum_rpcs.sql
-- Description: Corrects column names in publish_curriculum and rollback_publish RPCs.
--              Ensures snapshots use current schema (question_id, title, content, solution, etc.)
--              and rollback restores deleted items by clearing deleted_at.

-- 1. Fix publish_curriculum to use correct column names in JSON snapshot
CREATE OR REPLACE FUNCTION public.publish_curriculum(p_app_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    target_app_id UUID;
    published_domains INTEGER := 0;
    published_skills INTEGER := 0;
    published_questions INTEGER := 0;
    new_version INTEGER;
    v_snapshot_content JSONB;
BEGIN
    -- Determine app_id: use param if provided, else get from caller's profile
    IF p_app_id IS NOT NULL THEN
        target_app_id := p_app_id;
    ELSE
        SELECT app_id INTO target_app_id FROM public.profiles WHERE id = auth.uid();
    END IF;
    
    IF target_app_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine app_id for publishing';
    END IF;
    
    -- Verify caller is admin of this app
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin') 
        AND app_id = target_app_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Must be admin of the target app';
    END IF;
    
    -- Get the new version number
    SELECT COALESCE(MAX(version), 0) + 1 INTO new_version 
    FROM public.curriculum_snapshots WHERE app_id = target_app_id;
    
    -- Update all draft content to live for this app only
    UPDATE public.domains SET status = 'live', updated_at = NOW()
    WHERE app_id = target_app_id AND status = 'draft' AND deleted_at IS NULL;
    GET DIAGNOSTICS published_domains = ROW_COUNT;
    
    UPDATE public.skills SET status = 'live', updated_at = NOW()
    WHERE app_id = target_app_id AND status = 'draft' AND deleted_at IS NULL;
    GET DIAGNOSTICS published_skills = ROW_COUNT;
    
    UPDATE public.questions SET status = 'live', updated_at = NOW()
    WHERE app_id = target_app_id AND status = 'draft' AND deleted_at IS NULL;
    GET DIAGNOSTICS published_questions = ROW_COUNT;
    
    -- Build the snapshot content with correct SSoT names
    v_snapshot_content := jsonb_build_object(
        'domains', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'domain_id', domain_id,
                    'title', title,
                    'description', description,
                    'slug', slug,
                    'status', status,
                    'created_at', created_at,
                    'updated_at', updated_at
                )
            )
            FROM public.domains
            WHERE app_id = target_app_id AND status = 'live' AND deleted_at IS NULL
        ),
        'skills', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'skill_id', skill_id,
                    'domain_id', domain_id,
                    'title', title,
                    'description', description,
                    'slug', slug,
                    'status', status,
                    'created_at', created_at,
                    'updated_at', updated_at
                )
            )
            FROM public.skills
            WHERE app_id = target_app_id AND status = 'live' AND deleted_at IS NULL
        ),
        'questions', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'question_id', question_id,
                    'skill_id', skill_id,
                    'content', content,
                    'type', type,
                    'options', options,
                    'solution', solution,
                    'explanation', explanation,
                    'points', points,
                    'status', status,
                    'created_at', created_at,
                    'updated_at', updated_at
                )
            )
            FROM public.questions
            WHERE app_id = target_app_id AND status = 'live' AND deleted_at IS NULL
        )
    );
    
    -- Insert the snapshot
    INSERT INTO public.curriculum_snapshots (
        app_id,
        version,
        content,
        domains_count,
        skills_count,
        questions_count,
        published_at,
        published_by
    )
    VALUES (
        target_app_id,
        new_version,
        v_snapshot_content,
        published_domains,
        published_skills,
        published_questions,
        NOW(),
        auth.uid()
    );
    
    -- Update curriculum_meta for this app
    INSERT INTO public.curriculum_meta (app_id, version, last_published_at)
    VALUES (target_app_id, new_version, NOW())
    ON CONFLICT (app_id) DO UPDATE SET
        version = EXCLUDED.version,
        last_published_at = NOW();
    
    RETURN jsonb_build_object(
        'success', true,
        'app_id', target_app_id,
        'version', new_version,
        'published', jsonb_build_object(
            'domains', published_domains,
            'skills', published_skills,
            'questions', published_questions
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- 2. Fix rollback_publish to use correct column names and restore deleted items
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
  -- 1. Authorization
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id      = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND app_id   = p_app_id
  ) THEN
    RAISE EXCEPTION 'rollback_publish: Unauthorized. Must be admin of app %', p_app_id;
  END IF;

  -- 2. Fetch the target snapshot
  SELECT * INTO v_snapshot
  FROM public.curriculum_snapshots
  WHERE app_id  = p_app_id
    AND version = p_target_version;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rollback_publish: No snapshot found for app % at version %',
      p_app_id, p_target_version;
  END IF;

  -- 3. Soft-unpublish all current live content for this app
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

  -- 4. Restore domains
  FOR v_domain IN SELECT * FROM jsonb_array_elements(COALESCE(v_snapshot.content -> 'domains', '[]'::jsonb))
  LOOP
    INSERT INTO public.domains (
      domain_id, app_id, title, description, slug, status, created_at, updated_at
    ) VALUES (
      (v_domain ->> 'domain_id')::UUID,
      p_app_id,
      v_domain ->> 'title',
      v_domain ->> 'description',
      v_domain ->> 'slug',
      'live',
      (v_domain ->> 'created_at')::TIMESTAMPTZ,
      NOW()
    )
    ON CONFLICT (domain_id) DO UPDATE SET
      title       = EXCLUDED.title,
      description = EXCLUDED.description,
      slug        = EXCLUDED.slug,
      status      = 'live',
      deleted_at  = NULL,
      updated_at  = NOW();

    v_domains_restored := v_domains_restored + 1;
  END LOOP;

  -- 5. Restore skills
  FOR v_skill IN SELECT * FROM jsonb_array_elements(COALESCE(v_snapshot.content -> 'skills', '[]'::jsonb))
  LOOP
    INSERT INTO public.skills (
      skill_id, app_id, domain_id, title, description, slug, status, created_at, updated_at
    ) VALUES (
      (v_skill ->> 'skill_id')::UUID,
      p_app_id,
      (v_skill ->> 'domain_id')::UUID,
      v_skill ->> 'title',
      v_skill ->> 'description',
      v_skill ->> 'slug',
      'live',
      (v_skill ->> 'created_at')::TIMESTAMPTZ,
      NOW()
    )
    ON CONFLICT (skill_id) DO UPDATE SET
      domain_id   = EXCLUDED.domain_id,
      title       = EXCLUDED.title,
      description = EXCLUDED.description,
      slug        = EXCLUDED.slug,
      status      = 'live',
      deleted_at  = NULL,
      updated_at  = NOW();

    v_skills_restored := v_skills_restored + 1;
  END LOOP;

  -- 6. Restore questions
  FOR v_question IN SELECT * FROM jsonb_array_elements(COALESCE(v_snapshot.content -> 'questions', '[]'::jsonb))
  LOOP
    INSERT INTO public.questions (
      question_id, app_id, skill_id, content, type,
      options, solution, explanation, points,
      status, created_at, updated_at
    ) VALUES (
      (v_question ->> 'question_id')::UUID,
      p_app_id,
      (v_question ->> 'skill_id')::UUID,
      (v_question -> 'content'),
      (v_question ->> 'type')::question_type,
      (v_question -> 'options'),
      (v_question -> 'solution'),
      v_question ->> 'explanation',
      (v_question ->> 'points')::INTEGER,
      'live',
      (v_question ->> 'created_at')::TIMESTAMPTZ,
      NOW()
    )
    ON CONFLICT (question_id) DO UPDATE SET
      skill_id      = EXCLUDED.skill_id,
      content       = EXCLUDED.content,
      type          = EXCLUDED.type,
      options       = EXCLUDED.options,
      solution      = EXCLUDED.solution,
      explanation   = EXCLUDED.explanation,
      points        = EXCLUDED.points,
      status        = 'live',
      deleted_at    = NULL,
      updated_at    = NOW();

    v_questions_restored := v_questions_restored + 1;
  END LOOP;

  -- 7. Finalize
  INSERT INTO public.curriculum_meta (app_id, version, last_published_at)
  VALUES (p_app_id, p_target_version, NOW())
  ON CONFLICT (app_id) DO UPDATE SET
    version           = p_target_version,
    last_published_at = NOW();

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
