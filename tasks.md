# Questerix — Global Hardening & Reliability Master List

> **Scope**: Both `admin-panel` (React/Vite) AND `questerix-student-app` (Flutter).
> **Rules**: No new features. Hardening, reliability, testing, and code quality only.
> **Last Deep Scan**: 2026-03-20

---

## ✏️ Active — Delivery Plan

- [x] **Task 102: Execute Multi-Repo Delivery Plan — Week 1 (Quick Wins)**
  - [x] Fix `nightly-e2e.yml` (glob, project names, env vars, webServer)
  - [x] Fix `ci.yml` Playwright project names (`chromium` → `desktop`)
  - [x] Remove duplicate Playwright run from `ci.yml`
  - [x] Delete debug/diagnostic test files from `admin-panel/tests/` (verified non-existent)
  - [x] Lighten `.husky/pre-commit` hook (remove `tsc --noEmit`, move to pre-push)
  - [x] Remove E2E smoke from `.husky/pre-push` hook (enforce in CI only)

- [x] **Task 103: Execute Multi-Repo Delivery Plan — Week 2 (Agent Governance Trim)**
  - [x] Implement task-complexity tiers (Tier S/M/L) in all AGENTS.md files as the first rule
  - [x] Kill mandatory 7-file bootstrap & replace with simpler protocol
  - [x] Kill Cortex plan/verify ceremony (keep cortex_search only)
  - [x] Strip GEMINI.md files to <30 lines (Antigravity execution permissions only); move universal rules to AGENTS.md
  - [x] Demote LEARNING_LOG to weekly summary
  - [x] Delete or archive 15+ unused workflow files
  - [x] Add path filters to `ci.yml` jobs (admin, flutter, python, edge functions)
  - [x] Move cross-browser E2E, Pa11y, coverage gates to merge-to-main or label-triggered
  - [x] Move questerix-student-app performance profiler to nightly
  - [x] Create `test:fast` scripts in both repos
  - [x] Standardize command aliases across repos

- [x] **Task 104: Execute Multi-Repo Delivery Plan — Week 3 (Type Drift & Orchestrator Refactor)**
  - [x] Consolidate TypeScript types to single `packages/core` target.
  - [x] Migrate admin-panel imports.
  - [x] Split orchestrator into focused deployment scripts.
  - [x] Add contract-change checklist to standard PR template.

- [x] **Task 105: Execute Multi-Repo Delivery Plan — Week 4 (God-File Decomposition & Docs)**
  - [x] Begin god-file decomposition — start with `admin-panel/src/features/platform/pages/AppsPage.tsx`
  - [x] Reduce close checklist to per-session (not per-task)
  - [x] Create per-repo `QUICKSTART.md` cheat sheets
  - [x] Auto-generate CHANGELOG from conventional commits
  - [x] Retrospective: measure and adjust metrics
- [x] **Task 106: Execute Multi-Repo Delivery Plan — Week 5 (Deep Housekeeping)**
  - [x] Audit `Questerix` folder by folder to identify and delete unused/deprecated scripts.
  - [x] Scan `questerix-student-app` for orphaned widgets, unreachable screens, and dead providers.
  - [x] Prune `/tmp`, `/.agent/scratch`, and any temporary test dump folders globally.
  - [x] Remove fully deprecated edge functions and orphaned SQL migration drafts.
  - [x] Delete legacy placeholder images, unused `assets/`, and dead design tokens.
  - [x] Run dependency audits (`npm prune` / `depcruise`) and uninstall unused packages.

- [x] **Task 107: Student App Router & Tab State Stabilization (2026-03-27)**
  - [x] Synchronize `MainShell` tab state with GoRouter URLs (resolved deep-link visibility bugs)
  - [x] Refactor `app_router_test.dart` for clean Drift database lifecycle (resolved pending timer assertions)
  - [x] Resolve Admin Panel `governedGeneration` test type mismatches for Supabase mocks
  - [x] Integrate and verify mono-repo health checks in `tasks.json` via `ops_runner.py`

- [x] **Task 108: Modularize Monitoring Dashboard — ErrorLogsPage (2026-03-27)**
  - [x] Decompose `ErrorLogsPage.tsx` (god-file) into isolated sub-components (`ErrorStats`, `ErrorLogTable`, `BulkActionBar`, `ErrorDetailDialog`, `PromoteIssueDialog`).
  - [x] Strict Type Hardening: Reconciled internal `ErrorLog` interface with Supabase `Json` types, enforcing zero-any in the monitoring feature.
  - [x] Mentorship Stabilization: Resolved `GroupDetailPage.tsx` type mismatch for `allow_anonymous_join`.
  - [x] Accessibility: Implemented `role="main"` and `aria-label` enhancements for the dashboard.
  - [x] Clean Build: Resolved all modularization-induced regressions and lint warnings (Verified with `tsc --noEmit`).

- [ ] **Task 109: Student App Structural & Performance Hardening (Phase 18-20)**
  - [x] **DB-P0-01: Fix Drift Migration Drift** (SQLite `appId` Column Conflict) — Resolve blocker in `attempts` table migration. (Self-healing implemented and verified).
  - [x] **PERF-S01: Implement Batched Image Prefetching** — Add pre-fetcher to `PracticeNotifier` to eliminate question asset pop-in. (Verified with nested traversal for options/help/solution).
  - [x] **QUAL-S06.2: Deep-link Verification** — Verify routing from push notifications across all platforms. (Verified via `app_router_test.dart`).
  - [x] **Regression Fix**: Stabilized `app_router_test.dart` and resolved `user_metadata_repository.dart` compilation drift.

- [ ] **Task 110: Admin Panel AI Studio Loop & Final Modularization**
  - [x] **Phase 12 Integration**: Connected the Review Grid "Approve" action directly to the Bulk Import engine (Nexus buffer) in `GenerationPage.tsx` and `RefinePersistActionHeader.tsx`.
  - [ ] **God-File Deconstruction**:
    - [ ] `KnownIssuesPage.tsx` (40KB) -> Extracted sub-components.
    - [ ] `question-form.tsx` (33KB) -> Extracted `QuestionTypes` sub-forms.
    - [ ] `GenerationPage.tsx` (28KB) -> Modularized AI orchestration.
  - [x] **Zero-Any Audit**: Performed final audit of `features/monitoring` and `features/curriculum`. Verified 100% type safety in `GenerationPage.tsx`, `question-form.tsx`, and `ErrorLogsPage.tsx`.
  - [ ] **Final Smoke Pass**: Run Playwright suite on the modularized components to ensure interaction stability.

---

## [x] Task 100: Deploy Questerix (Session: 2026-03-25)

- [x] Apply migration: `20260325000001_create_studio_prompts.sql` [verified]
- [x] Generate environment files (`generate-env.ps1`) [done]
- [x] Build and Deploy Admin Panel [done]
- [x] Build and Deploy Student App [skipped - only admin matched changes]
- [x] Verify Deployment [smoke tests PASSED]

---

## [x] Task 101: AI Studio Stabilization & Workers AI Migration

Last Update: 2026-03-25

- [x] **Data Cleanup**: Clear `questions`, `studio_prompts`, `ai_generation_sessions`, `generation_audit_log`, `ai_debug_logs`. [done]
- [x] **Refactor API**: Strictly use Cloudflare Workers AI in `generateQuestions.ts` and `validateContent.ts`. [verified]
- [x] **Standardize Types**: Unified `mcq` to `multiple_choice` across hooks, components, and tests. [done]
- [x] **Harden Pipeline**: Implemented Zod safe-parsing for AI content and robust prompt record lifecycle. [done]
- [x] **Delete Obsolete APIs**: Remove Supabase Edge Function AI fallbacks (e.g. in `BulkImportPage.tsx`).
- [x] **Fix E2E Tests**:
  - [x] Resolve persistent button interaction timeouts in `ai-studio-workers.e2e.spec.ts`.
  - [x] Adjust type selection logic to avoid toggling default types OFF.
  - [x] Ensure `unauthenticated` project tests correctly redirect or are excluded.
- [x] **Verify Error Handling**:
  - [x] Verify UI gracefully handles Workers AI 500 errors.
  - [x] Verify redirection/error when `VITE_WORKERS_URL` is missing.

---

## 🔴 P0 — Security (High Blast Radius)

### Database / Backend

- [x] **SEC-P0-01: PII Sanitization in Logs**
  - [x] Implement a masking/hashing function for sensitive fields in all error-capture and security logging (Admin & Student).
  - [x] Audit existing `error_logs` and `known_issues` for legacy cleartext PII (emails, IDs).
- [x] **SEC-P0-02: Edge Function Environment Guard**
  - [x] `health-check/index.ts` has 35 `Deno.env.get()` calls — audit for missing startup guards that throw if critical env vars are undefined (prevents silent misconfiguration failures in production).
- [x] **SEC-P0-03: `localStorage` Usage Audit (Admin Panel)**
  - [x] Audited: `AccountSettingsPage.tsx`, `AppContext.tsx`, `auth-guard.tsx`, `LoginPage.tsx`, `sidebar.tsx`. All localStorage/sessionStorage values are boolean flags (`questerix_remember_me='1'`, `questerix_session_active='1'`) and opaque IDs (`app_id`). No PII stored unencrypted. ✅ PASS.

### Edge Functions

- [x] **SEC-P0-04: Add `test.ts` to 9 Untested Edge Functions**
  - Critical functions with **zero** test coverage:
    - [x] `analyze-spec-drift`
    - [x] `critical-alert`
    - [x] `health-check`
    - [x] `index-specification`
    - [x] `manage-app-domains`
    - [x] `parse-import-prompt`
    - [x] `revoke-user-sessions`
    - [x] `generate-test-from-spec`

---

## 🟠 P1 — Testing & Coverage (Segmented for Stability)

### Admin Panel (React/Vite)

- [x] **TEST-A01: Oracle & AI Pipeline (Segment A)**
  - [x] `DocumentUploader.tsx` — Comprehensive tests in `features/ai-assistant/components/__tests__/DocumentUploader.test.tsx`
  - [x] `QuestionReviewGrid.tsx` — Tests in `features/ai-assistant/components/__tests__/QuestionReviewGrid.test.tsx`
  - [x] `use-studio-prompts.ts` — Tests in `features/curriculum/hooks/__tests__/use-studio-prompts.test.tsx`
  - [x] AI Assistant API (`generateQuestions.ts`, `validateContent.ts`, `governedGeneration.ts`) — Full unit test coverage in `src/features/ai-assistant/api/__tests__`
  - [x] `OracleService.ts` & `GenerationPage.tsx` unit tests
- [x] **TEST-A02: Auth & Security (Segment B)**
  - [x] `auth-guard.tsx` — Tests in `features/auth/components/__tests__/auth-guard.test.tsx` (vi.hoisted fix applied)
- [x] **TEST-A03: Curriculum & Hooks (Segment C)**
  - [x] `use-groups`, `use-known-issues`
  - [x] `question-form.tsx` & `domain-form.tsx`

### Student App (Flutter)

- [x] **Segment G: Authentication Identity**
  - [x] `LoginNotifier`, `RegisterNotifier`, `ForgotPasswordNotifier` — unit tests in `test/features/auth/controllers/auth_controller_test.dart`. All 8 tests passing. Rewrote from stale class-based pattern to correct `ProviderContainer` Riverpod architecture.
- [x] **Segment H: Curriculum Learning**
  - [x] `PracticeController` state machine
  - [x] `domains_screen.dart` & `skills_screen.dart`
- [x] **Segment I: Progress Calculations**
  - [x] Mastery 0-100% logic and Heatmap service logic.

### Regression Prevention

- [x] **REL-09: Fix Global regex `.test` side effect**
  - `admin-panel/src/__tests__/security/bundle-safety.test.ts` — stateful regex without `/g` reset.
- [x] **REL-08: Fix `const`-in-`try` scope leaks (Admin Panel)**
  - `ErrorBoundary.tsx:50`
  - `AppContext.tsx:22/132/143`
  - `question-list.tsx:621/634/638`

---

## 🟡 P2 — Code Quality & Architecture

### Admin Panel

- [x] **QUAL-A01: Type-Safety Zero-Any Drive** (85 violations found)
  - [x] Eliminate `30x ": any"` in `admin-panel/src/` — use `unknown` + type narrowing.
  - [x] Eliminate `55x "as any"` — use `as unknown as Type` bridges for Supabase types.
- [x] **QUAL-A02: Eliminate `console.log` in Production Code**
  - [x] `AppContext.tsx` — 5 console calls
  - [x] `LoginPage.tsx` — 5 console calls
  - [x] `InvitationCodesPage.tsx` — 5 console calls
  - [x] Replace all with `errorTracker.captureException` or `SecurityLogger` where appropriate.
- [x] **QUAL-A03: Accessibility Hardening (Admin Panel)**
  - [x] 10 interactive components hardened with `aria-label` / `role=`: `DocumentUploader.tsx`, `QuestionReviewGrid.tsx`, `GenerationPage.tsx`, `SessionsPage.tsx`, `AccountSettingsPage.tsx`, `AuthConfirmPage.tsx`, `InvitationCodesPage.tsx`, `LoginPage.tsx`, `UserManagementPage.tsx`, `domain-form.tsx`. Verified with unit tests where possible.
- [x] **QUAL-A04: Modularize God-Files (Admin Panel)**
  - [x] `AppsPage.tsx` (50KB) — extracted `PlatformToolbar` components, resolved prop types.
  - [x] `SubjectsPage.tsx` (48KB) — refactored to use modular toolbar components, fixed build errors.
  - [x] `question-list.tsx` (41KB) — extract `QuestionRow`, `QuestionBulkBar`. Stabilized unit tests.
  - [x] `domain-list.tsx` (34KB) — extract `DomainRow`, `DomainFilterBar`. Fixed unit tests.
  - [x] `skill-list.tsx` — Modularized and added unit tests.

### Student App

- [x] **QUAL-S01: Refactor `practice_screen.dart` (God-class)**
  - [x] Extract `PracticeController` (Riverpod `AsyncNotifier` for session state).
  - [x] Extract `PracticeQuizView` (UI rendering only).
  - [x] Extract `PracticeResultView` (results + XP display).
  - 6 `setState` calls + 1950+ lines is the primary regression risk in the entire app.
- [x] **QUAL-S02: Migrate `onboarding_screen.dart` to Riverpod**
  - [x] 7 `setState` calls — convert to `ConsumerStatefulWidget` with a proper notifier. Eliminates re-render bugs.
- [x] **QUAL-S03: Eliminate `print()` / `debugPrint()` calls in Production**
  - [x] `sync_orchestrator.dart` — 13 print calls (most in the app)
  - [x] `error_tracker.dart` — 7 print calls
  - [x] `image_cache_service.dart` — 7 print calls
  - [x] `audio_service.dart` — 6 print calls
  - [x] Replace with conditional logging guard: `if (kDebugMode) { ... }`.
- [x] **QUAL-S04: Silence Bare `catch (e)` Blocks**
  - [x] `native.dart:40,94`, `database.dart:58`, `security_service.dart:109` — caught exceptions not forwarded to `errorTracker`.
- [x] **QUAL-S05: Delete `shop_screen.dart` TODO or Implement**
  - Resolved: Stale TODO removed; screen is fully implemented for MVP. Design decision documented in comment.
- [x] **QUAL-S06: Adopt GoRouter (AUDIT-NAV-001)**
  - [x] QUAL-S06.1: `go_router 17.1.0` added; `app_router.dart` created with full route hierarchy, auth guard, and typed params.
  - [ ] QUAL-S06.2: Deep-link verification from push notifications (future sprint).

---

## 🔵 P3 — Performance & Infrastructure

### Database

- [x] **PERF-DB-01: Index Audit for High-Traffic Tables**
  - [x] Verify composite indexes on `user_activity(student_id, created_at)`.
  - [x] Verify composite indexes on `attempts(student_id, created_at)`.
  - [x] Verify `app_id` + `deleted_at` index coverage on all soft-delete tables.
  - [x] Run `EXPLAIN ANALYZE` on the top 5 most frequent RLS-filtered queries.

### Student App (Performance)

- [x] **PERF-S01: Implement Batched Image Prefetching**
  - Pre-fetch question asset images during the `PracticeScreen` loading phase so they appear instantly during quiz playback. Especially critical in weak-network / partial-offline scenarios.
- [x] **PERF-S02: Global Riverpod Error Observer**
  - Implemented `RiverpodErrorObserver` in `questerix-student-app/lib/src/core/errors/riverpod_error_observer.dart`, wired to root `ProviderContainer` in `main.dart`.

### Admin Panel (Performance)

- [x] **PERF-A01: TanStack Query Invalidation Audit**
  - `use-questions.ts` (13x), `use-apps.ts` (12x), `use-skills.ts` (12x) have the highest `invalidateQueries` density — audit for over-invalidation causing waterfall re-fetches after mutations.

### CI / Automation

- [x] **CI-01: Enforce Smoke Coverage Manifest (Rule #9)**
  - Add a GitHub Action step to `ci.yml` that fails the PR if a new file is added to `features/*/pages/` without a corresponding entry in `smoke-coverage-manifest.json`.
- [x] **CI-02: Student App Stray File Cleanup**
  - Deleted 4 stray `.txt` files from student app root (test_session_output.txt, analyze_output.txt, etc.).

---

- [x] **Task 4: Reliability Audit**
  - [x] Sub-task 4.1: Run reliability audit in Admin Panel.
    - [x] Fix `app_id` scoping in `useDuplicateQuestion`.
    - [x] Implement global API timeouts in `supabase.ts`.
    - [x] Add destructive migration check script.
    - [x] Implement atomic reordering RPCs for questions, skills, and domains.
    - [x] Harden `SECURITY DEFINER` functions with `search_path`.
  - [x] Sub-task 4.2: Run reliability audit in Student App.
    - [x] Guard all `debugPrint` calls with `kDebugMode`.
    - [x] Instrument all bare catch blocks with `captureException`.

- [x] Task 5: Deployment to Cloudflare
  - [x] Deploy Admin Panel to Cloudflare Pages.
  - [x] Deploy Student App to Cloudflare Pages (Web).

- [x] **Task 6: AI Question Studio Domain Verification**
  - [x] Verify 'Mathematics' and 'Computer Science' visibility in the domain selector grid.
  - [x] Captured screenshot evidence: `domain_selector_grid_1773510170755.png`.
