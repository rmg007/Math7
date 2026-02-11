-- Migration: 20260204000004_fix_domains_schema.sql
-- Description: Add subject_id to domains table to support multi-tenant curriculum isolation

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'domains' AND column_name = 'subject_id') THEN
        ALTER TABLE public.domains ADD COLUMN subject_id UUID REFERENCES public.subjects(subject_id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_domains_subject_id ON public.domains(subject_id);
