-- Migration: Student App v14 Parity
-- Description: Add multi-tenant isolation, metacognition triage, and economy tables.

-- 1. Multi-Tenant Hardening
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS app_id UUID REFERENCES public.apps(app_id);
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS app_id UUID REFERENCES public.apps(app_id);
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS app_id UUID REFERENCES public.apps(app_id);

-- 2. Metacognition Triage
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS confidence_rating INTEGER;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS difficulty_perception TEXT;

COMMENT ON COLUMN public.attempts.confidence_rating IS 'Student self-reported confidence (1-5).';
COMMENT ON COLUMN public.attempts.difficulty_perception IS 'Student perception of question difficulty (too_easy, just_right, too_hard).';

-- 3. User Metadata
CREATE TABLE IF NOT EXISTS public.user_metadata (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  hints_balance INTEGER DEFAULT 10,
  points_balance INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT points_non_negative CHECK (points_balance >= 0)
);

ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS user_metadata_isolation ON public.user_metadata;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY user_metadata_isolation ON public.user_metadata
FOR ALL TO authenticated
USING (
    id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- 4. User Activity (Heatmap)
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  activity_date DATE NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  time_spent_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS user_activity_isolation ON public.user_activity;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY user_activity_isolation ON public.user_activity
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- 5. Purchases (Economy Integrity)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS purchases_isolation ON public.purchases;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY purchases_isolation ON public.purchases
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- 6. Tracking Isolation (Backfill Policies)
CREATE POLICY attempts_isolation ON public.attempts
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY sessions_isolation ON public.sessions
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY skill_progress_isolation ON public.skill_progress
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_app_user ON public.attempts(app_id, user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_question ON public.attempts(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_ended ON public.sessions(user_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON public.user_activity(user_id, activity_date);

-- 7. Update Triggers
DO $$ BEGIN
  CREATE TRIGGER set_user_metadata_updated_at
    BEFORE UPDATE ON public.user_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. Comments
COMMENT ON TABLE public.user_metadata IS 'User-specific settings and points balance.';
COMMENT ON TABLE public.user_activity IS 'Daily aggregated activity for heatmap visualization.';
COMMENT ON TABLE public.purchases IS 'Persistent history of shop transactions.';
