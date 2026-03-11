-- Migration for difficulty_level on questions table
-- Created manually to match production schema state.

ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1;

COMMENT ON COLUMN public.questions.difficulty_level IS 'Manual override for question difficulty. Defaults to 1.';
