-- Migration: 20260226144500_fix_publish_count_logic.sql
-- Description: Fix publish_curriculum RPC to count total live items in snapshot
--              instead of just items changed from draft to live

-- The current implementation counts items updated from draft to live,
-- but this returns 0 when items are already live before publishing.
-- The counts should reflect what's actually in the snapshot.

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
    
    UPDATE public.skills SET status = 'live', updated_at = NOW()
    WHERE app_id = target_app_id AND status = 'draft' AND deleted_at IS NULL;
    
    UPDATE public.questions SET status = 'live', updated_at = NOW()
    WHERE app_id = target_app_id AND status = 'draft' AND deleted_at IS NULL;
    
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
    
    -- FIX: Count actual live items in snapshot instead of just updated items
    -- This ensures counts are correct even when items were already live
    published_domains := COALESCE(jsonb_array_length(v_snapshot_content->'domains'), 0);
    published_skills := COALESCE(jsonb_array_length(v_snapshot_content->'skills'), 0);
    published_questions := COALESCE(jsonb_array_length(v_snapshot_content->'questions'), 0);
    
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

-- ============================================================
-- RLS Policies for curriculum_meta (Admin-managed table)
-- ============================================================
-- curriculum_meta requires full CRUD policies for admin access

ALTER TABLE public.curriculum_meta ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Allow admin/super_admin to read
CREATE POLICY "curriculum_meta_select_admin"
  ON public.curriculum_meta
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- INSERT policy: Allow admin/super_admin to insert
CREATE POLICY "curriculum_meta_insert_admin"
  ON public.curriculum_meta
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- UPDATE policy: Allow admin/super_admin to update
CREATE POLICY "curriculum_meta_update_admin"
  ON public.curriculum_meta
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- DELETE policy: Allow admin/super_admin to delete
CREATE POLICY "curriculum_meta_delete_admin"
  ON public.curriculum_meta
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
