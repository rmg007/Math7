# Questerix Development Tasks

## Admin Section QA Audit Fixes (2026-02-12)

- [x] **P0: Rename "INITIATE SIGNATURE" → "GENERATE CODE"** on InvitationCodesPage
- [x] **P0: Rename "EXTRACT" → "COPY" and "VERIFIED" → "COPIED"** on invitation code copy button
- [x] **P0: Clarify generator subtitle** from jargon to plain language
- [x] **P1: Add empty state CTA** on UserManagementPage linking to invitation codes
- [x] **P1: Clarify settings scope** — updated description to say "personal profile"
- [ ] **P2: Broader terminology pass** across all admin pages (deferred)
- [ ] **P3: Platform Settings page** — separate from Account Settings (deferred, feature request)

## 🚨 CRITICAL SECURITY AUDIT REMEDIATION (2026-02-12)

### Phase 1: Critical Secret Exposure (CRITICAL)

- [x] **CRITICAL: Remove service role key from client bundle**
  - Deleted conditional `VITE_SUPABASE_SERVICE_ROLE_KEY` usage in `supabase.ts`
  - Removed all `supabaseAdmin` conditional client patterns in `use-domains.ts`
  - Service role key now only exists server-side in Edge Functions
- [x] **CRITICAL: Remove Gemini API key from client bundle**
  - Deleted entire `admin-panel/src/lib/gemini.ts` file
  - Rewired `use-ai-generator.ts` to use secure `generate-questions` Edge Function
  - Added Zod schema validation for all AI responses

### Phase 2: Auth & RLS Hardening (HIGH)

- [x] **HIGH: AuthGuard fail-closed**
  - Changed profile fetch error from warning + access to redirect to login
  - Prevents unauthorized access on profile errors
- [x] **HIGH: Remove client-side role assignment**
  - Removed `role: 'admin'` from registration payload in `LoginPage.tsx`
  - Roles now assigned server-side via database triggers/RPCs
- [x] **HIGH: Session revocation on user deactivation**
  - Created new Edge Function `revoke-user-sessions` for admin session termination
  - Updated `UserManagementPage.tsx` to call Edge Function after deactivation
  - Ensures deactivated users lose all active sessions immediately
- [x] **HIGH: Add defense-in-depth app_id scoping**
  - Added `app_id` filtering to all mutations in `use-questions.ts` and `use-skills.ts`
  - Fixed `useUpdateQuestionOrder` and `useUpdateSkillOrder` tenant scoping
  - Prevents cross-tenant data modification even if RLS fails
- [x] **HIGH: Fix dashboard meta query inconsistency**
  - Changed curriculum_meta query from `.eq('id', 'singleton')` to `.eq('app_id', currentApp.app_id)`
  - Ensures proper tenant isolation for metadata
- [x] **HIGH: Escape search wildcards**
  - Created `postgrest-utils.ts` with `escapePostgrestSearch()` function
  - Updated all search queries in `use-domains.ts`, `use-questions.ts`, `use-skills.ts`
  - Prevents SQL injection via PostgREST ilike patterns

### Phase 3: Stability & Correctness (MEDIUM)

- [x] **MEDIUM: AI response Zod validation**
  - Added comprehensive schema validation in `use-ai-generator.ts`
  - Prevents malformed AI responses from crashing the UI
- [x] **MEDIUM: Token consumption error surfacing**
  - Modified `governedGeneration.ts` to return `quotaError` in response
  - UI can now display quota exhaustion errors to users
- [x] **MEDIUM: Add error boundary to router**
  - Wrapped `BrowserRouter` in `App.tsx` with existing `ErrorBoundary`
  - Catches and displays React errors gracefully
- [x] **MEDIUM: Filter auth state change events**
  - Updated `AppContext.tsx` to only react to `SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`
  - Prevents unnecessary `loadApps` calls on token refresh
- [x] **MEDIUM: Bundle PDF.js worker locally**
  - Changed worker URLs from CDN to `/pdfjs/pdf.worker.min.js`
  - Eliminates external dependency for PDF parsing
- [x] **MEDIUM: Remove duplicate monitoring APIs**
  - Deleted stub `monitoring.ts` file
  - Updated imports to use `error-tracker.ts` consistently
- [x] **MEDIUM: Disable non-existent Edge Function call**
  - Commented out `parse-import-prompt` call in `BulkImportPage.tsx`
  - Added "Coming Soon" message for AI import feature
- [x] **MEDIUM: Disable incomplete question type editors**
  - Limited `QUESTION_TYPES` to `['multiple_choice', 'text_input']`
  - Added warning for unsupported types (`mcq_multi`, `boolean`, `reorder_steps`)
  - Disabled editing for questions with unsupported types

### False Positives (Rejected with Evidence)

- [x] **REJECTED: JSON.parse crash** — Already using `safeJson` helper with try/catch
- [x] **REJECTED: AppContext unhandled promise** — `.then()` already has error handler

### Manual Post-Merge Actions Required

⚠️ **ACTION REQUIRED**: Remove secrets from environment settings

- Remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from all environments
- Remove `VITE_GEMINI_API_KEY` from all environments
- These keys should only exist as server-side environment variables for Edge Functions

### Technical Debt Created

- [ ] Copy PDF.js worker to `public/pdfjs/` in build process
- [ ] Implement full editors for `mcq_multi`, `boolean`, `reorder_steps` question types
- [ ] Implement `parse-import-prompt` Edge Function for AI import feature

---

## 📋 QA AUDIT REMEDIATION — Domains, Subjects & Questions (2026-02-12)

### Implemented Fixes

- [x] **HIGH: Cascade delete impact warning** in `domain-list.tsx`
  - Delete confirmation now queries and displays dependent skill/question counts
  - Prevents silent data loss from `ON DELETE CASCADE` on skills and questions
- [x] **HIGH: KaTeX math rendering** in `rich-text-editor.tsx`
  - Replaced stub `insertMath` with proper KaTeX `renderToString` integration
  - Added live preview panel for LaTeX expressions
  - Added LaTeX template shortcuts (x², fractions, sqrt, sum, integral, limit)
  - Kept existing Unicode symbol picker intact
- [x] **LOW: Fix misleading label** in `SubjectsPage.tsx`
  - Changed "Domain Name" → "Subject Name" (subjects ≠ domains in the data model)
  - This label caused the QA auditor to misreport a relational integrity bug

### Rejected Findings (with evidence)

- [x] **REJECTED: "Subject-to-Domain relational integrity"** — Misdiagnosed. Subjects (Section 4, platform-level) and Domains (Section 5, curriculum-level) are architecturally separate. Hierarchy: Subject → App → Domain → Skill → Question. The confusing label caused the misdiagnosis.
- [x] **REJECTED: "Filter Subjects by Domain"** — Wrong relationship. Subjects aren't children of domains. Skills ARE children of domains, and `use-skills.ts` already supports `domainId` filtering.

### Discovered (pre-existing, not in scope)

- [ ] **TYPE DRIFT: SubjectsPage.tsx** — Supabase-generated types use `id` but code references `subject_id`, `color_hex`, `slug`, `icon_url`, `display_order`. Needs `database.types.ts` regeneration or schema alignment.
- [ ] **TYPE DRIFT: domain-list.tsx** — Similar issue: code uses `domain_id` but generated types have `id`. Widespread across curriculum components.

---

## �🛡️ AUDIT REMEDIATION ROUND 2 (2026-02-12)

### Critical & High Priority Fixes

- [x] **HIGH: Fix registration race condition** in `LoginPage.tsx`
  - Created atomic `validate_and_use_invitation_code` SQL function
  - Replaced 3-step flow with 2-step flow to eliminate race window
  - Standardized SecurityLogger calls to fire-and-forget with `.catch()`
- [x] **HIGH: Fix loadApps race condition** in `AppContext.tsx`
  - Added `useRef(false)` guard to prevent concurrent calls
  - Added `mounted` flag in `useEffect` to prevent unmount state updates
- [x] **HIGH: Fix MCQ correct-answer validation** in `import-schema.ts`
  - Added `.refine()` to `MultipleChoiceSchema` and `McqMultiSchema`
  - Enforces at least one correct option in all MCQ questions

### Medium Priority Fixes

- [x] **MEDIUM: localStorage error handling** in `AppContext.tsx`
  - Wrapped `localStorage.setItem` calls in try/catch (writes only)
  - Reads already had proper error handling
- [x] **MEDIUM: Profile update error handling** in `AppContext.tsx`
  - Added try/catch around profile update in `handleSetCurrentApp`

### Findings Rejected or Downgraded

- [x] **FALSE POSITIVE: Case sensitivity mismatch** — SQL already uses `upper()`
- [x] **LOW: Inconsistent SecurityLogger await** — Standardized to fire-and-forget (already designed to fail silently)
- [x] **LOW/N/A: 8 other findings** — Already mitigated, cosmetic, or per-convention patterns

### Summary

- **Fixed**: 6 verified issues across 4 files + 1 new SQL migration
- **Rejected**: 1 false positive, 4 downgraded to LOW/N/A
- **Files modified**: `import-schema.ts`, `LoginPage.tsx`, `AppContext.tsx`, `supabase/migrations/20260212083100_validate_and_use_invitation_code.sql`
- **Documentation**: Updated `docs/LEARNING_LOG.md` with lessons learned

---

## 🛡️ AUDIT REMEDIATION (2026-02-12)

### Critical Security & Stability Fixes

- [x] **CRITICAL: Remove hard-coded secrets** from `scripts/inspect_rpc.js`
  - Removed fallback password and project ref
  - Fail explicitly when env vars missing
  - Removed `rejectUnauthorized: false` SSL bypass
- [x] **HIGH: Add subprocess timeout** to `ops_runner.py`
  - Added 5-minute timeout to `subprocess.run()`
  - Added `TimeoutExpired` exception handling
- [x] **HIGH: Add retry logic** to `question_generator.py`
  - Added tenacity-based exponential backoff (3 retries)
  - Added 50KB response size guard before JSON parsing
  - Updated requirements.txt with tenacity>=8.2.0
- [x] **BUG: Fix prompt comment leakage** in `question_generator.py`
  - Extract text truncation before f-string to avoid comment leakage

### Medium Priority Hardening

- [x] **Redesign options schema** in `question_schema.py`
  - Eliminated confusing nested `options.options` structure
  - Added proper null handling and initialization for different question types
- [x] **Add migration tracking** to `apply-migrations.py`
  - Created `schema_migrations` table with filename + checksum
  - Skip already-applied migrations to prevent re-execution
- [x] **Sanitize custom_instructions** in `question_generator.py`
  - 500-character limit
  - Remove control characters and dangerous prompt injection patterns

### Low Priority Cleanup

- [x] **Add useEffect cleanup** to `admin-panel/src/App.tsx`
  - Added AbortController to prevent stale state updates
- [x] **Add error handling** to `document_parser.py`
  - Graceful handling of missing files in `get_metadata()`
  - Return default metadata with `exists: false` flag

---

## 🛡️ TEST COVERAGE RECOVERY PLAN

### 🏗️ Phase 1: Unblock CI (Config + Edge Function Fixes)

- [x] **Step 1.1: Standardize Vitest Thresholds**
  - Remove coverage thresholds from `admin-panel/vitest.config.ts`.
  - Rely on CI gate (70%) as the single source of truth.
- [x] **Step 1.2: Content Engine Local Stability**
  - Add `pytest>=7.0.0` and `pytest-cov>=4.0.0` to `content-engine/requirements.txt`.
- [x] **Step 1.3: Fix Edge Function Tests**
  - Refactor `supabase/functions/*/index.ts` to use handlers.
  - Guard `Deno.serve` calls with `import.meta.main`.
- [x] **Step 1.4: Verification Checkpoint**
  - [x] Verify Admin Panel coverage generates `lcov.info`.
  - [x] Verify Content Engine hits 80% locally.
  - [x] Verify Edge Functions run without a local server.

### 🧪 Phase 2: Close Coverage Gaps

- [x] **Step 2.1: Admin Panel Feature Hooks**
  - [x] Test `use-domains.ts`, `use-questions.ts`, `use-skills.ts`, `use-publish.ts`, `use-apps.ts`.
- [x] **Step 2.2: Student App Auth Providers**
  - [x] Unit tests for `auth_provider.dart` and `SessionRepository`.
- [x] **Step 2.3: Admin Panel AI API Logic**
  - [x] Test `generateQuestions.ts`, `governedGeneration.ts`, `validate-content.ts`.

### 📝 Phase 3: Documentation & Hardening

- [x] **Update Documentation**
  - [x] Mark service/hooks/content-engine tasks as DONE.
  - [x] Correct `docs/reports/TEST_COVERAGE.md` matrix.
- [x] **[SECURITY] DAST Integration**
  - Configured OWASP ZAP via `dast.yml` GitHub Action.
- [x] **[PERF] Lighthouse CI**
  - Integrated LHCI via `lighthouse.yml` and `admin-panel-e2e.yml`.

---

## 🤖 CI AUTOMATION

- [x] **Dependabot**: npm, pip, GitHub Actions, Flutter/Pub ecosystems covered.
- [x] **Auto-Format**: `auto-format.yml` for consistent code style.
- [x] **Type Generation**: `type-generation.yml` for Supabase types.
- [x] **Platform Health Report**: `platform-health-report.yml` aggregates CI results on PRs.
- [x] **Self-Healing CI (v2)**: Signature-based deduplication + auto-close on green. Monitors all 35 workflows.
- [x] **Forensic Audit Script**: `scripts/ci-failure-audit.ps1` for bulk backlog sweep.
- [x] **CI Recovery Protocol**: `scripts/ci-recover.ps1` for mass-rerunning and unblocking CI.
- [x] **Tier 1 Auto-Fix**: `ci-auto-fix.yml` — headless auto-fixer for husky, lockfile, dart patterns.
- [x] **Make It Green Button**: `ci-recover-button.yml` — one-click mass rerun from GitHub UI.
- [x] **GitHub Secrets**: Added Supabase + test user credentials to GitHub Settings.
- [x] **`gh auth login`**: Authenticate GitHub CLI for agent issue discovery and PR management.
- [ ] **CLI-First PRs**: Transition all PR lifecycle management (list, view, merge) to `gh` CLI.

## 🛠️ CI STABILIZATION & RECOVERY

- [x] **Repo Health Sweep**: Bulk-closed 71 issues, 25 PRs to clear noise.
- [x] **Fix Make It Green Button**: Now uses fresh dispatches to avoid commit-lock.
- [x] **Re-enable & Fix Workflows**:
  - [x] **Validation**: Restored archived scripts, re-enabled workflow, fixed SDK/Node versions.
  - [x] **Flutter Builds (CI)**: Fix build targets (iOS/Android) for Ubuntu. (Stabilized and tested)
  - [x] **Security (DAST/Secrets)**: Config and secret verification. (Enabled DAST)
  - [x] **Visual/Lighthouse**: Infra/Server configuration. (Enabled Lighthouse)
  - [ ] **Staging Database**: Credential check. (Waiting for STAGING_SUPABASE_URL secret)
  - [x] **Dead Code/Duplication**: Verify scan targets. (Enabled Dead Code)

- [x] **BUG #1 & #2: Domain CRUD Failure (403 Forbidden)**: Resolved via RLS policy updates and schema alignment.
- [x] **BUG #3: Error Logs Page Crash**: Resolved by creating missing error_logs table and adding RPC functions.
- [x] **BUG #4: Admin Login 500 Error**: Resolved by fixing NULL tokens in auth.users record.
- [x] **BUG #5: Dashboard 400 Errors**: Resolved by syncing column names (id -> domain_id/skill_id) in DashboardPage.tsx.
- [ ] **Form Feedback**: Add loading indicators to "Initiate Provision" and "Update Signature" buttons.
- [ ] **Feature Verification**: Verify "Template" and "Upload" buttons in Domain Registry.

---

## 🚀 DEPLOYMENT & INFRASTRUCTURE

- [x] **Cloudflare Pages**: Admin Panel and Student App are live.
- [x] **Landing Pages Deletion**: Manually deleted from Cloudflare by user.
- [x] **HARD RULE**: `landing-pages` MUST NOT be published. `orchestrator.ps1` has been locked with `$SkipLanding = $true`.
- [x] **Custom Domains**: Pointed to `admin.questerix.com` and `app.questerix.com`.

---

## 🛠️ SCHEMA RECONCILIATION & BUILD GATE RECOVERY (2026-02-13)

### Phase 1: Database Restoration (Missing Objects)

- [x] **P0: All RPC functions verified present** in QuesterixDB-v2 (2026-02-13)
  - [x] `deactivate_own_account` & `delete_own_account` (AccountSettings)
  - [x] `generate_invitation_code` & `deactivate_invitation_code` (InvitationMgmt)
  - [x] `validate_invitation_code` & `validate_and_use_invitation_code` (User Registration)
  - [x] `promote_error_to_issue` (Observability)
  - [x] `import_questions_bulk` (Curriculum Service)
  - [x] `log_error` & `log_security_event` (Error Tracking)
  - [x] `consume_tenant_tokens` & `publish_curriculum` (Platform)
- [x] **P1: Column Schema Aligned** — `database.types.ts` regenerated with all columns
  - [x] `apps`: Has both `grade_level` and `grade_number`
  - [x] `subjects`: Has `color_hex` and `icon_url`
  - [x] `group_members`: Has `nickname`
  - [x] `groups`: Has `allow_anonymous_join`

### Phase 2: Code Cleanup & Type Safety

- [x] **P1: Evaluation of Dead Features** (2026-02-14)
  - [x] `app_landing_pages`: Hook + page retained (routed in App.tsx, useful for future landing page editing)
  - [x] `CurriculumService.ts`: **Not dead** — actively used by bulk import via `import_questions_bulk` RPC
- [x] **P0: Restore Production Build Gate** (2026-02-14)
  - [x] `tsc` already active in build script: `"build": "tsc && vite build"`
  - [x] Verified: `tsc --noEmit` passes with zero errors
  - [x] Verified: `tsc && vite build` completes successfully

### Recent Fixes (2026-02-13)

- [x] **BUG: Domain Visibility Fixed** (Relaxed UUID validation regex in `isValidUUID`)
- [x] **TYPE REGEN**: Updated `database.types.ts` with full Functions/Enums/Constants from QuesterixDB-v2
- [x] **DEPLOY**: Standardized routes (removed `/platform` prefix) and deployed Admin/Student apps
- [x] **REPO CLEANUP**: Removed dead projects (landing-pages), duplicate docs, stale configs
- [x] **GITIGNORE**: Added patterns for Python caches, Wrangler, tsc dumps, landing-pages

### Test Fix Sprint (2026-02-13)

- [x] **Content Engine (2 tests fixed)**: `test_gemini_api_error` + `test_openai_api_error` — catch `RetryError` instead of raw `Exception` (tenacity wraps after 3 retries)
- [x] **Admin E2E Seed (15 tests unblocked)**: `seed-test-data.ts` auto-creates test app if none exists (was crashing with "No apps found")
- [x] **Bulk Import E2E (4 tests fixed)**: Fixed login selectors (`input[type=email]` vs `#login-email`) and post-login URL (`/` vs `/dashboard`)
- [x] **Env Credential Update**: `.env.test.local` updated to QuesterixDB-v2 URL/anon key (service role key needs manual dashboard update)
- [x] **Stale Code Removal**: Removed `VITE_GEMINI_API_KEY` from `.env.local`, `vite-env.d.ts`, and AI generator page warning
- [x] **React Performance**: Wrapped `AppContext.Provider` value in `useMemo`, handlers in `useCallback` to prevent unnecessary re-renders
- [x] **Dashboard Mock Data**: Replaced hardcoded chart data with live Supabase queries (question type distribution, curriculum stats, error counts). Activity chart remains placeholder (TODO: time-series data)
- [x] **Accessibility**: Added `aria-label` to icon-only buttons in `question-list.tsx` (Duplicate, Delete, Clear search)
- [x] **Workflow Consolidation**: Deleted duplicate `secrets.yml`, kept `gitleaks.yml` (more specific triggers + GITLEAKS_LICENSE support)

---

## 🛡️ DEPLOYMENT SAFETY & SECRET PROTECTION (2026-02-13)

### Pre-Deploy Requirements

- [ ] **P0: Run full test suite before every deployment**
  - [ ] Admin panel unit tests (`npm run test -- --coverage`)
  - [ ] Admin panel E2E tests (Playwright: chromium + firefox + webkit)
  - [ ] Flutter student app tests (`flutter test --coverage`)
  - [ ] Python content-engine tests (`pytest + coverage`)
  - [ ] Supabase SQL regression tests
  - [ ] Architecture tests (`npm run test:arch`)
  - [ ] TypeScript type check (`npx tsc --noEmit`)
  - [ ] Update `scripts/preflight.ps1` and deploy scripts to gate on test pass
- [ ] **P0: Block deployment if any tests fail** — Add gate to `orchestrator.ps1`

### Secret Protection (NEVER Leak Again)

- [x] **P0: Add local gitleaks pre-push hook** via Husky (2026-02-13)
  - `.husky/pre-push` runs gitleaks + forbidden-pattern grep
  - Blocks push if secrets found locally BEFORE they hit GitHub
- [ ] **P0: Verify GitHub secret scanning is active and enforced** (push protection)
  - ✅ Consolidated: `gitleaks.yml` (runs on push/PR to main) — removed duplicate `secrets.yml`
  - Need: Ensure `GITLEAKS_LICENSE` secret is set in GitHub repo settings
- [x] **P1: Add `service_role` leakage guard to pre-commit** (2026-02-13)
  - Enhanced `.husky/pre-commit` with JWT/API key pattern detection on staged files
  - Catches `service_role`, long JWTs, and `sk-` prefixed API keys

### Secret Scanning Pipeline (Defense-in-Depth)

```
Layer 1: pre-commit → lint-staged + forbidden-pattern grep ✅
Layer 2: pre-push   → gitleaks local scan ✅
Layer 3: GitHub CI   → gitleaks.yml (consolidated, secrets.yml removed) ✅
Layer 4: GitHub      → Native secret scanning + push protection (VERIFY)
```

---

## 🧪 TEST COVERAGE EXPANSION (2026-02-13)

### Coverage Analysis

- [ ] **P1: Run and evaluate current coverage reports**
  - [ ] Admin panel coverage: target minimum 70% (CI gate set at 70%)
  - [ ] Flutter student app: target minimum 60% (CI gate set at 60%)
  - [ ] Python content-engine: target minimum 80% (CI gate set at 80%)
- [ ] **P1: Identify untested critical paths**
  - [ ] Multi-tenant isolation edge cases (cross-app data access)
  - [ ] RLS policy bypass attempts
  - [ ] Error boundary recovery flows
  - [ ] Offline sync conflict resolution (Flutter)
  - [ ] Token quota exhaustion handling
  - [ ] Invitation code validation edge cases (expired, maxed-out, inactive)
  - [ ] AI question generation error paths and malformed responses

### New Tests Needed

- [ ] **P1: Admin Panel — Hook edge cases**
  - [ ] `use-domains` / `use-skills` / `use-questions`: empty states, error states, pagination
  - [ ] `use-error-logs`: status filtering, promote-to-issue flow
  - [ ] `use-ai-generator`: Zod validation failures, timeout, quota exceeded
- [ ] **P1: Admin Panel — Page-level integration tests**
  - [ ] Dashboard: verify stats load correctly for current tenant
  - [ ] GroupCreatePage / GroupDetailPage: multi-tenant member management
  - [ ] SubjectsPage / AppsPage: CRUD with type-safe mutations
- [ ] **P2: Student App — Critical flows**
  - [ ] Sync service: conflict resolution, tombstone propagation
  - [ ] Practice engine: attempt tracking, streak calculation
  - [ ] Offline-first: queue management, retry logic
- [ ] **P2: Supabase SQL Tests — RLS hardening**
  - [ ] Cross-tenant query isolation for all tables
  - [ ] RPC function permission checks (student vs admin vs mentor)
  - [ ] Edge cases: deactivated users, expired invitations, deleted records
- [ ] **P3: E2E (Playwright) — User journey coverage**
  - [ ] Full admin workflow: login → create app → add curriculum → publish
  - [ ] Student enrollment: registration → join group → practice → mastery

---

## 📊 ERROR LOGGING & OBSERVABILITY REVIEW (2026-02-13)

### Current Implementation Status ✅

Error logging to database is **fully implemented** across both apps:

**Admin Panel (React)**:

- ✅ `lib/error-tracker.ts` — `captureException()` logs to `error_logs` table via `log_error` RPC
- ✅ `ErrorBoundary.tsx` — Catches React component crashes, logs to Supabase
- ✅ `main.tsx` — `initErrorTracking()` captures `unhandledrejection` and global `error` events
- ✅ Admin UI for viewing/triaging errors (`use-error-logs.ts`, monitoring pages)
- ✅ Promote-to-issue flow (`promote_error_to_issue` RPC)

**Student App (Flutter)**:

- ✅ `error_tracker.dart` — `captureException()` logs to `error_logs` via `log_error` RPC
- ✅ `main.dart` — Catches all Flutter zone errors + unhandled platform exceptions
- ✅ Platform auto-detection (web/android/ios/windows/macos/linux)

**Database (Supabase)**:

- ✅ `error_logs` table with: platform, error_type, error_message, stack_trace, url, user_agent, app_version, extra_context, status
- ✅ `known_issues` table for promoted errors with root cause analysis
- ✅ `log_error` RPC function (auto-sets user_id from auth.uid())
- ✅ `promote_error_to_issue` RPC function
- ✅ `security_logs` table + `log_security_event` RPC for security-specific events

### Remaining Observability Tasks

- [ ] **P2: Verify 30-day auto-pruning** — Check if pg_cron job exists for old error_logs cleanup
- [ ] **P2: Critical alert trigger** — Verify `critical_alert` Edge Function fires on HIGH severity errors
- [x] **P2: Dashboard error widget** — DashboardPage now queries real 24h error counts, domain/skill/question totals, and question type distribution from Supabase (2026-02-14)
- [ ] **P3: Add client-side breadcrumb logging** — Log navigation events before errors for better context
