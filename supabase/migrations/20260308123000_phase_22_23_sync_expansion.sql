-- Phase 22 & 23: Sync Expansion (Achievements & Difficulty)
-- Created: 2026-03-08
-- Description: Add difficulty_level to questions and create achievements table.

-- 1. Add difficulty_level to questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1;

COMMENT ON COLUMN public.questions.difficulty_level IS 'Adaptive difficulty: 1 (Support), 2 (Medium), 3 (Challenge).';

-- 2. Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ -- Unified lifecycle support
);

-- 3. Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY achievements_tenant_isolation ON public.achievements
FOR ALL TO authenticated
USING (
    (user_id = auth.uid() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- Note: DELETE intentionally omitted from policy if they are permanent, but for tombstone sync we need it.
-- Actually the policy 'FOR ALL' covers it.

-- 5. Comments
COMMENT ON TABLE public.achievements IS 'Gamification locks/unlocks for students.';
COMMENT ON COLUMN public.achievements.type IS 'Achievement identifier: mastery_1, streak_3, scholar_patience, resilient_1...';

-- 6. Trigger for updated_at
CREATE TRIGGER set_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
