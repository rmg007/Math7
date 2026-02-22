# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SUPABASE_SERVICE_ROLE_KEY`). Prod variables have no prefix. Never mix them.

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
> Steps 1–12 complete ✅ committed `c256381c`. Step 13 deferred until schema stable.

### Step 3: CI Cleanup ✅ — committed `4447e4a7`

- [ ] `docs/quality/TEST_DECISIONS.md` — ADR log (TDR-001..005)
- [ ] `docs/quality/TEST_OWNERS.md` — spec file → component + persona map
- [x] `admin-panel-e2e.yml` `deploy-preview` — stub only; acceptable as-is (echoes, doesn't fail)
- [x] `ci.yml` `oracle-plus-validation` — removed `GEMINI_API_KEY` + `OPENAI_API_KEY` refs ✅
- [x] `ci.yml` `supabase-regression-tests` — replaced `supabase start` (Docker) with remote `TEST_SUPABASE_PROJECT_ID`/`TEST_DB_PASSWORD` connection ✅

### Step 4: Shared Test Infrastructure ✅

- [x] `admin-panel/tests/fixtures/questions.ts` — 5 Zod-valid question fixtures
- [ ] `student-app/test/fixtures/question_fixtures.dart` — Dart mirror _(deferred)_
- [x] `admin-panel/src/__tests__/mocks/supabase-factory.ts` — shared mock factory; migrate 3+ inline mocks
- [ ] `student-app/test/helpers/test_database_factory.dart` — `createEmptyDb()` + `createSeededDb()` _(deferred)_

### Step 5: Add `data-testid` Attributes ✅

- [x] LoginPage — `login-email`, `login-password`, `auth-error`, `forgot-password`, `remember-me`
- [x] `domain-form.tsx` — `domain-form`, `form-error`
- [x] `skill-form.tsx` — `skill-form`
- [x] `domain-list.tsx` — `domains-list` (container)
- [x] `skill-list.tsx` — `skills-list` (container)
- [x] `question-list.tsx` — `questions-list` (container)
- [x] `publish-page.tsx` — `publish-page` (container)
- [ ] (hold up on this )SettingsPage, BulkImportPage, AppsPage — deferred (low priority)

### Step 6: Build 3-Layer E2E Abstraction ✅

- [x] `admin-panel/tests/pages/` — 6 POM classes (Login, Domains, Skills, Questions, Groups, Publish)
- [x] `admin-panel/tests/actions/` — `loginAs(role)`, `createDomain()`, `publishCurriculum()`, etc.
- [x] Migrate `curriculum-lifecycle.e2e.spec.ts` to POM + Actions (prove adoption)

### Step 7: Fix & Migrate Broken E2E Suites ✅

> Verified all 8 specs — clean imports, no rewrites needed. `curriculum-lifecycle` already migrated to POM.

- [x] `auth-flow.e2e.spec.ts`
- [x] `rbac-guards.e2e.spec.ts`
- [x] `mentor-hub.e2e.spec.ts`
- [x] `bulk-import.e2e.spec.ts`
- [x] `apps.e2e.spec.ts`
- [x] `admin-panel.e2e.spec.ts`
- [x] `rls-bypass.e2e.spec.ts`
- [x] `accessibility.spec.ts`
- [x] `responsiveness.spec.ts`

### Step 8: Complete `docs/TEST_PLAN.md` ✅

- [x] Append Section F — UAT Scenarios (4 roles × 3–5 journeys each)
- [x] Append Section G — System Test Plan (SYS-001..005 + contract testing table)
- [x] Append Section H — CI Pipeline Matrix (8 triggers)

### Step 9: `/test` Workflow ✅

- [x] `.agent/workflows/test.md` — 5 modes: plan, infra, write, verify, commit

### Step 10: QA Autoloop Workflow ✅

- [x] `.agent/workflows/qa-autoloop.md` — Scan → Plan → Write → Run → Fix → Commit with hard circuit breakers

### Step 11: QA Health Dashboard ✅

- [x] `scripts/generate-test-report.js` — reads Vitest + Playwright JSON, generates `docs/reports/TEST_COVERAGE.md`
- [x] `--ci` flag exits with code 1 when thresholds not met

### Step 12: Fix Doc Inconsistencies ✅

- [x] `docs/quality/testing-strategy.md` — expanded with dual-DB pattern, test pyramid, full spec table, QA dashboard
- [x] `.agent/TEST_WRITING_GUIDE.md` — appended Playwright E2E section (selectors, mocks, assertions, test IDs)
- [ ] `docs/QA_MASTER_PROMPT.md` — deferred (low priority)
- [ ] `AGENTS.md` — deferred (low priority)

### Step 13: Migration Safety Gate _(deferred until schema stable)_

- [ ] `ci.yml`: migration changes → auto-trigger P0 E2E + SQL RLS tests
- [ ] Document as known risk in `TEST_DECISIONS.md`

---

## 📋 Backlog

- [ ] **Env var hygiene sweep** — audit all `.env*` files across the project; apply `TEST_` prefix consistently; remove stale vars; update `secrets.example.env` and `master-config.test.json`; document full inventory in `docs/ENV_VARS.md`
- [ ] Code hygiene: find and fix `TODO` / `FIXME` comments
- [ ] Delete unused/legacy files
- [ ] P1: Visual Regression Suite (Playwright `toHaveScreenshot`)
- [ ] P1: Cloudflare Workers Paid monitoring — alert if AI generation nears limits
- [ ] P3: Platform Settings page
- [ ] P3: Rollback procedures
- [ ] Mobile card layout for data tables
- [ ] Row selection & bulk actions
- [ ] Advanced table features
