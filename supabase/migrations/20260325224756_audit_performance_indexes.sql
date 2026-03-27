-- ══════════════════════════════════════════════════════════════════════════════
-- PERF-DB-01: Performance Index Audit & Optimization
-- Description: Adds missing composite indexes for high-traffic telemetry tables
--              and app_id + deleted_at composite indexes for all soft-delete tables.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. High-Traffic Tables
-- user_activity
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created 
ON public.user_activity(user_id, created_at DESC);

-- attempts
CREATE INDEX IF NOT EXISTS idx_attempts_user_created 
ON public.attempts(user_id, created_at DESC);


-- 2. Soft-Delete Tables (app_id + deleted_at)
-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_app_deleted 
ON public.profiles(app_id) WHERE deleted_at IS NULL;

-- Domains
CREATE INDEX IF NOT EXISTS idx_domains_app_deleted 
ON public.domains(app_id) WHERE deleted_at IS NULL;

-- Skills
CREATE INDEX IF NOT EXISTS idx_skills_app_deleted 
ON public.skills(app_id) WHERE deleted_at IS NULL;

-- Questions (already has some indexes, but explicitly ensure app_id + deleted_at)
CREATE INDEX IF NOT EXISTS idx_questions_app_deleted 
ON public.questions(app_id) WHERE deleted_at IS NULL;

-- Groups
CREATE INDEX IF NOT EXISTS idx_groups_app_deleted 
ON public.groups(app_id) WHERE deleted_at IS NULL;

-- Achievements
CREATE INDEX IF NOT EXISTS idx_achievements_app_deleted 
ON public.achievements(app_id) WHERE deleted_at IS NULL;

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_app_deleted 
ON public.purchases(app_id) WHERE deleted_at IS NULL;

-- Source Documents
CREATE INDEX IF NOT EXISTS idx_source_documents_app_deleted 
ON public.source_documents(app_id) WHERE deleted_at IS NULL;

-- AI Generation Sessions
CREATE INDEX IF NOT EXISTS idx_ai_sessions_app_deleted 
ON public.ai_generation_sessions(app_id) WHERE deleted_at IS NULL;
