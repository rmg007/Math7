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
> Steps 1–2 complete. Next active: Step 3.

### Step 3: CI Cleanup ✅

- [ ] `docs/quality/TEST_DECISIONS.md` — ADR log (TDR-001..005)
- [ ] `docs/quality/TEST_OWNERS.md` — spec file → component + persona map
- [x] `admin-panel-e2e.yml` `deploy-preview` — stub only; acceptable as-is (echoes, doesn't fail)
- [x] `ci.yml` `oracle-plus-validation` — removed `GEMINI_API_KEY` + `OPENAI_API_KEY` refs ✅
- [x] `ci.yml` `supabase-regression-tests` — replaced `supabase start` (Docker) with remote `TEST_SUPABASE_PROJECT_ID`/`TEST_DB_PASSWORD` connection ✅

### Step 4: Shared Test Infrastructure

- [ ] `admin-panel/tests/fixtures/questions.ts` — 5 Zod-valid question fixtures
- [ ] `student-app/test/fixtures/question_fixtures.dart` — Dart mirror
- [ ] `admin-panel/src/__tests__/mocks/supabase-factory.ts` — shared mock factory; migrate 3+ inline mocks
- [ ] `student-app/test/helpers/test_database_factory.dart` — `createEmptyDb()` + `createSeededDb()`

### Step 5: Add `data-testid` Attributes

- [ ] Sweep 9 pages (~30 attrs): DomainsPage, SkillsPage, QuestionsPage, GroupsPage, PublishPage, LoginPage, SettingsPage, BulkImportPage, AppsPage

### Step 6: Build 3-Layer E2E Abstraction

- [ ] `admin-panel/tests/pages/` — 6 POM classes (Login, Domains, Skills, Questions, Groups, Publish)
- [ ] `admin-panel/tests/actions/` — `loginAs(role)`, `createDomain()`, `publishCurriculum()`, etc.
- [ ] Migrate `curriculum-lifecycle.e2e.spec.ts` to POM + Actions (prove adoption)

### Step 7: Fix & Migrate Broken E2E Suites

> Do after Step 6. `curriculum-lifecycle.e2e.spec.ts` already passes ✅ (4/4).

- [ ] `auth-flow.e2e.spec.ts`
- [ ] `rbac-guards.e2e.spec.ts`
- [ ] `mentor-hub.e2e.spec.ts`
- [ ] `bulk-import.e2e.spec.ts`
- [ ] `apps.e2e.spec.ts`
- [ ] `admin-panel.e2e.spec.ts`
- [ ] `rls-bypass.e2e.spec.ts`
- [ ] `accessibility.spec.ts`, `a11y-audit.spec.ts`
- [ ] `responsiveness.spec.ts`

### Step 8: Complete `docs/TEST_PLAN.md`

> Sections A–E exist. F, G, H missing.

- [ ] Append Database Strategy (4-tier: Mocks → Local → Drift → Staging)
- [ ] Append Section F — UAT Scenarios (4 roles × 3–5 journeys)
- [ ] Append Section G — System Test Plan (SYS-001..005 + contract testing table)
- [ ] Append Section H — CI Pipeline Matrix (8 triggers + gaps)
- [ ] Backfill Test Phase + Infra Deps tags on all 65 existing test IDs

### Step 9: `/test` Workflow

- [ ] `.agent/workflows/test.md` — modes: `plan`, `infra`, `write`, `verify`, `commit`
- [ ] `.cursor/commands/test.md` — thin stub

### Step 10: QA Autoloop Workflow

- [ ] `.agent/workflows/qa-autoloop.md` — Scan → Plan → Write → Run → Fix → Commit
- [ ] Circuit breakers: 5 failures, 25 iterations max, bug fixes always pause for user

### Step 11: QA Health Dashboard

- [ ] `scripts/generate-test-report.js`
- [ ] CI step: auto-write `docs/reports/TEST_COVERAGE.md` on merge to `main`

### Step 12: Fix Doc Inconsistencies

- [ ] `docs/quality/testing-strategy.md` — coverage targets, DB strategy, stale gaps
- [ ] `.agent/TEST_WRITING_GUIDE.md` — Flutter patterns, `page.route()`, shared infra section
- [ ] `docs/QA_MASTER_PROMPT.md` — 4-tier DB, accurate counts (18 specs, 32 Vitest, 28 Flutter)
- [ ] `AGENTS.md` — reference `/test` workflow + `docs/TEST_INFRASTRUCTURE.md`

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
