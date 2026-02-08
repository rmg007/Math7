# Questerix Transformation: Master Migration Plan
## From Single-App (Math7) to Multi-Tenant Platform (Questerix)

**Document Version:** 1.1  
**Last Updated:** 2026-02-02
**Status:** Implementation Phase (Student App Hardening & E2E Stability Verified) - Ready for multi-tenant data migration

---

## Executive Summary

### Current State: Math7 (Single Subject, Single Grade)
```
Math7 Ecosystem:
├── Admin Panel (React + Vite + Supabase)
│   └── Manages: Domains, Skills, Questions for Math Grade 7 only
├── Student App (Flutter Web + Mobile)
│   └── Delivers: Math Grade 7 learning experience
└── Database (Supabase)
    └── Tables: domains, skills, questions, users, attempts, sessions
```

### Target State: Questerix (Multi-Subject, Multi-Grade Platform)
```
Questerix Ecosystem:
├── Landing App (React + Vite + Cloudflare Pages)
│   ├── questerix.com (root hub)
│   ├── math.questerix.com (subject hub)
│   ├── m7.questerix.com (grade-specific landing)
│   └── 500+ dynamically generated landing pages
│
├── Admin Panel (Enhanced React + Vite + Supabase)
│   ├── Multi-subject management
│   ├── Multi-grade content organization
│   └── Landing page content editor
│
├── Student App (Flutter - Dynamic Singleton)
│   ├── Parses subdomain to determine app_id
│   ├── Loads subject/grade-specific content
│   └── Same codebase, different data per subdomain
│
└── Database (Supabase - Multi-Tenant Architecture)
    └── All existing tables + multi-tenancy columns
```

---

## Part 1: Database Architecture Transformation

### 1.1 New Core Tables

#### Table: `subjects`
**Purpose:** Define available subjects (Math, English, Science, etc.)

```sql
CREATE TABLE subjects (
  subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Mathematics', 'English Language Arts'
  slug TEXT UNIQUE NOT NULL,             -- 'math', 'english' (for URLs)
  description TEXT,
  icon_url TEXT,
  color_hex TEXT,                        -- '#3B82F6' for branding
  display_order INTEGER DEFAULT 999,
  status TEXT CHECK (status IN ('active', 'coming_soon', 'beta', 'archived')) DEFAULT 'coming_soon',
  launch_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subjects_status ON subjects(status);
CREATE INDEX idx_subjects_display_order ON subjects(display_order);

-- Sample Data
INSERT INTO subjects (name, slug, color_hex, status, display_order) VALUES
  ('Mathematics', 'math', '#3B82F6', 'active', 1),
  ('English Language Arts', 'english', '#14B8A6', 'coming_soon', 2),
  ('Science', 'science', '#F97316', 'coming_soon', 3);
```

#### Table: `apps` (formerly implicit in Math7)
**Purpose:** Define each grade-level application (e.g., Math 7th Grade, English 9th Grade)

```sql
CREATE TABLE apps (
  app_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(subject_id) ON DELETE CASCADE,
  
  -- Grade Information
  grade_level TEXT NOT NULL,             -- 'Kindergarten', '1st Grade', '7th Grade'
  grade_number INTEGER,                  -- 0, 1, 7 (for sorting, NULL for non-numeric)
  
  -- URL Configuration
  subdomain TEXT UNIQUE NOT NULL,        -- 'm7', 'e9', 'mk' (math kindergarten)
  full_domain TEXT GENERATED ALWAYS AS (subdomain || '.questerix.com') STORED,
  
  -- Metadata
  display_name TEXT NOT NULL,            -- 'Math 7th Grade', 'English 9th Grade'
  is_active BOOLEAN DEFAULT false,
  launch_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(subject_id, grade_number)
);

-- Indexes
CREATE INDEX idx_apps_subject ON apps(subject_id);
CREATE INDEX idx_apps_subdomain ON apps(subdomain);
CREATE INDEX idx_apps_active ON apps(is_active);

-- Sample Data (Migration from Math7)
INSERT INTO apps (subject_id, grade_level, grade_number, subdomain, display_name, is_active) VALUES
  (
    (SELECT subject_id FROM subjects WHERE slug = 'math'),
    '7th Grade',
    7,
    'm7',
    'Math 7th Grade',
    true  -- This is your existing Math7 app
  );
```

#### Table: `app_landing_pages`
**Purpose:** Store SEO-optimized landing page content for each app

```sql
CREATE TABLE app_landing_pages (
  landing_page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(app_id) ON DELETE CASCADE UNIQUE,
  
  -- SEO Fields
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  canonical_url TEXT,
  og_image_url TEXT,
  
  -- Hero Section
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT,
  hero_cta_text TEXT DEFAULT 'Start Learning',
  hero_image_url TEXT,
  
  -- Content Sections (JSON for flexibility)
  syllabus_json JSONB,                   -- { "topics": [...], "skills": [...] }
  benefits_json JSONB,                   -- [{ "icon": "...", "title": "...", "text": "..." }]
  testimonials_json JSONB,               -- [{ "name": "...", "role": "...", "quote": "...", "rating": 5 }]
  
  -- Pricing (optional for now)
  pricing_json JSONB,
  
  -- Schema.org Structured Data
  schema_org_json JSONB,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sample Data (Migrated from Math7)
INSERT INTO app_landing_pages (app_id, meta_title, meta_description, hero_headline, hero_subheadline) VALUES
  (
    (SELECT app_id FROM apps WHERE subdomain = 'm7'),
    '7th Grade Math Practice | Questerix',
    'Master 7th grade mathematics with personalized practice. Algebra, geometry, statistics, and more.',
    'Ace 7th Grade Math',
    'Master algebra, geometry, and statistics with adaptive practice'
  );
```

### 1.2 Migration of Existing Tables

#### Current `domains` Table → Multi-Tenant
```sql
-- BEFORE (Math7 only)
CREATE TABLE domains (
  domain_id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  order_index INTEGER
);

-- AFTER (Multi-tenant)
ALTER TABLE domains ADD COLUMN app_id UUID REFERENCES apps(app_id);
ALTER TABLE domains ADD CONSTRAINT domains_app_id_not_null CHECK (app_id IS NOT NULL);
CREATE INDEX idx_domains_app ON domains(app_id);

-- Migration: Assign existing Math7 domains to m7 app
UPDATE domains 
SET app_id = (SELECT app_id FROM apps WHERE subdomain = 'm7')
WHERE app_id IS NULL;
```

#### Current `skills` Table → Multi-Tenant
```sql
-- AFTER
ALTER TABLE skills ADD COLUMN app_id UUID REFERENCES apps(app_id);
CREATE INDEX idx_skills_app ON skills(app_id);

-- Migration
UPDATE skills 
SET app_id = (SELECT app_id FROM apps WHERE subdomain = 'm7')
WHERE app_id IS NULL;
```

#### Current `questions` Table → Multi-Tenant
```sql
-- AFTER
ALTER TABLE questions ADD COLUMN app_id UUID REFERENCES apps(app_id);
CREATE INDEX idx_questions_app ON questions(app_id);

-- Migration
UPDATE questions 
SET app_id = (SELECT app_id FROM apps WHERE subdomain = 'm7')
WHERE app_id IS NULL;
```

### 1.3 User Access Control

#### Table: `user_subscriptions`
**Purpose:** Track which apps each user has access to

```sql
CREATE TABLE user_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(app_id) ON DELETE CASCADE,
  
  -- Access Control
  access_level TEXT CHECK (access_level IN ('trial', 'full', 'expired')) DEFAULT 'trial',
  expires_at TIMESTAMPTZ,
  
  -- Tracking
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ,
  
  UNIQUE(user_id, app_id)
);

CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_app ON user_subscriptions(app_id);
```

### 1.4 Row-Level Security (RLS) Policies

#### Critical: Prevent Cross-App Data Leakage

```sql
-- Enable RLS on all content tables
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy: Students only see content from apps they're subscribed to
CREATE POLICY "students_see_subscribed_apps_domains"
ON domains FOR SELECT
USING (
  app_id IN (
    SELECT app_id 
    FROM user_subscriptions 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Repeat for skills and questions
CREATE POLICY "students_see_subscribed_apps_skills"
ON skills FOR SELECT
USING (
  app_id IN (
    SELECT app_id FROM user_subscriptions 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "students_see_subscribed_apps_questions"
ON questions FOR SELECT
USING (
  app_id IN (
    SELECT app_id FROM user_subscriptions 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Policy: Admins see all content
CREATE POLICY "admins_see_all_domains"
ON domains FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
```

---

## Part 2: Application Architecture Changes

### 2.1 NEW App: Landing Pages (React + Vite)

#### 2.1.1 Project Structure
```
landing-pages/
├── src/
│   ├── pages/
│   │   ├── RootPage.tsx              # questerix.com
│   │   ├── SubjectHubPage.tsx        # math.questerix.com
│   │   └── GradeLandingPage.tsx      # m7.questerix.com
│   ├── components/
│   │   ├── SubjectCard.tsx
│   │   ├── GradeButton.tsx
│   │   ├── TestimonialCard.tsx
│   │   └── SeeMoreSubjects.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── seo-utils.ts
│   └── App.tsx
├── public/
│   └── _redirects                    # Cloudflare Pages routing
├── package.json
└── vite.config.ts
```

#### 2.1.2 Routing Strategy
```javascript
// Cloudflare Pages _redirects file
# Root domain
questerix.com/*  /root-page  200

# Subject hubs
math.questerix.com/*  /subject-hub?subject=math  200
english.questerix.com/*  /subject-hub?subject=english  200

# Grade-specific landings (before Flutter)
m7.questerix.com/  /grade-landing?subdomain=m7  200
e9.questerix.com/  /grade-landing?subdomain=e9  200

# Flutter app routes
*.questerix.com/app/*  /flutter-app  200
```

#### 2.1.3 Static Site Generation Strategy
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-landing-pages',
      async buildStart() {
        // At build time, fetch all apps from Supabase
        const { data: apps } = await supabase
          .from('apps')
          .select('*, subjects(*), app_landing_pages(*)')
          .eq('is_active', true);
        
        // Pre-render each landing page as static HTML
        for (const app of apps) {
          await renderToStaticMarkup(<GradeLandingPage app={app} />);
        }
      }
    }
  ]
});
```

### 2.2 MODIFIED App: Admin Panel

#### 2.2.1 New Features Required

**New Navigation Structure:**
```typescript
// Current Admin Panel Navigation
- Dashboard
- Domains
- Skills  
- Questions
- Import/Export

// NEW Admin Panel Navigation
- Dashboard (now app-aware)
- 🆕 App Manager
  - Subjects
  - Grade Levels
  - Landing Pages
- Content (context-aware)
  - Domains (filtered by selected app)
  - Skills (filtered by selected app)
  - Questions (filtered by selected app)
- Import/Export (now requires app selection)
- Settings
```

**App Context Provider:**
```typescript
// src/contexts/AppContext.tsx
interface AppContextType {
  currentApp: App | null;
  setCurrentApp: (app: App) => void;
  availableApps: App[];
}

// Wrap entire admin panel
<AppProvider>
  <AdminPanelRoutes />
</AppProvider>

// Usage in components
const { currentApp } = useAppContext();

// All queries now filter by app_id
const { data: domains } = useQuery({
  queryKey: ['domains', currentApp?.app_id],
  queryFn: () => supabase
    .from('domains')
    .select('*')
    .eq('app_id', currentApp.app_id)
});
```

#### 2.2.2 New Admin Pages

**Page: App Manager**
```typescript
// src/features/apps/pages/AppManagerPage.tsx
function AppManagerPage() {
  return (
    <Tabs defaultValue="subjects">
      <TabsList>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
        <TabsTrigger value="grades">Grade Levels</TabsTrigger>
        <TabsTrigger value="landings">Landing Pages</TabsTrigger>
      </TabsList>
      
      <TabsContent value="subjects">
        <SubjectsManager />
      </TabsContent>
      
      <TabsContent value="grades">
        <GradeAppsManager />
      </TabsContent>
      
      <TabsContent value="landings">
        <LandingPageEditor />
      </TabsContent>
    </Tabs>
  );
}
```

**Component: Landing Page Editor**
```typescript
// Rich text editor for landing page content
function LandingPageEditor({ app }: { app: App }) {
  const [content, setContent] = useState<LandingPageContent>();
  
  return (
    <Form>
      <Input label="Meta Title" {...register('meta_title')} />
      <Textarea label="Meta Description" {...register('meta_description')} />
      <Input label="Hero Headline" {...register('hero_headline')} />
      <RichTextEditor label="Hero Subheadline" {...register('hero_subheadline')} />
      
      {/* Syllabus Builder */}
      <SyllabusBuilder topics={content.syllabus_json} onChange={...} />
      
      {/* Benefits Builder */}
      <BenefitsBuilder benefits={content.benefits_json} onChange={...} />
      
      {/* Preview & Publish */}
      <Button onClick={preview}>Preview Landing Page</Button>
      <Button onClick={publish}>Publish Changes</Button>
    </Form>
  );
}
```

#### 2.2.3 Modified Existing Features

**Domains Manager:**
```typescript
// BEFORE (Math7)
function DomainsPage() {
  const { data: domains } = supabase.from('domains').select('*');
  return <DomainList domains={domains} />;
}

// AFTER (Multi-tenant)
function DomainsPage() {
  const { currentApp } = useAppContext();
  
  if (!currentApp) {
    return <SelectAppPrompt />;
  }
  
  const { data: domains } = supabase
    .from('domains')
    .select('*')
    .eq('app_id', currentApp.app_id);
    
  return <DomainList domains={domains} app={currentApp} />;
}
```

**Questions Manager:**
```typescript
// Every insert/update must include app_id
function createQuestion(questionData) {
  const { currentApp } = useAppContext();
  
  return supabase.from('questions').insert({
    ...questionData,
    app_id: currentApp.app_id  // CRITICAL: Multi-tenancy
  });
}
```

### 2.3 MODIFIED App: Student Flutter App

#### 2.3.1 Subdomain Detection

**File: `lib/main.dart`**
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Detect subdomain from URL
  final appConfig = await AppConfigService.detectFromUrl();
  
  // 2. Set app context globally
  await AppContext.initialize(appConfig);
  
  // 3. Run app with context
  runApp(QuesterixApp(config: appConfig));
}
```

**File: `lib/core/services/app_config_service.dart`**
```dart
class AppConfigService {
  static Future<AppConfig> detectFromUrl() async {
    // Web: window.location.hostname
    // Mobile: Could be injected via deep link or build flavor
    
    if (kIsWeb) {
      final hostname = html.window.location.hostname;
      // Parse: m7.questerix.com → subdomain = 'm7'
      final subdomain = hostname.split('.').first;
      
      // Fetch app config from Supabase
      final response = await supabase
        .from('apps')
        .select('*, subjects(*)')
        .eq('subdomain', subdomain)
        .single();
      
      return AppConfig.fromJson(response.data);
    } else {
      // Mobile: Read from build config or deep link
      return AppConfig.fromBuildFlavor();
    }
  }
}

class AppConfig {
  final String appId;
  final String subject;
  final String gradeLevel;
  final String brandColor;
  
  AppConfig({
    required this.appId,
    required this.subject,
    required this.gradeLevel,
    required this.brandColor,
  });
}
```

#### 2.3.2 Repository Changes

**All repositories must filter by app_id:**

```dart
// BEFORE (Math7)
class DriftDomainRepository implements DomainRepository {
  Future<List<Domain>> getAll() async {
    return await (db.select(db.domains)..orderBy(...)).get();
  }
}

// AFTER (Multi-tenant)
class DriftDomainRepository implements DomainRepository {
  final String appId;  // Injected via DI
  
  DriftDomainRepository({required this.appId});
  
  Future<List<Domain>> getAll() async {
    return await (db.select(db.domains)
      ..where((tbl) => tbl.appId.equals(appId))
      ..orderBy(...)).get();
  }
}
```

**Supabase repositories:**
```dart
class SupabaseDomainRepository implements DomainRepository {
  final String appId;
  
  Future<List<Domain>> getAll() async {
    final response = await supabase
      .from('domains')
      .select()
      .eq('app_id', appId);  // CRITICAL FILTER
    
    return response.map((json) => Domain.fromJson(json)).toList();
  }
}
```

#### 2.3.3 Theming Based on Subject

```dart
// lib/core/theme/app_theme.dart
class AppTheme {
  static ThemeData getTheme(AppConfig config) {
    final primaryColor = Color(
      int.parse(config.brandColor.replaceFirst('#', '0xFF'))
    );
    
    return ThemeData(
      primaryColor: primaryColor,
      // Math = Blue, English = Teal, Science = Orange
      colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
      // ... rest of theme
    );
  }
}

// In main.dart
MaterialApp(
  theme: AppTheme.getTheme(appConfig),
  // ...
);
```

---

## Part 3: Infrastructure & Deployment

### 3.1 Cloudflare Configuration

#### DNS Setup
```
# Cloudflare DNS Manager
Type    Name        Value                      Proxy
CNAME   @           landing-pages.pages.dev    ✓ Proxied
CNAME   *           landing-pages.pages.dev    ✓ Proxied (wildcard)
```

#### Cloudflare Pages Projects
```
Project 1: questerix-landing-pages
- Framework: Vite
- Build command: npm run build
- Output directory: dist
- Custom domains: questerix.com, *.questerix.com

Project 2: questerix-flutter-student
- Framework: Flutter Web
- Build command: flutter build web --release
- Output directory: build/web
- Routes: *.questerix.com/app/*
```

#### Cloudflare Worker (Optional Enhancement)
```javascript
// Handles advanced routing logic
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const path = url.pathname;
    
    // Parse subdomain
    const subdomain = hostname.split('.')[0];
    
    // Route: /app/* → Flutter
    if (path.startsWith('/app')) {
      return env.FLUTTER_APP.fetch(request);
    }
    
    // Route: / → Landing page
    return env.LANDING_APP.fetch(request);
  }
};
```

### 3.2 CI/CD Pipeline

#### GitHub Actions: Landing Pages
```yaml
# .github/workflows/deploy-landing-pages.yml
name: Deploy Landing Pages
on:
  push:
    branches: [main]
    paths: ['landing-pages/**']
  
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      # Install dependencies
      - run: npm ci
        working-directory: landing-pages
      
      # Build static pages (fetches data from Supabase)
      - run: npm run build
        working-directory: landing-pages
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      # Deploy to Cloudflare Pages
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: questerix-landing-pages
          directory: landing-pages/dist
```

#### Webhook: Trigger Rebuild on Content Change
```sql
-- Supabase Database Webhook
CREATE OR REPLACE FUNCTION trigger_landing_rebuild()
RETURNS trigger AS $$
BEGIN
  -- Call GitHub API to trigger rebuild
  PERFORM http_post(
    'https://api.github.com/repos/yourorg/questerix/dispatches',
    json_build_object(
      'event_type', 'rebuild_landing_pages',
      'client_payload', json_build_object('app_id', NEW.app_id)
    ),
    'application/json',
    ARRAY[http_header('Authorization', 'Bearer ' || current_setting('app.github_token'))]
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on landing page updates
CREATE TRIGGER on_landing_page_update
AFTER UPDATE ON app_landing_pages
FOR EACH ROW
EXECUTE FUNCTION trigger_landing_rebuild();
```

---

## Part 4: Migration Execution Plan

### Phase 0: Preparation (Week 1)
**Objective:** Setup infrastructure without breaking Math7

- [ ] Create `subjects`, `apps`, `app_landing_pages` tables
- [ ] Insert Math7 as first subject/app in new tables
- [ ] Test RLS policies in staging environment
- [ ] Create new GitHub repo: `questerix-landing-pages`
- [ ] Setup Cloudflare Pages project
- [ ] Configure wildcard DNS (pointing to nowhere yet)

**Risks:** None (new tables don't affect existing app)

### Phase 1: Database Migration (Week 2)
**Objective:** Add multi-tenancy to existing tables

- [ ] Add `app_id` columns to `domains`, `skills`, `questions`
- [ ] Backfill `app_id` for existing Math7 data
- [ ] Deploy RLS policies (test with admin & student accounts)
- [ ] Verify Math7 still works (should be unaffected)
- [ ] Create database backup before migration

**Risks:** 
- RLS policies could lock out users if misconfigured
- **Mitigation:** Deploy to staging first, test all user roles

### Phase 2: Admin Panel Enhancement (Week 3-4)
**Objective:** Add multi-app management to admin panel

- [ ] Create App Context Provider
- [ ] Build App Manager pages (Subjects, Grades, Landing Editor)
- [ ] Modify existing pages (Domains, Skills, Questions) to be app-aware
- [ ] Add app selector in navigation
- [ ] Test CRUD operations with multiple apps

**Risks:**
- Breaking existing admin workflows
- **Mitigation:** Feature flag the new UI, allow admins to toggle

### Phase 3: Landing Pages App (Week 5-6)
**Objective:** Build and deploy SSG landing pages

- [ ] Build root page (questerix.com)
- [ ] Build subject hub page (math.questerix.com)
- [ ] Build grade landing page (m7.questerix.com)
- [ ] Implement SSG build script
- [ ] Deploy to Cloudflare Pages
- [ ] Test on staging subdomain first

**Deliverable:** `landing.questerix.com` working for Math7

### Phase 4: Flutter App Adaptation (Week 7-8)
**Objective:** Make Flutter app multi-tenant aware

- [ ] Implement subdomain detection
- [ ] Inject app_id into all repositories
- [ ] Add app-specific theming
- [ ] Test on `m7-staging.questerix.com`
- [ ] Verify offline sync still works with app isolation

**Risks:**
- Breaking existing Math7 student experience
- **Mitigation:** Deploy as `m7.questerix.com` (new subdomain) first, keep old domain working

### Phase 5: Production Cutover (Week 9)
**Objective:** Migrate Math7 to new architecture

- [ ] Point `math7.com` → `m7.questerix.com` (DNS redirect)
- [ ] Monitor error logs for 48 hours
- [ ] Verify student progress data intact
- [ ] Test auth flows (login, signup, onboarding)

**Rollback Plan:** Change DNS back to old infrastructure

### Phase 6: Add Second Subject (Week 10+)
**Objective:** Prove multi-tenancy works

- [ ] Create English subject in admin panel
- [ ] Add English 7th Grade app
- [ ] Create landing page content
- [ ] Deploy `e7.questerix.com`
- [ ] Test cross-subject isolation (Math7 student can't access English7 data)

**Success Metric:** Student enrolls in both Math7 and English7 with single account

---

## Part 5: Risk Assessment & Mitigation

### Critical Risks

#### Risk 1: Data Isolation Breach
**Scenario:** Student subscribed to Math7 queries English7 questions

**Impact:** CRITICAL - Privacy violation, competitive compromise

**Mitigation:**
- RLS policies at database level (defense in depth)
- Integration tests that attempt cross-app queries
- Audit log all data access with app_id verification

#### Risk 2: Migration Data Loss
**Scenario:** Backfilling `app_id` fails, orphans existing data

**Impact:** HIGH - Existing students lose progress

**Mitigation:**
- Full database backup before migration
- Test migration on staging database first
- Verify row count before/after migration
- Keep old schema for 30 days (soft delete pattern)

#### Risk 3: Student Experience Degradation
**Scenario:** Multi-tenant queries slow down Flutter app

**Impact:** MEDIUM - Student churn

**Mitigation:**
- Database indexes on app_id columns
- Query performance benchmarks (before/after)
- Caching layer for subject/app metadata

#### Risk 4: Admin Complexity Overload
**Scenario:** Admins confused by multi-app interface

**Impact:** MEDIUM - Operational inefficiency

**Mitigation:**
- Onboarding guide for admins
- Default to "current app" context (don't force selection every time)
- Clear visual indicators (banner showing "Editing: Math 7th Grade")

#### Risk 5: SEO Cannibalization
**Scenario:** `m7.questerix.com` and `math.questerix.com` compete for same keywords

**Impact:** LOW-MEDIUM - Search ranking dilution

**Mitigation:**
- Strict canonical tags
- Different keyword targeting (broad vs specific)
- Internal linking hierarchy

---

## Part 6: Success Metrics

### Technical Metrics
- [ ] Database migration completes with 0 data loss
- [ ] All RLS policies pass penetration testing
- [ ] Landing pages load in <1 second (Lighthouse 90+)
- [ ] Flutter app bundles remain under 3MB
- [ ] API response times <200ms for multi-tenant queries

### Business Metrics
- [ ] Launch 2nd subject within 2 weeks of cutover
- [ ] Single user successfully enrolls in 2+ subjects
- [ ] Landing pages rank for target keywords within 30 days
- [ ] Admin can create new subject in <1 hour
- [ ] Zero student-reported data leakage incidents

### User Experience Metrics
- [ ] Student NPS score remains stable post-migration
- [ ] Admin reports multi-app management is "easy"
- [ ] Landing page conversion rate >5%
- [ ] Mobile/desktop parity (Flutter renders correctly on all platforms)

---

## Part 7: Rollback Strategy

### If Migration Fails

#### Immediate Rollback (< 1 hour)
```bash
# DNS rollback
# Point math7.com back to old infrastructure
# Restore database from backup
supabase db reset --db-url $OLD_DATABASE_URL

# Revert Cloudflare DNS
# Remove wildcard CNAME
```

#### Data Recovery (< 24 hours)
```sql
-- If data was partially migrated, restore from backup
-- Supabase Point-in-Time Recovery
SELECT * FROM _supabase_backups 
WHERE created_at > '2026-02-01 09:00:00';
```

---

## Part 8: Long-Term Maintenance

### Adding a New Subject
1. Admin creates subject in Admin Panel
2. Admin creates grade-level apps (e.g., English 7, 8, 9)
3. Admin writes landing page content
4. Admin clicks "Publish" → triggers GitHub webhook
5. Landing pages rebuild with new subject
6. New subdomain goes live (e.g., `e7.questerix.com`)

**Time to launch new subject:** ~2 hours of content writing, 5 minutes of deployment

### Sunsetting a Subject
```sql
-- Soft delete (preserves student progress)
UPDATE apps 
SET is_active = false, status = 'archived'
WHERE subject_id = 'uuid-of-subject';

-- Landing page automatically hides subject
-- Existing students keep access to content
-- No new enrollments allowed
```

---

## Part 9: Team Responsibilities

### Chief Architect (You)
- [ ] Approve database schema changes
- [ ] Define multi-tenancy rules
- [ ] Review security policies (RLS)
- [ ] Final approval on migration execution

### Lead Engineering Crew (Antigravity AI)
- [ ] Implement database migrations
- [ ] Build landing pages app
- [ ] Enhance admin panel
- [ ] Adapt Flutter student app
- [ ] Write migration scripts
- [ ] Create rollback procedures

### Required Decisions from You
1. **Phase 0:** Approve new schema design
2. **Phase 1:** Approve RLS policies
3. **Phase 3:** Approve landing page designs
4. **Phase 5:** Approve production cutover date
5. **Phase 6:** Choose second subject to launch

---

## Part 10: Open Questions

### Infrastructure
- [ ] **Q1:** Cloudflare Pages free tier OK? (Unlimited bandwidth, but 500 builds/month)
- [ ] **Q2:** Need CDN for Flutter assets? (Could use Cloudflare R2)
- [ ] **Q3:** Monitoring/observability? (Sentry for errors, PostHog for analytics?)

### Business Logic
- [ ] **Q4:** Can students transfer between apps? (Math 6 → Math 7)
- [ ] **Q5:** Do admins belong to specific subjects, or all subjects?
- [ ] **Q6:** Pricing tiers per subject, or platform-wide subscription?

### Content Strategy
- [ ] **Q7:** Will all subjects share same question format, or custom per subject?
- [ ] **Q8:** Can skills be reused across subjects? (e.g., "Problem Solving" in Math & Science)
- [ ] **Q9:** Translations/internationalization needed?

---

## Conclusion

This transformation is **massive but methodical**. The key principles:

1. **No big-bang deployment** - Phased rollout over 10 weeks
2. **Math7 stays stable** - Existing students unaffected until cutover
3. **Database-first** - Schema changes enable all other changes
4. **Defense in depth** - RLS policies + app-level filtering
5. **Rollback ready** - Every phase has a back-out plan

**Next Step:** You review this plan, identify gaps, and we refine before touching a single line of code.

**Estimated Timeline:** 10-12 weeks from first code to production-ready multi-tenant platform.

**Point of No Return:** Phase 5 (Production Cutover). Until then, all changes are reversible.

## Part 11: Recent Documentation Updates (February 2026)

### New Documentation
- **RPC API Documentation:** [Docs](../docs/api/RPC_DOCUMENTATION.md) - Complete
- **Accessibility Implementation Plan:** [Docs](../docs/architecture/ACCESSIBILITY_PLAN.md) - Plan Ready
