-- Migration: 20260127000008_create_skill_progress.sql
-- Description: Create skill_progress table for mastery tracking

CREATE TABLE IF NOT EXISTS public.skill_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  total_attempts INTEGER DEFAULT 0 NOT NULL,
  correct_attempts INTEGER DEFAULT 0 NOT NULL,
  total_points INTEGER DEFAULT 0 NOT NULL,
  mastery_level INTEGER DEFAULT 0 NOT NULL CHECK (mastery_level BETWEEN 0 AND 100),
  current_streak INTEGER DEFAULT 0 NOT NULL,
  best_streak INTEGER DEFAULT 0 NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, skill_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_progress_user_id ON public.skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_skill_id ON public.skill_progress(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_updated_at ON public.skill_progress(updated_at);
