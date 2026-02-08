-- Migration: 20260127000007_create_sessions.sql
-- Description: Create sessions table for practice sessions

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  questions_attempted INTEGER DEFAULT 0 NOT NULL,
  questions_correct INTEGER DEFAULT 0 NOT NULL,
  total_time_ms INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON public.sessions(updated_at);
