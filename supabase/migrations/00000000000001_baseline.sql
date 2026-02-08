-- ══════════════════════════════════════════════════════════════════════════════
-- QUESTERIX DATABASE BASELINE MIGRATION
-- Consolidated from 34+ migrations into a single clean schema
-- Created: 2026-02-03
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
-- │ SECTION 3: CORE TABLES                                                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- PROFILES (User accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- SUBJECTS (e.g., Math, Science)
CREATE TABLE IF NOT EXISTS subjects (
  subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  status curriculum_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- APPS (Multi-tenant applications)
CREATE TABLE IF NOT EXISTS apps (
  app_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(subject_id),
  subdomain TEXT NOT NULL UNIQUE,
  app_name TEXT NOT NULL,
  grade_number INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  branding JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subject_id, grade_number)
);

-- DOMAINS (Curriculum domains)
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  color TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  status curriculum_status DEFAULT 'draft',
  app_id UUID REFERENCES apps(app_id)
);

-- SKILLS (Learning skills)
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  status curriculum_status DEFAULT 'draft',
  app_id UUID REFERENCES apps(app_id)
);

-- QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  content JSONB NOT NULL,
  options JSONB,
  solution JSONB NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  status curriculum_status DEFAULT 'draft',
  app_id UUID REFERENCES apps(app_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 4: MENTOR HUB TABLES                                                 │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- GROUPS (Teacher classes and family groups)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(app_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type group_type NOT NULL DEFAULT 'class',
  join_code TEXT NOT NULL UNIQUE,
  allow_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- GROUP_MEMBERS
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  anonymous_device_id UUID,
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, anonymous_device_id),
  CHECK (user_id IS NOT NULL OR anonymous_device_id IS NOT NULL)
);

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  type assignment_type NOT NULL,
  scope assignment_scope DEFAULT 'mandatory',
  status assignment_status DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  completion_trigger JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 5: TRACKING TABLES                                                   │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- ATTEMPTS (Question attempts)
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id UUID,
  answered JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  time_spent_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SESSIONS (Learning sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent_ms INTEGER DEFAULT 0
);

-- SKILL_PROGRESS (Mastery tracking)
CREATE TABLE IF NOT EXISTS skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  mastery_level DECIMAL(5,2) DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 6: SUPPORT TABLES                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- INVITATION_CODES
CREATE TABLE IF NOT EXISTS invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CURRICULUM_META (Version tracking)
CREATE TABLE IF NOT EXISTS curriculum_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  last_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CURRICULUM_SNAPSHOTS
CREATE TABLE IF NOT EXISTS curriculum_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OUTBOX (Event outbox for async processing)
CREATE TABLE IF NOT EXISTS outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SYNC_META (For client sync)
CREATE TABLE IF NOT EXISTS sync_meta (
  table_name TEXT PRIMARY KEY,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- APP_LANDING_PAGES
CREATE TABLE IF NOT EXISTS app_landing_pages (
  landing_page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL UNIQUE REFERENCES apps(app_id) ON DELETE CASCADE,
  hero_headline TEXT,
  hero_subtext TEXT,
  features JSONB DEFAULT '[]',
  testimonials JSONB DEFAULT '[]',
  pricing_info JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- USER_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS user_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES apps(app_id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'free',
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id)
);

-- SECURITY_EVENTS
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 7: INDEXES                                                           │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Groups
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON groups(join_code);
CREATE INDEX IF NOT EXISTS idx_groups_app_id ON groups(app_id);

-- Group Members
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON group_members(group_id, user_id);

-- Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_skill ON questions(skill_id);
CREATE INDEX IF NOT EXISTS idx_questions_skill_sort ON questions(skill_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);

-- Attempts
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id) WHERE ended_at IS NULL;

-- Skill Progress
CREATE INDEX IF NOT EXISTS idx_skill_progress_user ON skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_user_skill ON skill_progress(user_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_mastery ON skill_progress(mastery_level);

-- Domains
CREATE INDEX IF NOT EXISTS idx_domains_app ON domains(app_id);

-- Skills
CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain_id);
CREATE INDEX IF NOT EXISTS idx_skills_app ON skills(app_id);

-- Apps
CREATE INDEX IF NOT EXISTS idx_apps_subject ON apps(subject_id);
CREATE INDEX IF NOT EXISTS idx_apps_subdomain ON apps(subdomain);
CREATE INDEX IF NOT EXISTS idx_apps_active ON apps(is_active);

-- Invitation Codes
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_active ON invitation_codes(is_active) WHERE is_active = true;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 8: HELPER FUNCTIONS                                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Generate unique join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- JWT-based admin check (no DB query, no recursion!)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false);
$$;

-- JWT helper functions
CREATE OR REPLACE FUNCTION jwt_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'), false);
$$;

CREATE OR REPLACE FUNCTION jwt_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') = 'super_admin', false);
$$;

CREATE OR REPLACE FUNCTION jwt_is_mentor()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') = 'mentor', false);
$$;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 9: JWT AUTH HOOK                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Auth hook that adds user role to JWT claims
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  SELECT role::text INTO user_role FROM profiles WHERE id = (event->>'user_id')::uuid;
  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'student')));
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT SELECT ON profiles TO supabase_auth_admin;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 10: TRIGGERS                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Auto-generate join code for new groups
CREATE OR REPLACE FUNCTION set_group_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := generate_join_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_group_join_code ON groups;
CREATE TRIGGER trigger_set_group_join_code
  BEFORE INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION set_group_join_code();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 11: ROW LEVEL SECURITY                                               │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

-- RLS disabled for these (system tables)
ALTER TABLE sync_meta DISABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES (All use JWT claims to avoid recursion)
-- ══════════════════════════════════════════════════════════════════════════════

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());

-- GROUPS
CREATE POLICY "groups_admin_all" ON groups FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "groups_owner_all" ON groups FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "groups_member_select" ON groups FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()));

-- GROUP_MEMBERS
CREATE POLICY "group_members_admin_all" ON group_members FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "group_members_self_select" ON group_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "group_members_owner_all" ON group_members FOR ALL TO authenticated 
  USING (group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()))
  WITH CHECK (group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()));

-- ASSIGNMENTS
CREATE POLICY "assignments_admin_all" ON assignments FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "assignments_owner_all" ON assignments FOR ALL TO authenticated 
  USING (group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()))
  WITH CHECK (group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()));
CREATE POLICY "assignments_student_select" ON assignments FOR SELECT TO authenticated 
  USING (student_id = auth.uid() OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

-- DOMAINS
CREATE POLICY "domains_admin_all" ON domains FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "domains_read_published" ON domains FOR SELECT TO authenticated USING (is_published = true AND deleted_at IS NULL);

-- SKILLS
CREATE POLICY "skills_admin_all" ON skills FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "skills_read_published" ON skills FOR SELECT TO authenticated USING (is_published = true AND deleted_at IS NULL);

-- QUESTIONS
CREATE POLICY "questions_admin_all" ON questions FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "questions_read_published" ON questions FOR SELECT TO authenticated USING (is_published = true AND deleted_at IS NULL);

-- ATTEMPTS
CREATE POLICY "attempts_admin_select" ON attempts FOR SELECT TO authenticated USING (jwt_is_admin());
CREATE POLICY "attempts_own_insert" ON attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "attempts_own_select" ON attempts FOR SELECT TO authenticated USING (user_id = auth.uid());

-- SESSIONS
CREATE POLICY "sessions_admin_select" ON sessions FOR SELECT TO authenticated USING (jwt_is_admin());
CREATE POLICY "sessions_own_all" ON sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SKILL_PROGRESS
CREATE POLICY "skill_progress_admin_select" ON skill_progress FOR SELECT TO authenticated USING (jwt_is_admin());
CREATE POLICY "skill_progress_own_all" ON skill_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- CURRICULUM_META
CREATE POLICY "curriculum_meta_admin_all" ON curriculum_meta FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "curriculum_meta_read" ON curriculum_meta FOR SELECT TO authenticated USING (true);

-- CURRICULUM_SNAPSHOTS
CREATE POLICY "curriculum_snapshots_admin_all" ON curriculum_snapshots FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());

-- APPS
CREATE POLICY "apps_admin_all" ON apps FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "apps_read_active" ON apps FOR SELECT TO authenticated USING (is_active = true);

-- SUBJECTS
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "subjects_read_published" ON subjects FOR SELECT TO authenticated USING (status = 'published');

-- APP_LANDING_PAGES
CREATE POLICY "app_landing_pages_admin_all" ON app_landing_pages FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "app_landing_pages_read" ON app_landing_pages FOR SELECT TO anon USING (true);

-- USER_SUBSCRIPTIONS
CREATE POLICY "user_subscriptions_admin_all" ON user_subscriptions FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "user_subscriptions_own_select" ON user_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- SECURITY_EVENTS
CREATE POLICY "security_events_admin_all" ON security_events FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());

-- INVITATION_CODES
CREATE POLICY "invitation_codes_admin_all" ON invitation_codes FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
CREATE POLICY "invitation_codes_check" ON invitation_codes FOR SELECT TO anon USING (is_active = true);

-- OUTBOX
CREATE POLICY "outbox_admin_all" ON outbox FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SECTION 12: GRANT PERMISSIONS                                                │
-- └─────────────────────────────────────────────────────────────────────────────┘

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION jwt_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION jwt_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION jwt_is_mentor() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_join_code() TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF BASELINE MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
