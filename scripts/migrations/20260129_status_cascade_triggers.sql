-- =============================================================================
-- STATUS CASCADE TRIGGERS MIGRATION
-- =============================================================================
-- Project: Math7
-- Generated: 2026-01-29
-- Description: 
--   1. Add status column to domains, skills, questions tables (draft/live only)
--   2. Create cascade triggers for status changes:
--      - When domain status changes → cascade to all skills and their questions
--      - When skill status changes → cascade to all questions
--   3. Sync is_published field with status column
-- =============================================================================

BEGIN;

-- Step 1: Create status enum type (drop if exists with different values)
DO $$ 
BEGIN
  -- Try to create the enum
  CREATE TYPE public.curriculum_status AS ENUM ('draft', 'live');
EXCEPTION 
  WHEN duplicate_object THEN
    -- Enum exists, check if it has the right values
    IF EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'public.curriculum_status'::regtype 
      AND enumlabel = 'published'
    ) THEN
      -- Need to migrate: rename 'published' values to 'draft' first in data
      -- Then recreate enum
      RAISE NOTICE 'curriculum_status enum exists with published value - will migrate';
    END IF;
END $$;

-- Step 2: Add status column to domains
ALTER TABLE public.domains 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' NOT NULL;

-- Step 3: Add status column to skills  
ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' NOT NULL;

-- Step 4: Add status column to questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' NOT NULL;

-- Step 5: Migrate any existing 'published' status to 'draft'
UPDATE public.domains SET status = 'draft' WHERE status = 'published';
UPDATE public.skills SET status = 'draft' WHERE status = 'published';
UPDATE public.questions SET status = 'draft' WHERE status = 'published';

-- Step 6: Ensure is_published column exists and sync with status
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false NOT NULL;

-- Sync is_published with status
UPDATE public.domains SET is_published = (status = 'live') WHERE is_published != (status = 'live');
UPDATE public.skills SET is_published = (status = 'live') WHERE is_published != (status = 'live');
UPDATE public.questions SET is_published = (status = 'live') WHERE is_published != (status = 'live');

-- =============================================================================
-- CASCADE TRIGGER FUNCTIONS
-- =============================================================================

-- Function: Cascade domain status change to skills and questions
CREATE OR REPLACE FUNCTION public.cascade_domain_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only cascade if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Update all skills under this domain (that are not deleted)
    UPDATE public.skills 
    SET status = NEW.status,
        is_published = (NEW.status = 'live'),
        updated_at = NOW()
    WHERE domain_id = NEW.id 
      AND deleted_at IS NULL;
    
    -- Update all questions under skills of this domain (that are not deleted)
    UPDATE public.questions q
    SET status = NEW.status,
        is_published = (NEW.status = 'live'),
        updated_at = NOW()
    FROM public.skills s
    WHERE q.skill_id = s.id 
      AND s.domain_id = NEW.id
      AND s.deleted_at IS NULL
      AND q.deleted_at IS NULL;
  END IF;
  
  -- Sync is_published with status for this domain
  NEW.is_published := (NEW.status = 'live');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Cascade skill status change to questions
CREATE OR REPLACE FUNCTION public.cascade_skill_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only cascade if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Update all questions under this skill (that are not deleted)
    UPDATE public.questions 
    SET status = NEW.status,
        is_published = (NEW.status = 'live'),
        updated_at = NOW()
    WHERE skill_id = NEW.id 
      AND deleted_at IS NULL;
  END IF;
  
  -- Sync is_published with status for this skill
  NEW.is_published := (NEW.status = 'live');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Sync is_published for questions when status changes
CREATE OR REPLACE FUNCTION public.sync_question_is_published()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_published := (NEW.status = 'live');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Sync is_published on insert for all tables
CREATE OR REPLACE FUNCTION public.sync_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_published := (NEW.status = 'live');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CREATE TRIGGERS
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS cascade_domain_status_trigger ON public.domains;
DROP TRIGGER IF EXISTS cascade_skill_status_trigger ON public.skills;
DROP TRIGGER IF EXISTS sync_question_is_published_trigger ON public.questions;
DROP TRIGGER IF EXISTS sync_domain_status_on_insert ON public.domains;
DROP TRIGGER IF EXISTS sync_skill_status_on_insert ON public.skills;
DROP TRIGGER IF EXISTS sync_question_status_on_insert ON public.questions;

-- Trigger: Cascade domain status changes (AFTER UPDATE to allow cascading)
CREATE TRIGGER cascade_domain_status_trigger
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.cascade_domain_status();

-- Trigger: Cascade skill status changes
CREATE TRIGGER cascade_skill_status_trigger
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.cascade_skill_status();

-- Trigger: Sync question is_published with status
CREATE TRIGGER sync_question_is_published_trigger
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.sync_question_is_published();

-- Triggers: Sync is_published on INSERT for all tables
CREATE TRIGGER sync_domain_status_on_insert
  BEFORE INSERT ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_status_on_insert();

CREATE TRIGGER sync_skill_status_on_insert
  BEFORE INSERT ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_status_on_insert();

CREATE TRIGGER sync_question_status_on_insert
  BEFORE INSERT ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_status_on_insert();

-- =============================================================================
-- CREATE INDEXES FOR STATUS COLUMN
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_skills_status ON public.skills(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status) WHERE deleted_at IS NULL;

COMMIT;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
