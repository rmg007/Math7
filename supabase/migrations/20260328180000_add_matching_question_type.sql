-- Add 'matching' to question_type enum if it doesn't exist
DO $$ BEGIN
    ALTER TYPE public.question_type ADD VALUE 'matching';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
