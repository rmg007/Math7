-- Migration: 20260204000002_ironclad_rpcs.sql
-- Description: RPCs for Operation Ironclad (Recovery, Batch Processing, Group Access)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Account Recovery (Identity Transfer)
CREATE OR REPLACE FUNCTION public.recover_student_identity(recovery_phrase TEXT)
RETURNS TEXT AS $$
DECLARE
    key_record RECORD;
    old_student_id UUID;
    new_student_id UUID := auth.uid();
    transferred_count INTEGER;
BEGIN
    -- Locate key (we verify hash)
    -- Note: In production, use pgcrypto. For MVP, we assume client sends the plain phrase and we compare against hash?
    -- ideally: WHERE key_hash = crypt(recovery_phrase, key_hash)
    -- For now, let's assume the stored key is the hash using pgcrypto.
    
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
    
    -- Perform Data Transfer (Re-parenting)
    -- 1. Attempts
    UPDATE public.attempts SET user_id = new_student_id WHERE user_id = old_student_id;
    
    -- 2. Sessions
    UPDATE public.sessions SET user_id = new_student_id WHERE user_id = old_student_id;
    
    -- 3. Skill Progress (Handle conflict if new user already started?)
    -- Strategy: Delete new user's progress if conflict? Or merge?
    -- "Restrictive Wins". We keep the "old" (recovered) progress as truth usually.
    -- Simple approach: Delete new user's conflicting rows, then move old ones.
    DELETE FROM public.skill_progress WHERE user_id = new_student_id AND skill_id IN (SELECT skill_id FROM public.skill_progress WHERE user_id = old_student_id);
    UPDATE public.skill_progress SET user_id = new_student_id WHERE user_id = old_student_id;
    
    -- 4. Group Members
    DELETE FROM public.group_members WHERE user_id = new_student_id AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = old_student_id);
    UPDATE public.group_members SET user_id = new_student_id WHERE user_id = old_student_id;
    
    -- 5. Mark key used
    UPDATE public.student_recovery_keys SET used_at = NOW() WHERE id = key_record.id;
    
    -- 6. Soft-delete old profile to prevent confusion
    UPDATE public.profiles SET deleted_at = NOW() WHERE id = old_student_id;
    
    RETURN 'Account recovered successfully. ' || old_student_id::TEXT || ' -> ' || new_student_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Join Group Request (Gatekeeper)
CREATE OR REPLACE FUNCTION public.join_group_via_code(join_code_input TEXT)
RETURNS JSONB AS $$
DECLARE
    target_group RECORD;
    membership_exists BOOLEAN;
BEGIN
    -- Find group
    SELECT * INTO target_group FROM public.groups WHERE join_code = join_code_input AND deleted_at IS NULL;
    
    IF target_group.id IS NULL THEN
        RAISE EXCEPTION 'Invalid join code';
    END IF;
    
    -- Check existing membership
    SELECT EXISTS(SELECT 1 FROM public.group_members WHERE group_id = target_group.id AND student_id = auth.uid()) INTO membership_exists;
    IF membership_exists THEN
        RETURN jsonb_build_object('status', 'already_member', 'group_name', target_group.name);
    END IF;
    
    -- Logic: Direct Add or Request?
    IF target_group.requires_approval THEN
        -- Insert Request
        INSERT INTO public.group_join_requests (group_id, student_id, status)
        VALUES (target_group.id, auth.uid(), 'pending')
        ON CONFLICT (group_id, student_id) DO UPDATE SET status = 'pending', updated_at = NOW();
        
        RETURN jsonb_build_object('status', 'pending_approval', 'group_name', target_group.name);
    ELSE
        -- Direct Add
        INSERT INTO public.group_members (group_id, student_id, role)
        VALUES (target_group.id, auth.uid(), 'student')
        ON CONFLICT DO NOTHING;
        
        RETURN jsonb_build_object('status', 'joined', 'group_name', target_group.name);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Mastery Calculation Trigger (Data Integrity)
CREATE OR REPLACE FUNCTION public.calculate_mastery_on_attempt()
RETURNS TRIGGER AS $$
DECLARE
    stats RECORD;
BEGIN
    -- Recalculate stats for this user/skill
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_correct) as correct,
        SUM(score_awarded) as points
    INTO stats
    FROM public.attempts
    WHERE user_id = NEW.user_id 
    AND question_id IN (SELECT id FROM public.questions WHERE skill_id = (SELECT skill_id FROM public.questions WHERE id = NEW.question_id));
    
    -- Upsert skill_progress
    INSERT INTO public.skill_progress (user_id, skill_id, total_attempts, correct_attempts, total_points, mastery_level, updated_at)
    VALUES (
        NEW.user_id,
        (SELECT skill_id FROM public.questions WHERE id = NEW.question_id),
        stats.total,
        stats.correct,
        COALESCE(stats.points, 0),
        CASE WHEN stats.total >= 3 THEN (stats.correct::FLOAT / stats.total::FLOAT * 100)::INTEGER ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id, skill_id) DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        correct_attempts = EXCLUDED.correct_attempts,
        total_points = EXCLUDED.total_points,
        mastery_level = EXCLUDED.mastery_level,
        updated_at = NOW(),
        last_attempt_at = NOW();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger
DROP TRIGGER IF EXISTS trigger_calc_mastery ON public.attempts;
CREATE TRIGGER trigger_calc_mastery
AFTER INSERT OR UPDATE ON public.attempts
FOR EACH ROW EXECUTE FUNCTION public.calculate_mastery_on_attempt();
