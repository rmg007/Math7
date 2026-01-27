-- Migration: 20260127000012_create_indexes.sql
-- Description: Create performance indexes for domains, skills, questions
-- Note: Indexes for attempts, sessions, skill_progress are in their respective table files

-- Sync optimization indexes
CREATE INDEX IF NOT EXISTS idx_domains_updated_at ON public.domains(updated_at);
CREATE INDEX IF NOT EXISTS idx_skills_updated_at ON public.skills(updated_at);
CREATE INDEX IF NOT EXISTS idx_questions_updated_at ON public.questions(updated_at);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_skills_domain_id ON public.skills(domain_id);
CREATE INDEX IF NOT EXISTS idx_questions_skill_id ON public.questions(skill_id);

-- Published content indexes
CREATE INDEX IF NOT EXISTS idx_domains_published ON public.domains(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_skills_published ON public.skills(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_published ON public.questions(is_published) WHERE deleted_at IS NULL;
