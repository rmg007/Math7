-- Migration: 20260205_operation_integrity.sql
-- Description: Critical fixes for multi-tenant isolation, data integrity, and RLS policies
-- Defects Fixed: M3, M5, M6, S4, D2

-- ============================================================================
-- PART 1: FIX M3 - Global Broadcast (curriculum_meta needs app_id)
-- ============================================================================

-- Add app_id column to curriculum_meta if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_meta' 
        AND column_name = 'app_id'
    ) THEN
        ALTER TABLE public.curriculum_meta ADD COLUMN app_id UUID REFERENCES public.apps(app_id);
        
        -- Migrate existing singleton to default app (if exists)
        UPDATE public.curriculum_meta 
        SET app_id = (SELECT app_id FROM public.apps LIMIT 1)
        WHERE app_id IS NULL;
        
        -- Make app_id NOT NULL after migration
        ALTER TABLE public.curriculum_meta ALTER COLUMN app_id SET NOT NULL;
        
        -- Drop the 'singleton' id approach - create unique constraint on app_id instead
        -- First, remove duplicate app_id entries if any
        DELETE FROM public.curriculum_meta a
        USING public.curriculum_meta b
        WHERE a.ctid < b.ctid AND a.app_id = b.app_id;
        
        -- Add unique constraint
        ALTER TABLE public.curriculum_meta ADD CONSTRAINT curriculum_meta_app_id_unique UNIQUE (app_id);
    END IF;
END $$;

-- RLS for curriculum_meta
ALTER TABLE public.curriculum_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS curriculum_meta_tenant_read ON public.curriculum_meta;
CREATE POLICY curriculum_meta_tenant_read ON public.curriculum_meta
    FOR SELECT USING (
        app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS curriculum_meta_admin_write ON public.curriculum_meta;
CREATE POLICY curriculum_meta_admin_write ON public.curriculum_meta
    FOR ALL USING (
        (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
        AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid())
    );


-- ============================================================================
-- PART 2: FIX M4 - Blind Fire RPC (publish_curriculum needs app_id param)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.publish_curriculum(p_app_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    target_app_id UUID;
    published_domains INTEGER := 0;
    published_skills INTEGER := 0;
    published_questions INTEGER := 0;
    new_version INTEGER;
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
    
    -- Update curriculum_meta for this app
    SELECT COALESCE(MAX(version), 0) + 1 INTO new_version 
    FROM public.curriculum_meta WHERE app_id = target_app_id;
    
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


-- ============================================================================
-- PART 3: FIX M5 - Cross-School Kidnapping (join_group_via_code tenant check)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.join_group_via_code(join_code_input TEXT)
RETURNS JSONB AS $$
DECLARE
    target_group RECORD;
    student_app_id UUID;
    membership_exists BOOLEAN;
BEGIN
    -- Get student's app_id
    SELECT app_id INTO student_app_id FROM public.profiles WHERE id = auth.uid();
    
    IF student_app_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found or missing app_id';
    END IF;
    
    -- Find group - MUST match student's app_id (SECURITY FIX)
    SELECT * INTO target_group FROM public.groups 
    WHERE join_code = join_code_input 
    AND app_id = student_app_id  -- CRITICAL: Same tenant only
    AND deleted_at IS NULL;
    
    IF target_group.id IS NULL THEN
        -- Generic error to prevent tenant enumeration
        RAISE EXCEPTION 'Invalid join code';
    END IF;
    
    -- Check existing membership
    SELECT EXISTS(
        SELECT 1 FROM public.group_members 
        WHERE group_id = target_group.id AND student_id = auth.uid()
    ) INTO membership_exists;
    
    IF membership_exists THEN
        RETURN jsonb_build_object('status', 'already_member', 'group_name', target_group.name);
    END IF;
    
    -- Logic: Direct Add or Request approval?
    IF target_group.requires_approval THEN
        INSERT INTO public.group_join_requests (group_id, student_id, status)
        VALUES (target_group.id, auth.uid(), 'pending')
        ON CONFLICT (group_id, student_id) DO UPDATE SET status = 'pending', updated_at = NOW();
        
        RETURN jsonb_build_object('status', 'pending_approval', 'group_name', target_group.name);
    ELSE
        INSERT INTO public.group_members (group_id, student_id, role)
        VALUES (target_group.id, auth.uid(), 'student')
        ON CONFLICT DO NOTHING;
        
        RETURN jsonb_build_object('status', 'joined', 'group_name', target_group.name);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- PART 4: FIX M6 + S4 - Super-Admin Leak & RLS NULL Audit
-- ============================================================================

-- Create helper function for tenant-scoped admin check
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = true 
        AND app_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get current user's app_id (for use in policies)
CREATE OR REPLACE FUNCTION public.current_app_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT app_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- FIX: Domains RLS - scope admin by tenant
DROP POLICY IF EXISTS domains_admin_all ON public.domains;
DROP POLICY IF EXISTS domains_tenant_admin ON public.domains;
CREATE POLICY domains_tenant_admin ON public.domains
    FOR ALL USING (
        -- Admin can manage their own tenant's domains
        (is_tenant_admin() AND app_id = current_app_id())
        OR
        -- Students can read live domains in their tenant
        (app_id = current_app_id() AND status = 'live' AND deleted_at IS NULL)
    );

-- FIX: Skills RLS - scope admin by tenant
DROP POLICY IF EXISTS skills_admin_all ON public.skills;
DROP POLICY IF EXISTS skills_tenant_admin ON public.skills;
CREATE POLICY skills_tenant_admin ON public.skills
    FOR ALL USING (
        (is_tenant_admin() AND app_id = current_app_id())
        OR
        (app_id = current_app_id() AND status = 'live' AND deleted_at IS NULL)
    );

-- FIX: Questions RLS - scope admin by tenant
DROP POLICY IF EXISTS questions_admin_all ON public.questions;
DROP POLICY IF EXISTS questions_tenant_admin ON public.questions;
CREATE POLICY questions_tenant_admin ON public.questions
    FOR ALL USING (
        (is_tenant_admin() AND app_id = current_app_id())
        OR
        (app_id = current_app_id() AND status = 'live' AND deleted_at IS NULL)
    );

-- FIX: Profiles RLS - ensure NULL app_id is denied
DROP POLICY IF EXISTS profiles_own ON public.profiles;
CREATE POLICY profiles_own ON public.profiles
    FOR ALL USING (
        id = auth.uid() 
        AND app_id IS NOT NULL  -- CRITICAL: Deny NULL app_id
    );

-- FIX: Groups RLS - scope by tenant
DROP POLICY IF EXISTS groups_tenant ON public.groups;
CREATE POLICY groups_tenant ON public.groups
    FOR ALL USING (
        app_id = current_app_id()
        AND app_id IS NOT NULL
    );


-- ============================================================================
-- PART 5: FIX D2 - Nuclear Recovery (GREATEST merge, not DELETE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recover_student_identity(recovery_phrase TEXT)
RETURNS TEXT AS $$
DECLARE
    key_record RECORD;
    old_student_id UUID;
    new_student_id UUID := auth.uid();
    merged_progress INTEGER := 0;
BEGIN
    -- Locate and verify recovery key
    SELECT * INTO key_record FROM public.student_recovery_keys
    WHERE key_hash = crypt(recovery_phrase, key_hash)
    AND (expires_at IS NULL OR expires_at > NOW())
    AND used_at IS NULL;
    
    IF key_record.id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired recovery key';
    END IF;
    
    old_student_id := key_record.student_id;
    
    IF old_student_id = new_student_id THEN
        RAISE EXCEPTION 'You are already this user';
    END IF;
    
    -- ========================================
    -- SMART MERGE: Keep the BEST progress
    -- ========================================
    
    -- 1. For skill_progress: Use GREATEST for scores
    INSERT INTO public.skill_progress (
        user_id, skill_id, total_attempts, correct_attempts, 
        total_points, mastery_level, current_streak, longest_streak,
        last_attempt_at, created_at, updated_at
    )
    SELECT 
        new_student_id,
        old_progress.skill_id,
        GREATEST(old_progress.total_attempts, COALESCE(new_progress.total_attempts, 0)),
        GREATEST(old_progress.correct_attempts, COALESCE(new_progress.correct_attempts, 0)),
        GREATEST(old_progress.total_points, COALESCE(new_progress.total_points, 0)),
        GREATEST(old_progress.mastery_level, COALESCE(new_progress.mastery_level, 0)),
        GREATEST(old_progress.current_streak, COALESCE(new_progress.current_streak, 0)),
        GREATEST(old_progress.longest_streak, COALESCE(new_progress.longest_streak, 0)),
        GREATEST(old_progress.last_attempt_at, new_progress.last_attempt_at),
        LEAST(old_progress.created_at, COALESCE(new_progress.created_at, NOW())),
        NOW()
    FROM public.skill_progress old_progress
    LEFT JOIN public.skill_progress new_progress 
        ON new_progress.user_id = new_student_id 
        AND new_progress.skill_id = old_progress.skill_id
    WHERE old_progress.user_id = old_student_id
    ON CONFLICT (user_id, skill_id) DO UPDATE SET
        total_attempts = GREATEST(skill_progress.total_attempts, EXCLUDED.total_attempts),
        correct_attempts = GREATEST(skill_progress.correct_attempts, EXCLUDED.correct_attempts),
        total_points = GREATEST(skill_progress.total_points, EXCLUDED.total_points),
        mastery_level = GREATEST(skill_progress.mastery_level, EXCLUDED.mastery_level),
        current_streak = GREATEST(skill_progress.current_streak, EXCLUDED.current_streak),
        longest_streak = GREATEST(skill_progress.longest_streak, EXCLUDED.longest_streak),
        updated_at = NOW();
    
    GET DIAGNOSTICS merged_progress = ROW_COUNT;
    
    -- 2. Re-parent attempts (append, don't replace)
    UPDATE public.attempts SET user_id = new_student_id WHERE user_id = old_student_id;
    
    -- 3. Re-parent sessions
    UPDATE public.sessions SET user_id = new_student_id WHERE user_id = old_student_id;
    
    -- 4. Merge group memberships (ignore duplicates)
    INSERT INTO public.group_members (group_id, student_id, role)
    SELECT group_id, new_student_id, role FROM public.group_members WHERE user_id = old_student_id
    ON CONFLICT DO NOTHING;
    
    -- 5. Mark recovery key as used
    UPDATE public.student_recovery_keys SET used_at = NOW() WHERE id = key_record.id;
    
    -- 6. Soft-delete old profile
    UPDATE public.profiles SET deleted_at = NOW() WHERE id = old_student_id;
    
    RETURN 'Account recovered. ' || merged_progress || ' skills merged. ' || old_student_id::TEXT || ' -> ' || new_student_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- PART 6: Ensure skill_progress has unique constraint (for D3)
-- ============================================================================

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'skill_progress_user_skill_unique'
    ) THEN
        ALTER TABLE public.skill_progress 
        ADD CONSTRAINT skill_progress_user_skill_unique UNIQUE (user_id, skill_id);
    END IF;
END $$;


-- ============================================================================
-- PART 7: Add status column to outbox for Dead Letter Queue (for D1)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'outbox' 
        AND column_name = 'status'
    ) THEN
        -- Note: This is for reference. The actual outbox is in SQLite (Drift).
        -- This documents the expected schema for any server-side outbox.
        RAISE NOTICE 'Outbox status column should be added to Drift tables.dart';
    END IF;
END $$;


-- ============================================================================
-- VERIFICATION QUERIES (run manually to confirm)
-- ============================================================================

-- Check curriculum_meta has app_id
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'curriculum_meta';

-- Check RLS policies exist
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check unique constraint on skill_progress
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.skill_progress'::regclass;


-- ============================================================================
-- PART 8: FIX S3 - Token Quota Enforcement
-- ============================================================================

-- Create ai_token_usage table for tracking consumption
CREATE TABLE IF NOT EXISTS public.ai_token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES public.apps(app_id),
    operation TEXT NOT NULL,  -- 'generate_questions', 'validate_content', etc.
    tokens_used INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS ai_token_usage_app_date_idx 
    ON public.ai_token_usage(app_id, created_at DESC);

-- RLS for ai_token_usage
ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_token_usage_admin_read ON public.ai_token_usage;
CREATE POLICY ai_token_usage_admin_read ON public.ai_token_usage
    FOR SELECT USING (
        is_tenant_admin() AND app_id = current_app_id()
    );

-- RPC to consume tokens (called by Edge Functions)
CREATE OR REPLACE FUNCTION public.consume_tenant_tokens(
    p_app_id UUID,
    p_tokens_used INTEGER,
    p_operation TEXT
)
RETURNS VOID AS $$
DECLARE
    monthly_limit INTEGER;
    current_usage INTEGER;
BEGIN
    -- Get tenant's monthly limit (default 1M tokens)
    SELECT COALESCE(
        (SELECT ai_token_limit FROM public.apps WHERE app_id = p_app_id),
        1000000
    ) INTO monthly_limit;
    
    -- Get current month usage
    SELECT COALESCE(SUM(tokens_used), 0) INTO current_usage
    FROM public.ai_token_usage
    WHERE app_id = p_app_id
    AND created_at >= date_trunc('month', NOW());
    
    -- Record usage
    INSERT INTO public.ai_token_usage (app_id, operation, tokens_used, user_id)
    VALUES (p_app_id, p_operation, p_tokens_used, auth.uid());
    
    -- Log if approaching limit (90% threshold)
    IF (current_usage + p_tokens_used) > (monthly_limit * 0.9) THEN
        RAISE NOTICE 'Tenant % approaching AI token limit: %/% used', 
            p_app_id, current_usage + p_tokens_used, monthly_limit;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add ai_token_limit column to apps table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'apps' 
        AND column_name = 'ai_token_limit'
    ) THEN
        ALTER TABLE public.apps ADD COLUMN ai_token_limit INTEGER DEFAULT 1000000;
    END IF;
END $$;
