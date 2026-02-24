-- Change questions.content and questions.solution from JSONB to TEXT
-- This enables efficient text-based searching (ilike) which is not supported on JSONB columns.

ALTER TABLE public.questions 
  ALTER COLUMN content TYPE text USING (content #>> '{}'),
  ALTER COLUMN solution TYPE text USING (solution #>> '{}');

-- Update any existing nulls to empty string to prevent search issues
UPDATE public.questions SET content = '' WHERE content IS NULL;
UPDATE public.questions SET solution = '' WHERE solution IS NULL;

-- Make columns NOT NULL if they were intended to be mandatory
ALTER TABLE public.questions 
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN solution SET NOT NULL;
