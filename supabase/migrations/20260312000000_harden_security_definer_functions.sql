-- Migration: 20260312000000_harden_security_definer_functions.sql
-- Description: Hardens ALL SECURITY DEFINER functions in the public schema by setting the search_path.
-- This prevents search_path hijacking attacks.

-- 1. check_group_membership
CREATE OR REPLACE FUNCTION public.check_group_membership(p_group_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = p_group_id AND student_id = p_user_id
    );
END;
$$;

-- 2. user_can_access_assignment
CREATE OR REPLACE FUNCTION public.user_can_access_assignment(p_assignment_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.groups g ON a.group_id = g.id
        WHERE a.id = p_assignment_id
        AND (
            g.owner_id = p_user_id -- Mentor
            OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = g.id AND gm.student_id = p_user_id) -- Student
            OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = p_user_id AND p.role = 'super_admin') -- Super Admin
        )
    );
END;
$$;

-- 3. role_is_super_admin
CREATE OR REPLACE FUNCTION public.role_is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    );
$$;

-- 4. check_sync_health
CREATE OR REPLACE FUNCTION public.check_sync_health(client_version text, schema_version integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
    -- This version currently supports schema version 7 to 10.
    RETURN jsonb_build_object(
        'compatible', schema_version >= 7,
        'must_reset', schema_version < 10,
        'message', CASE 
            WHEN schema_version < 7 THEN 'App version critical update required.'
            WHEN schema_version < 10 THEN 'Data optimization required. Resetting local cache...'
            ELSE 'Healthy'
        END
    );
END;
$$;

-- 5. batch_insert_session_events
CREATE OR REPLACE FUNCTION public.batch_insert_session_events(events_json jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.session_events (id, user_id, question_id, app_id, type, details, created_at)
  SELECT 
    (e->>'id')::UUID,
    (e->>'user_id')::UUID,
    (e->>'question_id')::UUID,
    (e->>'app_id')::UUID,
    ((e->>'type')::event_type),
    (e->'details'),
    (e->>'created_at')::TIMESTAMPTZ
  FROM jsonb_array_elements(events_json) AS e;
END;
$$;

-- 6. get_sync_integrity_stats
CREATE OR REPLACE FUNCTION public.get_sync_integrity_stats(p_app_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verify user belongs to this app via profile
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND app_id = p_app_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User does not belong to this app context.';
  END IF;

  SELECT jsonb_build_object(
    'domains', (SELECT count(*) FROM public.domains WHERE app_id = p_app_id AND deleted_at IS NULL),
    'skills', (SELECT count(*) FROM public.skills WHERE app_id = p_app_id AND deleted_at IS NULL),
    'questions', (SELECT count(*) FROM public.questions WHERE app_id = p_app_id AND deleted_at IS NULL),
    'attempts', (
       SELECT count(*) FROM public.attempts a
       JOIN public.questions q ON a.question_id = q.question_id
       WHERE q.app_id = p_app_id AND a.user_id = auth.uid() AND a.deleted_at IS NULL
    ),
    'achievements', (SELECT count(*) FROM public.achievements WHERE app_id = p_app_id AND user_id = auth.uid() AND deleted_at IS NULL)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 7. check_global_ai_quota
CREATE OR REPLACE FUNCTION public.check_global_ai_quota()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_used bigint;
    v_limits jsonb;
    v_limit bigint;
    v_threshold_percent int;
    v_usage_percent int;
BEGIN
    -- Get usage for last 24h
    SELECT COALESCE(SUM(tokens_used), 0) INTO v_total_used
    FROM public.ai_token_usage
    WHERE created_at > now() - interval '24 hours';

    -- Get limits
    SELECT value INTO v_limits FROM public.platform_config WHERE key = 'ai_global_limits';
    v_limit := (v_limits->>'daily_token_limit')::bigint;
    v_threshold_percent := (v_limits->>'alert_threshold_percent')::int;

    v_usage_percent := (v_total_used * 100) / v_limit;

    -- Alert if needed
    IF v_usage_percent >= v_threshold_percent THEN
        -- Only insert alert once every hour to avoid spamming
        IF NOT EXISTS (
            SELECT 1 FROM public.security_logs 
            WHERE event_type = 'AI_QUOTA_ALERT' 
              AND created_at > now() - interval '1 hour'
        ) THEN
            INSERT INTO public.security_logs (event_type, severity, metadata)
            VALUES (
                'AI_QUOTA_ALERT',
                CASE WHEN v_usage_percent >= 100 THEN 'critical' ELSE 'warning' END,
                jsonb_build_object(
                    'usage_tokens', v_total_used,
                    'limit_tokens', v_limit,
                    'usage_percent', v_usage_percent
                )
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'total_used', v_total_used,
        'limit', v_limit,
        'usage_percent', v_usage_percent,
        'alert_triggered', v_usage_percent >= v_threshold_percent
    );
END;
$$;

-- 8. consume_tenant_tokens
CREATE OR REPLACE FUNCTION public.consume_tenant_tokens(
    p_app_id UUID,
    p_tokens_used INTEGER,
    p_operation TEXT DEFAULT 'generate_questions'::text
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_quota RECORD;
BEGIN
    IF NOT public.jwt_is_tenant_admin() AND (auth.jwt() ->> 'role' != 'service_role') AND NOT public.jwt_is_super_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
    END IF;

    IF NOT public.jwt_is_super_admin() AND p_app_id != public.current_app_id() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Cross-tenant quota manipulation blocked');
    END IF;

    SELECT * INTO v_quota FROM public.tenant_quotas WHERE app_id = p_app_id FOR UPDATE;
    IF NOT FOUND THEN
        INSERT INTO public.tenant_quotas (app_id) VALUES (p_app_id) RETURNING * INTO v_quota;
    END IF;

    IF v_quota.is_throttled THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tenant is currently throttled');
    END IF;

    IF v_quota.current_token_usage + p_tokens_used > v_quota.monthly_token_limit THEN
        RETURN jsonb_build_object('success', false, 'message', 'Monthly token quota exceeded');
    END IF;

    UPDATE public.tenant_quotas SET current_token_usage = current_token_usage + p_tokens_used, updated_at = NOW() WHERE app_id = p_app_id;
    INSERT INTO public.ai_token_usage (app_id, user_id, operation, tokens_used) VALUES (p_app_id, auth.uid(), p_operation, p_tokens_used);
    
    RETURN jsonb_build_object(
        'success', true, 
        'new_usage', v_quota.current_token_usage + p_tokens_used,
        'remaining', v_quota.monthly_token_limit - (v_quota.current_token_usage + p_tokens_used)
    );
END;
$$;

-- 9. publish_curriculum
CREATE OR REPLACE FUNCTION public.publish_curriculum(p_app_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
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
    
    -- Build the snapshot content
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
$$;

-- 10. rollback_publish
CREATE OR REPLACE FUNCTION public.rollback_publish(p_app_id uuid, p_target_version integer)
 RETURNS jsonb
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

-- 11. log_error
CREATE OR REPLACE FUNCTION public.log_error(
    p_platform text,
    p_error_type text,
    p_error_message text,
    p_stack_trace text DEFAULT NULL::text,
    p_url text DEFAULT NULL::text,
    p_user_agent text DEFAULT NULL::text,
    p_app_version text DEFAULT NULL::text,
    p_app_id uuid DEFAULT NULL::uuid,
    p_extra_context jsonb DEFAULT '{}'::jsonb
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
    v_error_id UUID;
BEGIN
    INSERT INTO public.error_logs (
        user_id,
        app_id,
        platform,
        app_version,
        error_type,
        error_message,
        stack_trace,
        url,
        user_agent,
        extra_context
    ) VALUES (
        auth.uid(),
        p_app_id,
        p_platform,
        p_app_version,
        p_error_type,
        p_error_message,
        p_stack_trace,
        p_url,
        p_user_agent,
        p_extra_context
    )
    RETURNING id INTO v_error_id;
    RETURN v_error_id;
END;
$$;

-- 12. list_curriculum_snapshots
CREATE OR REPLACE FUNCTION public.list_curriculum_snapshots(p_app_id uuid)
 RETURNS TABLE(version integer, domains_count integer, skills_count integer, questions_count integer, published_at timestamp with time zone, published_by uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only admins of this app may list snapshots
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id      = auth.uid()
      AND role IN ('admin', 'super_admin')
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

-- 13. current_app_id
CREATE OR REPLACE FUNCTION public.current_app_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
    SELECT app_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 14. jwt_is_admin
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$ 
  SELECT public.jwt_is_tenant_admin() OR public.jwt_is_super_admin(); 
$$;

-- 15. custom_access_token_hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public, auth, pg_temp
AS $$
  DECLARE
    claims jsonb;
    user_role text;
    app_meta jsonb;
    v_user_id uuid;
  BEGIN
    v_user_id := (event->>'user_id')::uuid;

    -- Fetch the user's role from the profiles table
    SELECT role::text INTO user_role FROM public.profiles WHERE id = v_user_id;

    IF user_role IS NULL THEN
      user_role := 'student';
    END IF;

    claims := event->'claims';
    app_meta := COALESCE(claims->'app_metadata', '{}'::jsonb);

    -- Set the user_role in root claims AND app_metadata for compatibility
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    app_meta := jsonb_set(app_meta, '{user_role}', to_jsonb(user_role));
    
    -- Also add role to app_metadata (common Supabase pattern)
    app_meta := jsonb_set(app_meta, '{role}', to_jsonb(user_role));
    
    claims := jsonb_set(claims, '{app_metadata}', app_meta);

    -- Update the response
    event := jsonb_set(event, '{claims}', claims);

    RETURN event;
  END;
$$;

-- 16. is_group_in_app
CREATE OR REPLACE FUNCTION public.is_group_in_app(p_group_id uuid, p_app_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = p_group_id
    AND app_id = p_app_id
  );
$$;

-- 17. deactivate_own_account
CREATE OR REPLACE FUNCTION public.deactivate_own_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = auth.uid();
END;
$$;

-- 18. delete_own_account
CREATE OR REPLACE FUNCTION public.delete_own_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
  -- Hard delete of profile
  DELETE FROM public.profiles
  WHERE id = auth.uid();
END;
$$;

-- 19. sync_user_role
CREATE OR REPLACE FUNCTION public.sync_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 20. validate_and_use_invitation_code
CREATE OR REPLACE FUNCTION public.validate_and_use_invitation_code(p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  code_record RECORD;
BEGIN
  SELECT * INTO code_record
  FROM public.invitation_codes
  WHERE code = upper(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND times_used < max_uses
  FOR UPDATE;

  IF code_record IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.invitation_codes
  SET times_used = times_used + 1, updated_at = NOW()
  WHERE id = code_record.id;

  RETURN TRUE;
END;
$$;

-- 21. on_app_domain_change
CREATE OR REPLACE FUNCTION public.on_app_domain_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, net, pg_temp
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://bkfhorslctqieetzqdtd.supabase.co/functions/v1/manage-app-domains',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'qtx_domain_sync_sec_2026'
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Cloudflare automation trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 22. submit_attempt_and_update_progress
CREATE OR REPLACE FUNCTION public.submit_attempt_and_update_progress(attempts_json jsonb)
 RETURNS SETOF public.skill_progress
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  attempt_item JSONB;
  result_record public.skill_progress;
BEGIN
  FOR attempt_item IN SELECT * FROM jsonb_array_elements(attempts_json)
  LOOP
    INSERT INTO public.attempts (
      id, user_id, question_id, response, is_correct,
      score_awarded, time_spent_ms, created_at, updated_at
    ) VALUES (
      COALESCE((attempt_item->>'id')::UUID, gen_random_uuid()),
      auth.uid(),
      (attempt_item->>'question_id')::UUID,
      COALESCE(attempt_item->'response', '{}'::jsonb),
      COALESCE((attempt_item->>'is_correct')::BOOLEAN, false),
      COALESCE((attempt_item->>'score_awarded')::INTEGER, 0),
      (attempt_item->>'time_spent_ms')::INTEGER,
      COALESCE((attempt_item->>'created_at')::TIMESTAMPTZ, NOW()),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    SELECT * INTO result_record
    FROM public.skill_progress
    WHERE user_id = auth.uid()
      AND skill_id = (SELECT skill_id FROM public.questions WHERE question_id = (attempt_item->>'question_id')::UUID)
    LIMIT 1;

    IF FOUND THEN
      RETURN NEXT result_record;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- 23. log_security_event
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_severity text, p_metadata jsonb DEFAULT '{}'::jsonb, p_app_id uuid DEFAULT NULL::uuid, p_location text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.security_logs (
        user_id,
        app_id,
        event_type,
        severity,
        metadata
    ) VALUES (
        auth.uid(),
        p_app_id,
        p_event_type,
        p_severity,
        p_metadata
    );
END;
$$;

-- 24. validate_invitation_code
CREATE OR REPLACE FUNCTION public.validate_invitation_code(p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.invitation_codes
    WHERE code = p_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR times_used < max_uses)
  );
END;
$$;

-- 25. pull_changes
CREATE OR REPLACE FUNCTION public.pull_changes(table_name text, last_sync_time timestamp with time zone DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  active_json JSONB;
  deleted_json JSONB;
  v_last_sync TIMESTAMPTZ;
  v_app_id UUID;
  v_is_super BOOLEAN;
BEGIN
  v_last_sync := COALESCE(last_sync_time, '1970-01-01'::timestamptz);
  v_app_id := public.current_app_id();
  v_is_super := public.jwt_is_super_admin();

  -- Security check: Require either an app context or super admin role
  IF v_app_id IS NULL AND NOT v_is_super AND table_name NOT IN ('skill_progress', 'achievements', 'sessions', 'session_events') THEN
    RAISE EXCEPTION 'Unauthorized: Missing tenant context';
  END IF;

  IF table_name = 'domains' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT domain_id as id, app_id, slug, title, description, icon, sort_order, color, status::text, created_at, updated_at
      FROM public.domains 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL 
        AND ( (v_app_id IS NOT NULL AND app_id = v_app_id) OR (v_app_id IS NULL AND v_is_super) )
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT domain_id as id, deleted_at FROM public.domains 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL 
        AND ( (v_app_id IS NOT NULL AND app_id = v_app_id) OR (v_app_id IS NULL AND v_is_super) )
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;

  ELSIF table_name = 'skills' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT skill_id as id, domain_id, app_id, slug, title, description, sort_order, difficulty_level, status::text, created_at, updated_at
      FROM public.skills 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL 
        AND ( (v_app_id IS NOT NULL AND app_id = v_app_id) OR (v_app_id IS NULL AND v_is_super) )
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT skill_id as id, deleted_at FROM public.skills 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL 
        AND ( (v_app_id IS NOT NULL AND app_id = v_app_id) OR (v_app_id IS NULL AND v_is_super) )
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;

  ELSIF table_name = 'questions' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT question_id as id, skill_id, app_id, type, content::text as content, options, solution, explanation, 
             hint_text, rule_text, eli10_text, difficulty_level,
             points, sort_order, status::text, content_hash, created_at, updated_at
      FROM public.questions 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL 
        AND ( (v_app_id IS NOT NULL AND app_id = v_app_id) OR (v_app_id IS NULL AND v_is_super) )
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT question_id as id, deleted_at FROM public.questions 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL 
        AND ( (v_app_id IS NOT NULL AND app_id = v_app_id) OR (v_app_id IS NULL AND v_is_super) )
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;

  ELSIF table_name = 'skill_progress' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT id, user_id, skill_id, mastery_level, total_attempts, correct_attempts, total_points, current_streak, longest_streak, last_attempt_at, created_at, updated_at
      FROM public.skill_progress 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL AND (user_id = auth.uid()) 
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT id, deleted_at FROM public.skill_progress 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL AND (user_id = auth.uid())
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;

  ELSIF table_name = 'achievements' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT id, user_id, app_id, type, unlocked_at, created_at, updated_at
      FROM public.achievements 
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL AND (user_id = auth.uid()) 
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT id, deleted_at FROM public.achievements 
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL AND (user_id = auth.uid())
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;

  ELSIF table_name = 'sessions' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT id, user_id, skill_id, started_at, ended_at, questions_attempted, questions_correct, total_time_ms, created_at, updated_at
      FROM public.sessions
      WHERE (updated_at > v_last_sync) AND deleted_at IS NULL AND (user_id = auth.uid())
      ORDER BY updated_at ASC LIMIT 1000
    ) sub;
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO deleted_json FROM (
      SELECT id, deleted_at FROM public.sessions
      WHERE (deleted_at > v_last_sync) AND deleted_at IS NOT NULL AND (user_id = auth.uid())
      ORDER BY deleted_at ASC LIMIT 1000
    ) sub;

  ELSIF table_name = 'session_events' THEN
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO active_json FROM (
      SELECT id, user_id, question_id, app_id, type, details, created_at
      FROM public.session_events
      WHERE (created_at > v_last_sync) 
        AND (created_at > NOW() - INTERVAL '30 days')
        AND (user_id = auth.uid())
      ORDER BY created_at ASC LIMIT 1000
    ) sub;
    deleted_json := '[]'::jsonb;

  ELSE
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  RETURN jsonb_build_object(
    'active', active_json,
    'deleted', deleted_json,
    'synced_at', NOW()
  );
END;
$$;

-- 26. jwt_is_super_admin
CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, auth, pg_temp
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'user_role' = 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    ),
    false
  );
$$;

-- 27. deactivate_invitation_code
CREATE OR REPLACE FUNCTION public.deactivate_invitation_code(p_code_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
BEGIN
  -- Security check
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.invitation_codes
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE id = p_code_id;
END;
$$;

-- 28. generate_invitation_code
CREATE OR REPLACE FUNCTION public.generate_invitation_code(p_max_uses integer DEFAULT 1, p_expires_days integer DEFAULT NULL::integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Strict Check: Only Super Admins can generate invitation codes
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Requires super_admin role';
  END IF;

  v_code := 'INV-' || upper(substr(md5(random()::text), 1, 8));
  
  INSERT INTO public.invitation_codes (
    code,
    max_uses,
    expires_at,
    created_by
  ) VALUES (
    v_code,
    p_max_uses,
    CASE WHEN p_expires_days IS NOT NULL THEN NOW() + (p_expires_days || ' days')::INTERVAL ELSE NULL END,
    auth.uid()
  );

  RETURN v_code;
END;
$$;

-- 29. import_questions_bulk
CREATE OR REPLACE FUNCTION public.import_questions_bulk(questions_data jsonb)
 RETURNS TABLE(inserted_count integer, success boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  q_record JSONB;
  counter INTEGER := 0;
  v_skill_id UUID;
BEGIN
  -- Check if admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Iterate through JSON array
  FOR q_record IN SELECT * FROM jsonb_array_elements(questions_data)
  LOOP
    v_skill_id := (q_record->>'skill_id')::UUID;

    IF NOT EXISTS (SELECT 1 FROM public.skills WHERE skill_id = v_skill_id) THEN
       CONTINUE; -- Or RAISE EXCEPTION
    END IF;

    INSERT INTO public.questions (
      skill_id,
      type,
      content,
      options,
      solution,
      explanation,
      points,
      is_published
    ) VALUES (
      v_skill_id,
      COALESCE((q_record->>'type')::public.question_type, 'multiple_choice'::public.question_type),
      q_record->>'content',
      COALESCE(q_record->'options', '{}'::JSONB),
      q_record->'solution',
      q_record->>'explanation',
      COALESCE((q_record->>'points')::INTEGER, 1),
      COALESCE((q_record->>'is_published')::BOOLEAN, FALSE)
    );
    counter := counter + 1;
  END LOOP;

  RETURN QUERY SELECT counter, TRUE;
END;
$$;

-- 30. jwt_is_tenant_admin
CREATE OR REPLACE FUNCTION public.jwt_is_tenant_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND app_id = public.current_app_id()
    ),
    false
  );
$$;

-- 31. promote_error_to_issue
CREATE OR REPLACE FUNCTION public.promote_error_to_issue(p_error_id uuid, p_title text, p_root_cause text DEFAULT NULL::text, p_resolution text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  v_issue_id UUID;
BEGIN
  -- Create the known issue
  INSERT INTO public.known_issues (
    title,
    description,
    root_cause,
    resolution,
    status
  )
  SELECT 
    p_title,
    error_message,
    COALESCE(p_root_cause, 'Auto-promoted from error log'),
    p_resolution,
    'open'
  FROM public.error_logs
  WHERE id = p_error_id
  RETURNING id INTO v_issue_id;

  -- Update the error log status
  UPDATE public.error_logs
  SET status = 'promoted'
  WHERE id = p_error_id;

  RETURN v_issue_id;
END;
$$;

-- 32. jwt_is_mentor
CREATE OR REPLACE FUNCTION public.jwt_is_mentor()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') = 'mentor', false);
$$;
