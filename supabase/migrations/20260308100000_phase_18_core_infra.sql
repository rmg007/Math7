-- Phase 18: Core Infrastructure (The Foundation)
-- Created: 2026-03-08
-- Description: Schema expansion for hints, ELI10, and granular session event tracking.

-- 1. Expand questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS hint_text TEXT,
ADD COLUMN IF NOT EXISTS rule_text TEXT,
ADD COLUMN IF NOT EXISTS eli10_text TEXT;

-- 2. Create session_events type and table
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('attempt', 'skip', 'flag', 'hint_used', 'rule_used', 'eli10_used');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(question_id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  type event_type NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY session_events_tenant_isolation ON public.session_events
FOR ALL TO authenticated
USING (
    (user_id = auth.uid() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
    OR 
    (COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false) AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- Note: Using subqueries in policy for user_id check to ensure tenant isolation.
-- This matches patterns in other tables.

-- 5. Comments for Documentation
COMMENT ON COLUMN public.questions.hint_text IS 'Short hint displayed when student is slightly stuck.';
COMMENT ON COLUMN public.questions.rule_text IS 'The mathematical rule or formula relevant to this question.';
COMMENT ON COLUMN public.questions.eli10_text IS 'Friendly, simplified explanation (Explain Like I am 10).';
COMMENT ON COLUMN public.session_events.details IS 'Structured data: {is_correct: bool, answer: any} for attempts, {tier: int} for hints.';

-- 6. RPC for Batch Insertion (Performance & Sync)
CREATE OR REPLACE FUNCTION public.batch_insert_session_events(events_json JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.session_events (id, user_id, question_id, app_id, type, details, created_at)
  SELECT 
    (e->>'id')::UUID,
    (e->>'user_id')::UUID,
    (e->>'question_id')::UUID,
    (e->>'app_id')::UUID,
    ((e->>'type')::event_type),
    (e->'details'),
    (e->>'created_at')::TIMESTAMPTZ
  FROM jsonb_array_elements(events_json) AS e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
