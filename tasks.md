# Questerix — Global Hardening & Reliability Master List

> **Scope**: Both `admin-panel` (React/Vite) AND `questerix-student-app` (Flutter).
> **Rules**: No new features. Hardening, reliability, testing, and code quality only.
> **Last Deep Scan**: 2026-03-20

---

## 🔴 P0 — Security (High Blast Radius)

### Database / Backend

- [ ] **SEC-P0-01: PII Sanitization in Logs**
  - [x] Implement a masking/hashing function for sensitive fields in all error-capture and security logging (Admin & Student).
  - [ ] Audit existing `error_logs` and `known_issues` for legacy cleartext PII (emails, IDs).
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

- [x] **TEST-A01: AI & Generation (Segment A)**
  - [x] `DocumentUploader.tsx` — Comprehensive tests in `features/ai-assistant/components/__tests__/DocumentUploader.test.tsx`
  - [ ] `OracleService.ts` & `GenerationPage.tsx` unit tests
- [x] **TEST-A02: Auth & Security (Segment B)**
  - [x] `auth-guard.tsx` — Tests in `features/auth/components/__tests__/auth-guard.test.tsx` (vi.hoisted fix applied)
- [ ] **TEST-A03: Curriculum & Hooks (Segment C)**
  - [ ] `use-groups`, `use-known-issues`
  - [ ] `question-form.tsx` & `domain-form.tsx`

### Student App (Flutter)

- [x] **Segment G: Authentication Identity**
  - [x] `LoginNotifier`, `RegisterNotifier`, `ForgotPasswordNotifier` — unit tests in `test/features/auth/controllers/auth_controller_test.dart`. All 8 tests passing. Rewrote from stale class-based pattern to correct `ProviderContainer` Riverpod architecture.
- [ ] **Segment H: Curriculum Learning**
  - [ ] `PracticeController` state machine
  - [ ] `domains_screen.dart` & `skills_screen.dart`
- [ ] **Segment I: Progress Calculations**
  - [ ] Mastery 0-100% logic and Heatmap service logic.

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
- [ ] **QUAL-A03: Accessibility Hardening (Admin Panel)**
  - [ ] 10 interactive components missing `aria-label` / `role=`: `DocumentUploader.tsx`, `QuestionReviewGrid.tsx`, `GenerationPage.tsx`, `SessionsPage.tsx`, `AccountSettingsPage.tsx`, `AuthConfirmPage.tsx`, `InvitationCodesPage.tsx`, `LoginPage.tsx`, `UserManagementPage.tsx`, `domain-form.tsx`.
- [ ] **QUAL-A04: Modularize God-Files (Admin Panel)**
  - [ ] `AppsPage.tsx` (50KB) — extract hooks + sub-components.
  - [ ] `SubjectsPage.tsx` (48KB) — extract hooks + sub-components.
  - [ ] `question-list.tsx` (41KB) — extract `QuestionRow`, `QuestionBulkBar`.
  - [ ] `domain-list.tsx` (34KB) — extract `DomainRow`, `DomainFilterBar`.

### Student App

- [ ] **QUAL-S01: Refactor `practice_screen.dart` (God-class)**
  - [ ] Extract `PracticeController` (Riverpod `AsyncNotifier` for session state).
  - [ ] Extract `PracticeQuizView` (UI rendering only).
  - [ ] Extract `PracticeResultView` (results + XP display).
  - 6 `setState` calls + 1950+ lines is the primary regression risk in the entire app.
- [ ] **QUAL-S02: Migrate `onboarding_screen.dart` to Riverpod**
  - [ ] 7 `setState` calls — convert to `ConsumerStatefulWidget` with a proper notifier. Eliminates re-render bugs.
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

- [ ] **PERF-DB-01: Index Audit for High-Traffic Tables**
  - [ ] Verify composite indexes on `user_activity(student_id, created_at)`.
  - [ ] Verify composite indexes on `attempts(student_id, created_at)`.
  - [ ] Verify `app_id` + `deleted_at` index coverage on all soft-delete tables.
  - [ ] Run `EXPLAIN ANALYZE` on the top 5 most frequent RLS-filtered queries.

### Student App

- [ ] **PERF-S01: Implement Batched Image Prefetching**
  - Pre-fetch question asset images during the `PracticeScreen` loading phase so they appear instantly during quiz playback. Especially critical in weak-network / partial-offline scenarios.
- [x] **PERF-S02: Global Riverpod Error Observer**
  - Implemented `RiverpodErrorObserver` in `questerix-student-app/lib/src/core/errors/riverpod_error_observer.dart`, wired to root `ProviderContainer` in `main.dart`.

### Admin Panel

- [ ] **PERF-A01: TanStack Query Invalidation Audit**
  - `use-questions.ts` (13x), `use-apps.ts` (12x), `use-skills.ts` (12x) have the highest `invalidateQueries` density — audit for over-invalidation causing waterfall re-fetches after mutations.

### CI / Automation

- [ ] **CI-01: Enforce Smoke Coverage Manifest (Rule #9)**
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
