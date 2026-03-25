-- ============================================================
-- studio_prompts: Persists AI Studio generation configurations
-- ============================================================

CREATE TABLE public.studio_prompts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id              UUID NOT NULL REFERENCES public.apps(app_id),
  created_by          UUID NOT NULL REFERENCES public.profiles(id),
  domain_name         TEXT NOT NULL,
  topics              TEXT[] NOT NULL DEFAULT '{}',
  question_count      INTEGER NOT NULL,
  difficulty_mix      JSONB NOT NULL,
  question_types      TEXT[] NOT NULL DEFAULT '{}',
  assembled_prompt    TEXT NOT NULL,
  custom_instructions TEXT,
  model_used          TEXT,
  token_count         INTEGER,
  generation_time_ms  INTEGER,
  questions_generated INTEGER DEFAULT 0,
  questions_saved     INTEGER DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'generated'
                      CHECK (status IN ('generated','saved','failed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_studio_prompts_app_id ON public.studio_prompts(app_id);
CREATE INDEX idx_studio_prompts_created_by ON public.studio_prompts(created_by);
CREATE INDEX idx_studio_prompts_created_at ON public.studio_prompts(created_at DESC);

ALTER TABLE public.studio_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio_prompts_select_policy"
  ON public.studio_prompts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND (p.role = 'super_admin' OR p.app_id = studio_prompts.app_id)
    )
  );

CREATE POLICY "studio_prompts_insert_policy"
  ON public.studio_prompts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND (p.role = 'super_admin' OR p.app_id = studio_prompts.app_id)
    )
  );

CREATE POLICY "studio_prompts_update_policy"
  ON public.studio_prompts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND (p.role = 'super_admin' OR p.app_id = studio_prompts.app_id)
    )
  );

-- DELETE intentionally omitted: studio_prompts are audit records

CREATE TRIGGER set_studio_prompts_updated_at
  BEFORE UPDATE ON public.studio_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK to questions table
ALTER TABLE public.questions
ADD COLUMN studio_prompt_id UUID REFERENCES public.studio_prompts(id);

CREATE INDEX idx_questions_studio_prompt_id
ON public.questions(studio_prompt_id) WHERE studio_prompt_id IS NOT NULL;
