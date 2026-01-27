-- Migration: 20260127000006_create_attempts.sql
-- Description: Create attempts table for student answers

CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  response JSONB NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE NOT NULL,
  score_awarded INTEGER DEFAULT 0 NOT NULL,
  time_spent_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON public.attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_updated ON public.attempts(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_attempts_updated_at ON public.attempts(updated_at);
