# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SUPABASE_SERVICE_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🔥 ACTIVE INCOMPLETE TASKS (By Priority)

### P0: Critical / Safety Gate

- [x] `ci.yml`: migration changes → auto-trigger P0 E2E + SQL RLS tests (from Step 13) ✅
- [x] Document as known migration risk in `TEST_DECISIONS.md` (from Step 13) ✅
- [x] `docs/quality/TEST_DECISIONS.md` — ADR log (TDR-001..005) (from Step 3) ✅
- [x] `docs/quality/TEST_OWNERS.md` — spec file → component + persona map (from Step 3) ✅
- [x] `student-app/test/fixtures/question_fixtures.dart` — Dart mirror (from Step 4) ✅
- [x] `student-app/test/helpers/test_database_factory.dart` — `createEmptyDb()` + `createSeededDb()` (from Step 4) ✅

### P2: UI & Features

- [x] Mobile card layout for data tables ✅
- [x] Advanced table features (Column visibility, Extended filtering, Bulk status updates) ✅

### P3: Documentation & Hygiene

- [x] `docs/QA_MASTER_PROMPT.md` — low priority (from Step 12) ✅
- [x] `AGENTS.md` — low priority (from Step 12) ✅
- [x] Delete unused/legacy files (from Backlog) ✅

---

## ✅ Secret Gaps (audit: 2026-02-21) — all closed

- [x] `TEST_SUPABASE_SERVICE_ROLE_KEY` — set in GitHub + `admin-panel/.env.local`
- [x] `LHCI_GITHUB_APP_TOKEN` — set
- [x] `GITLEAKS_LICENSE` — community mode confirmed sufficient
- [x] Stale `STAGING_*` secrets — deleted

---

## 🏗️ Phase 9: QA Foundation

> **Locked decisions**: E2E runs against `QuesterixDB-test` · serialized via `concurrency:` · 3-layer POM abstraction · `TEST_COVERAGE.md` auto-generated on merge to main
>
> Steps 1–13 complete ✅ committed `c256381c` → `a6fd455e`.

### Step 3: CI Cleanup ✅ — committed `4447e4a7`

- [x] Pin GitHub Actions to SHAs in `ci.yml` (REL-04 hardening) ✅
- [x] `admin-panel-e2e.yml` `deploy-preview` — stub only; acceptable as-is
- [x] `ci.yml` `oracle-plus-validation` — removed `GEMINI_API_KEY` + `OPENAI_API_KEY` refs ✅
- [x] `ci.yml` `supabase-regression-tests` — replaced `supabase start` with remote connection ✅

### Step 4: Shared Test Infrastructure ✅

- [x] `admin-panel/tests/fixtures/questions.ts` — 5 Zod-valid question fixtures
- [x] `admin-panel/src/__tests__/mocks/supabase-factory.ts` — shared mock factory; migrate 3+ inline mocks

### Step 5: Add `data-testid` Attributes ✅

- [x] LoginPage — `login-email`, `login-password`, `auth-error`, `forgot-password`, `remember-me`
- [x] `domain-form.tsx` — `domain-form`, `form-error`
- [x] `skill-form.tsx` — `skill-form`
- [x] `domain-list.tsx` — `domains-list` (container)
- [x] `skill-list.tsx` — `skills-list` (container)
- [x] `question-list.tsx` — `questions-list` (container)
- [x] `publish-page.tsx` — `publish-page` (container)

### Steps 6–12: E2E, POM, Test Plan, Workflows & Dashboard ✅ — committed `c256381c`

- [x] POM & Actions abstraction (Login, Domains, Skills, Questions, Groups, Publish)
- [x] All 8 E2E specs migrated/fixed (Auth, RBAC, MentorHub, BulkImport, Apps, RLS, etc.)
- [x] `docs/TEST_PLAN.md` complete (UAT, System, CI Matrix)
- [x] `/test` and `qa-autoloop` workflows implemented
- [x] QA Health Dashboard (`scripts/generate-test-report.js`)
- [x] Documentation synchronized (Dual-DB, Pyramid, Writing Guide)

---

## 🏗️ Phase 10: Maintenance & Testing (ACTIVE)

> **Objective**: Hardened stability and UI consistency within the current feature set. Strictly follows the Admin Panel Feature Freeze.

### Step 1: UI Consistency (Maintenance)

- [x] **Bulk Actions Unification**: Replaced legacy inline bars across all curriculum lists with the floating `BulkActionBar` and unified `Select All` header logic. ✅
- [x] **Mobile Parity Sweep**: Carried the `SortableCard` layout pattern to all curriculum lists and fixed missing props. ✅
- [x] **Refinement**: Add `ColumnToggle` support and standalone Premium Toolbars to `AppsPage` and `SubjectsPage`. ✅
- [x] **Stabilization Sweep**: Resolved 60+ lint and TSC errors. Removed redundant UI bars and unified selection logic in `DomainList`. ✅

### Step 2: QA & Infrastructure (Testing)

- [ ] (Stalled - don't process this) **Visual Stability**: Implement the first set of Playwright `toHaveScreenshot` tests for the Dashboard and Curriculum list views.
- [x] **Test-ID Sweep**: Add standard `data-testid` attributes to `SettingsPage`, `BulkImportPage`, and `AppsPage` fields to support E2E automation. ✅ — `AccountSettingsPage` (deactivate/delete panels + confirm input/buttons), `BulkImportPage` (page root, tabs, AI textarea, sync btn, dryrun switch, commit btn, buffer card, template btn, skill select), `AppsPage` (search input, clear btn, status filter, list container), `question-form.tsx` (form root, type select, skill select, MCQ/multi options, boolean switch, text_input answer, submit btn)
- [x] **Regression Coverage**: Step 13 — Feature-specific E2E for MCQ, Subjective, and AI-generated question types. ✅ — `tests/pages/QuestionFormPage.ts` (new POM with typed helpers for all question types) + `tests/question-types-regression.e2e.spec.ts` (14 tests across 5 describe blocks: MCQ create/validate/append, Subjective create/validate, Boolean TRUE+FALSE, Bulk-import AI mocked suite, cross-type empty-form guards)

---

## 🏗️ Phase 11: Platform Resilience (Student & Infra)

### Step 1: Security & Compliance

- [x] **Local Encryption (F-15)**: Migrate Student App SQLite storage to `sqflite_sqlcipher`. ✅ - Swapped `sqlite3_flutter_libs` → `sqlcipher_flutter_libs ^0.6.8` (mutually exclusive) - `database.dart` now uses `NativeDatabase.createInBackground` + `PRAGMA key` via AES-256 SQLCipher - Encryption key stored in OS keychain via `flutter_secure_storage` (AndroidKeystore / iOS Keychain) - `setupSqlCipher()` called in `main()` before any DB access; background isolate also initialised - Web platform falls back to unencrypted WASM (acceptable per threat model) - `build_runner` regenerated `database.g.dart` cleanly; `flutter analyze --no-fatal-infos` exits 0
- [x] **Edge Function Rollback**: Implement `rollback-publish` logic in Supabase to revert curriculum deployments. ✅ - Migration `20260221220000_rollback_publish_rpc.sql` — adds two SECURITY DEFINER RPCs: - `rollback_publish(app_id, version)` — soft-unpublishes live content, restores from snapshot JSON, updates `curriculum_meta` - `list_curriculum_snapshots(app_id)` — returns all available versions for admin UI rollback picker - Applied to production (`QuesterixDB-v2`) via Supabase MCP

### Step 2: DevSecOps Hygiene

- [x] **Secret Rotation**: Re-issue and update `GITHUB_TOKEN` in CI/CD secrets. ✅ - `GITHUB_TOKEN` is auto-provisioned by GitHub Actions per-run (ephemeral, cannot be manually rotated — by design) - Created `.github/workflows/secret-rotation.yml` — runs every 90 days + on-demand - Generates a GitHub Issue checklist for all manually-rotated secrets (Supabase service role keys, Cloudflare API tokens, etc.) - Documents rotation SOP inline in the workflow
- [x] **Audit Automation**: Integrate the RLS Audit script into the CI pipeline to run automatically post-migration. ✅ - Added `rls-audit` job to `ci.yml` (runs after `supabase-regression-tests` when migrations change) - Installs `psql`, runs `supabase/scripts/audit-rls.sql` against test DB - Fails the build if any **🔴 REAL GAP** rows are returned - Uploads `rls-audit-report.txt` as a CI artifact on every run

---

## 📋 Completed Backlog

- [x] **Env var hygiene sweep** — audited all `.env*` files; applied `TEST_` prefix consistently; refactored `env.ts` for dual-DB support; updated `docs/ENV_VARS.md` ✅
- [x] **Code hygiene sweep** — audited source for `TODO`/`FIXME`; refactored inline CSS to Tailwind in curriculum components; resolved `cn` imports; pinned CI Actions SHAs ✅
- [x] **Documentation hygiene** — de-duplicated headings in `LEARNING_LOG.md` to resolve MD024 lints ✅
- [x] P1: Cloudflare Workers Paid monitoring — alert if AI generation nears limits ✅
