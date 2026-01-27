-- Migration: 20260127000005_create_questions.sql
-- Description: Create questions table

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  type public.question_type DEFAULT 'multiple_choice'::public.question_type NOT NULL,
  content TEXT NOT NULL,
  options JSONB DEFAULT '{}'::jsonb NOT NULL,
  solution JSONB NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1 NOT NULL,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);
