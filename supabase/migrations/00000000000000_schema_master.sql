-- ══════════════════════════════════════════════════════════════════════════════
-- QUESTERIX UNIFIED MASTER SCHEMA (Phase 2.0-beta)
-- Created: 2026-02-10
-- Description: Consolidated, high-integrity schema including all structural 
--              patches, multi-tenant hardening, and security audits.
-- ══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 1: EXTENSIONS                                                        │
-- └─────────────────────────────────────────────────────────────────────────────┘
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 2: ENUMS                                                             │
-- └─────────────────────────────────────────────────────────────────────────────┘
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'student', 'mentor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE curriculum_status AS ENUM ('draft', 'published', 'live');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('multiple_choice', 'mcq_multi', 'text_input', 'boolean', 'reorder_steps');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE group_type AS ENUM ('class', 'family');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_type AS ENUM ('skill_mastery', 'time_goal', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_scope AS ENUM ('mandatory', 'suggested');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('pending', 'completed', 'late');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 4: CORE TABLES                                                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  status curriculum_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- APPS (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.apps (
  app_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(subject_id),
  subdomain TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  grade_number INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  branding JSONB DEFAULT '{}',
  ai_token_limit INTEGER DEFAULT 1000000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subject_id, grade_number)
);

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(app_id),
  role user_role NOT NULL DEFAULT 'student',
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 5: CURRICULUM ARCHITECTURE                                           │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.domains (
  domain_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  color TEXT,
  status curriculum_status DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(app_id, slug)
);

-- SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
  skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(domain_id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  difficulty_level INTEGER DEFAULT 1,
  status curriculum_status DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(app_id, slug)
);

CREATE TABLE IF NOT EXISTS public.questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  type question_type NOT NULL,
  content JSONB NOT NULL,
  options JSONB,
  solution JSONB NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  status curriculum_status DEFAULT 'draft',
  content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 6: MENTOR HUB & GROUPS                                               │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  name TEXT NOT NULL,
  type group_type NOT NULL DEFAULT 'class',
  join_code TEXT NOT NULL UNIQUE,
  allow_anonymous BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role DEFAULT 'student',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL, -- Skill or Domain ID
  type assignment_type NOT NULL,
  scope assignment_scope DEFAULT 'mandatory',
  status assignment_status DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  completion_trigger JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (group_id IS NOT NULL OR student_id IS NOT NULL)
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 7: TRACKING & MASTERY                                                │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(question_id) ON DELETE CASCADE,
  response JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  score_awarded INTEGER NOT NULL DEFAULT 0,
  time_spent_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(skill_id) ON DELETE CASCADE,
  mastery_level REAL DEFAULT 0.0,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 8: SYSTEM & GOVERNANCE                                               │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.curriculum_meta (
  app_id UUID PRIMARY KEY REFERENCES public.apps(app_id),
  version INTEGER NOT NULL DEFAULT 1,
  last_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(app_id),
  operation TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- APP LANDING PAGES
CREATE TABLE IF NOT EXISTS public.app_landing_pages (
  landing_page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL UNIQUE REFERENCES public.apps(app_id) ON DELETE CASCADE,
  hero_headline TEXT,
  hero_subheadline TEXT,
  meta_title TEXT,
  meta_description TEXT,
  cta_text TEXT,
  sections JSONB DEFAULT '[]'::JSONB,
  features JSONB DEFAULT '[]'::JSONB,
  status curriculum_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 24. Achievements (Gamification)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 25. User Activity (Daily Stats)
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  time_spent_ms BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id, activity_date)
);

-- 26. User Metadata (Balances & Streaks)
CREATE TABLE IF NOT EXISTS public.user_metadata (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  hints_balance INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. Purchases (Store)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(app_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 28. Source Documents (AI Input)
CREATE TABLE IF NOT EXISTS public.source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  extracted_text TEXT,
  page_count INTEGER,
  error_message TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 29. AI Generation Sessions
CREATE TABLE IF NOT EXISTS public.ai_generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(skill_id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  model_used TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  questions_generated INTEGER DEFAULT 0,
  questions_imported INTEGER DEFAULT 0,
  difficulty_distribution JSONB,
  token_count INTEGER,
  generation_time_ms INTEGER,
  raw_response JSONB,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 30. Curriculum Meta (State Management)
CREATE TABLE IF NOT EXISTS public.curriculum_meta (
  app_id UUID PRIMARY KEY REFERENCES public.apps(app_id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  last_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 31. Curriculum Snapshots (Versioned Backups)
CREATE TABLE IF NOT EXISTS public.curriculum_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(app_id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::JSONB,
  domains_count INTEGER NOT NULL DEFAULT 0,
  skills_count INTEGER NOT NULL DEFAULT 0,
  questions_count INTEGER NOT NULL DEFAULT 0,
  published_by UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 32. Approval Workflows (Revision Control)
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_generation_sessions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);




-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 3: HELPER FUNCTIONS (Security & Logic)                              │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- JWT-based admin check (No DB query)
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false);
$$;

CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') = 'super_admin', false);
$$;

CREATE OR REPLACE FUNCTION public.jwt_is_mentor()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') = 'mentor', false);
$$;

-- Tenant context helpers (Cached in session where possible)
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin') 
        AND app_id IS NOT NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_app_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT app_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Utility: Generic timestamp updater
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 9: ROW LEVEL SECURITY                                               │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 1. Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Policies: Profiles (Tenant Isolation)
CREATE POLICY profiles_tenant_isolation ON public.profiles
FOR ALL TO authenticated
USING (
    (id = auth.uid() AND app_id IS NOT NULL) -- Own profile
    OR 
    (jwt_is_admin() AND app_id = current_app_id()) -- Tenant admin
    OR 
    (jwt_is_super_admin()) -- Global super admin
);

-- 3. Policies: Apps & Subjects
CREATE POLICY apps_tenant_read ON public.apps FOR SELECT TO authenticated
USING (app_id = current_app_id() OR jwt_is_super_admin());

CREATE POLICY subjects_all_read ON public.subjects FOR SELECT TO authenticated
USING (status = 'live' OR jwt_is_admin());

-- 4. Policies: Curriculum (The "Strike Fix")
CREATE POLICY curriculum_tenant_isolation ON public.domains FOR ALL TO authenticated
USING (app_id = current_app_id() OR jwt_is_super_admin());

CREATE POLICY curriculum_tenant_isolation ON public.skills FOR ALL TO authenticated
USING (app_id = current_app_id() OR jwt_is_super_admin());

CREATE POLICY curriculum_tenant_isolation ON public.questions FOR ALL TO authenticated
USING (app_id = current_app_id() OR jwt_is_super_admin());

-- 5. Policies: Mentor Hub (HARDENED)
CREATE POLICY group_tenant_isolation ON public.groups FOR ALL TO authenticated
USING (
    (app_id = current_app_id() AND owner_id = auth.uid()) -- Mentor
    OR 
    (app_id = current_app_id() AND EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.student_id = auth.uid())) -- Student
);

CREATE POLICY members_tenant_isolation ON public.group_members FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.app_id = current_app_id())
);

CREATE POLICY assignments_tenant_isolation ON public.assignments FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = assignments.group_id AND g.app_id = current_app_id())
    OR
    (student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.app_id = current_app_id()))
);

-- 6. Generic Policies for student-owned data
CREATE POLICY achievements_tenant_isolation ON public.achievements FOR ALL TO authenticated
USING (app_id = current_app_id() AND (user_id = auth.uid() OR jwt_is_admin()));

CREATE POLICY user_activity_tenant_isolation ON public.user_activity FOR ALL TO authenticated
USING (app_id = current_app_id() AND (user_id = auth.uid() OR jwt_is_admin()));

CREATE POLICY user_metadata_tenant_isolation ON public.user_metadata FOR ALL TO authenticated
USING (app_id = current_app_id() AND (id = auth.uid() OR jwt_is_admin()));

CREATE POLICY purchases_tenant_isolation ON public.purchases FOR ALL TO authenticated
USING (app_id = current_app_id() AND (user_id = auth.uid() OR jwt_is_admin()));

-- 7. Logic for Admin-Only Tables (Source Docs & AI Sessions)
CREATE POLICY source_documents_admin_only ON public.source_documents FOR ALL TO authenticated
USING (jwt_is_admin() AND app_id = current_app_id());

CREATE POLICY ai_generation_admin_only ON public.ai_generation_sessions FOR ALL TO authenticated
USING (jwt_is_admin() AND app_id = current_app_id());

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 10: TRIGGERS                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_apps_modtime BEFORE UPDATE ON public.apps FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_domains_modtime BEFORE UPDATE ON public.domains FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_skills_modtime BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_questions_modtime BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_groups_modtime BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
