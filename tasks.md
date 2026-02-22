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

## 🏗️ Phase 10: Maintenance & Testing ✅ — committed `a6fd455e`

> All steps complete. Phase archived.

- [x] UI Unification (BulkActionBar, ColumnToggle, Mobile Cards, Stabilization Sweep)
- [x] Test-ID Sweep (AccountSettingsPage, BulkImportPage, AppsPage, question-form.tsx)
- [x] Step 13 Regression Coverage (14 tests: MCQ, Subjective, Boolean, AI-import, empty-form guards)
- ~~Visual Stability (`toHaveScreenshot`)~~ — stalled, deferred to Phase 12

---

## 🏗️ Phase 11: Platform Resilience ✅ — committed `a6fd455e`

> All steps complete. Phase archived.

- [x] Local Encryption F-15 (`sqflite_sqlcipher`, AES-256, OS keychain key storage)
- [x] Edge Function Rollback (`rollback_publish` + `list_curriculum_snapshots` RPCs)
- [x] Secret Rotation Workflow (90-day reminder, GitHub Issue checklist)
- [x] RLS Audit CI job (`rls-audit` in `ci.yml`, `🔴 REAL GAP` = build fail)

---

## 🏗️ Phase 12: Closing Open Loops ✅ — committed `3abdf13b`

> All steps complete. Phase archived.

### Step 1: Test Quality Gaps ✅

- [x] **`question-form.tsx` Test-IDs**: Added `data-testid="question-form-type-select-item-{type}"` to all `SelectItem` nodes in the question-type dropdown (`multiple_choice`, `mcq_multi`, `text_input`, `boolean`, `reorder_steps`). Also added `data-testid="question-form-append-option"` to the MCQ append-option button (POM `appendOptionButton` was broken).
- [x] **`BulkImportPage` `data-testid="bulk-import-file-upload"`**: Confirmed missing; added to the hidden `<input type="file">` element. E2E `toBeAttached()` assertion now resolves correctly.
- [x] **Visual Regression Baseline**: Re-recorded 5 desktop snapshots (`dashboard`, `domains-list`, `skills-list`, `questions-list`, `login-page`) via `--update-snapshots`. All 5 passed. Mobile + tablet baselines were already present from Phase 10.

### Step 2: Documentation ✅

- [x] **LEARNING_LOG.md entry**: Dated `2026-02-21` entry added covering Phases 10 & 11 work (test-ID fixes, visual baseline refresh, SQLCipher, rollback RPC, RLS CI gate, secret rotation).

---

## 📋 Completed Backlog

- [x] **Env var hygiene sweep** — audited all `.env*` files; applied `TEST_` prefix consistently; refactored `env.ts` for dual-DB support; updated `docs/ENV_VARS.md` ✅
- [x] **Code hygiene sweep** — audited source for `TODO`/`FIXME`; refactored inline CSS to Tailwind in curriculum components; resolved `cn` imports; pinned CI Actions SHAs ✅
- [x] **Documentation hygiene** — de-duplicated headings in `LEARNING_LOG.md` to resolve MD024 lints ✅
- [x] P1: Cloudflare Workers Paid monitoring — alert if AI generation nears limits ✅
