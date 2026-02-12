# Questerix Development Tasks

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

## 🚨 URGENT PROD FIXES

- [x] **Admin Panel Crash (StatusBadge)**: Fixed `TypeError: Cannot read properties of undefined (reading 'bg')` in `StatusBadge` component.
- [ ] **BUG #1 & #2: Domain CRUD Failure (403 Forbidden)**: Investigating Supabase RLS policies for `domains` table. Users currently cannot Create or Update domains.
- [ ] **BUG #3: Error Logs Page Crash**: Investigating systemic crash on `/error-logs` route.
- [ ] **Form Feedback**: Add loading indicators to "Initiate Provision" and "Update Signature" buttons.
- [ ] **Feature Verification**: Verify "Template" and "Upload" buttons in Domain Registry.

---

## 🚀 DEPLOYMENT & INFRASTRUCTURE

- [x] **Cloudflare Pages**: Admin Panel and Student App are live.
- [x] **Landing Pages Deletion**: Manually deleted from Cloudflare by user.
- [x] **HARD RULE**: `landing-pages` MUST NOT be published. `orchestrator.ps1` has been locked with `$SkipLanding = $true`.
- [x] **Custom Domains**: Pointed to `admin.questerix.com` and `app.questerix.com`.
