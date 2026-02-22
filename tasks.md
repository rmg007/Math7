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

## 🏗️ Phase 12: Closing Open Loops (ACTIVE)

> **Objective**: Address three gaps found in the Phase 10/11 review. Strictly maintenance — no new features.

### Step 1: Test Quality Gaps

- [ ] **`question-form.tsx` Test-IDs incomplete**: The POM references `data-testid="question-form-type-select-item-{type}"` for each question type option, but these type-option items are not yet confirmed to be in the source. Audit `question-form.tsx` and add missing `data-testid` attributes to all `SelectItem` nodes for question types (`mcq`, `text_input`, `boolean`, `multi_mcq`, `reorder_steps`).
- [ ] **`BulkImportPage` `data-testid="bulk-import-file-upload"`**: Verify this exists in `BulkImportPage.tsx` source (POM references it but it may be hidden). Add if missing.
- [ ] **Visual Regression Baseline** (previously stalled): Now that test-IDs are comprehensive, record Playwright `toHaveScreenshot` snapshots for Dashboard and Domains/Skills list views as the stable baseline.

### Step 2: Documentation

- [ ] **LEARNING_LOG.md entry**: Add a dated `2026-02-21` entry covering Phases 10 & 11 work (UI unification, SQLCipher migration, rollback RPC, RLS CI gate, Q-type E2E).

---

## 📋 Completed Backlog

- [x] **Env var hygiene sweep** — audited all `.env*` files; applied `TEST_` prefix consistently; refactored `env.ts` for dual-DB support; updated `docs/ENV_VARS.md` ✅
- [x] **Code hygiene sweep** — audited source for `TODO`/`FIXME`; refactored inline CSS to Tailwind in curriculum components; resolved `cn` imports; pinned CI Actions SHAs ✅
- [x] **Documentation hygiene** — de-duplicated headings in `LEARNING_LOG.md` to resolve MD024 lints ✅
- [x] P1: Cloudflare Workers Paid monitoring — alert if AI generation nears limits ✅
