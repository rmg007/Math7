-- Migration: 20260212_fix_publish_curriculum_rpc.sql
-- Description: Fix publish_curriculum RPC to create snapshots and handle schema correctly

-- First, ensure curriculum_snapshots table exists with proper schema
CREATE TABLE IF NOT EXISTS public.curriculum_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  version INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  domains_count INTEGER NOT NULL DEFAULT 0,
  skills_count INTEGER NOT NULL DEFAULT 0,
  questions_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(app_id, version)
);

-- Enable RLS if not already enabled
ALTER TABLE public.curriculum_snapshots ENABLE ROW LEVEL SECURITY;

-- Add RLS policies if they don't exist
CREATE POLICY "curriculum_snapshots_admin_all" ON public.curriculum_snapshots
  FOR ALL TO authenticated
  USING (jwt_is_admin())
  WITH CHECK (jwt_is_admin());

CREATE POLICY "curriculum_snapshots_read" ON public.curriculum_snapshots
  FOR SELECT TO authenticated
  USING (true);

-- Now fix the publish_curriculum function to properly create snapshots
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
        AND is_admin = true 
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
    
    -- Build the snapshot content
    v_snapshot_content := jsonb_build_object(
        'domains', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'name', name,
                    'description', description,
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
                    'id', id,
                    'domain_id', domain_id,
                    'name', name,
                    'description', description,
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
                    'id', id,
                    'skill_id', skill_id,
                    'question_text', question_text,
                    'question_type', question_type,
                    'options', options,
                    'correct_answer', correct_answer,
                    'explanation', explanation,
                    'difficulty', difficulty,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
