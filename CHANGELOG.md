# Changelog

All notable changes to the Questerix project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.4] - 2026-03-25 (AI Studio Hardening & Production Deployment)

### Added

- **AI Studio**: Hardened E2E test suite with robust locators for Shadcn UI components and mandatory "Review" checkbox verification.
- **AI Studio**: Modernized generation pipeline by standardizing question type identifiers (`multiple_choice` replaces legacy `mcq` across the stack).
- **Deployment**: Successfully promoted Admin Panel to production using the unified `orchestrator.ps1` pipeline.
- **Environment**: Centralized frontend environment validation in `src/config/env.ts` with fail-fast initialization.

### Fixed

- **Testing**: Resolved intermittent timeouts in `ai-studio-workers.e2e.spec.ts` by improving stable `canGenerate` state detection.
- **Database**: Synchronized local migration history with production via `supabase migration repair`, resolving deployment drift.
- **Edge Functions**: Hardened `generate-questions` Edge Function with updated AI prompts for the modernized schema.

---

### Deployed

- **Admin Panel**: Live at `https://849ea64f.questerix-admin.pages.dev`
- **Student App**: Live at `https://ec173809.questerix-student.pages.dev`
- **Pipeline**: Ran `generate-env.ps1` → Flutter Web build → `wrangler` deploy for both apps.

## [2.3.2] - 2026-03-20 (Hardening: TSC Zero, Vitest 607/607, Flutter Zero Issues)

### Fixed

- **Testing (Admin Panel)**: Resolved `TSC2349 (never)` in `auth-guard.test.tsx` — used object wrapper `{ fn: T | null }` to bypass TypeScript CFA limitation on `let` mutations inside callbacks.
- **Testing (Admin Panel)**: Fixed `vi.hoisted()` ordering issue in `DocumentUploader.test.tsx` — mock factories now use `vi.hoisted()` for all referenced variables.
- **Testing (Admin Panel)**: Polyfilled `File.arrayBuffer()` in test helpers — JSDOM does not implement it natively.
- **Testing (Admin Panel)**: Suppressed `unhandledRejection` noise from `Promise.reject()` in mocks using `.catch(() => {})`.
- **Testing (Admin Panel)**: Fixed `rls-bypass` integration test — corrected status constraint (`new`) and apps anon-access assertion.
- **Testing (Student App)**: Rewrote `auth_controller_test.dart` to use `ProviderContainer` + `authServiceProvider.overrideWithValue(mock)` pattern.
- **Security**: Closed SEC-P0-03 — `localStorage` audit PASS; only boolean flags and opaque IDs stored, no PII.

### Added

- **Tests Created**: `auth_controller_test.dart` (8/8 passing), `DocumentUploader.test.tsx` (13/13), `auth-guard.test.tsx` (8/8).

## [2.3.1] - 2026-03-20 (GoRouter, Riverpod Error Observer & Vitest Fix)

### Added

- **Student App — Routing**: GoRouter `17.1.0` installed. `app_router.dart` created with public/auth route separation, `ShellRoute` wrapping `MainShell`, auth guard bridging Supabase auth events via `refreshListenable`.
- **Student App — Observability**: `RiverpodErrorObserver` implemented in `lib/src/core/errors/riverpod_error_observer.dart`. Filters transient errors; routes unexpected failures to `errorTracker.captureException`. Wired to root `ProviderContainer` in `main.dart`.

### Fixed

- **Testing (Admin Panel)**: `auth-guard.test.tsx` rewritten with `vi.hoisted()` — eliminates "Cannot access before initialization" hoist trap.
- **Testing (Admin Panel)**: `use-domains-bulk.test.tsx` AP-CURR-013 block rewritten to assert against `supabase.rpc` (not `.from().update()`).

## [2.2.8] - 2026-02-27 (Great Recovery)

### Fixed

- **Cortex Health Restoration**: Restored 100/100 health score after accidental system drift.
- **RLS Hardening**: Fixed critical RLS violations in `curriculum_meta` and solved recursion/access issues across the core schema.
- **Publishing Logic**: Patched `publish_curriculum` RPC to correctly count total live items in snapshots (fixing AP-CURR-007 test failure).
- **Scanner Stability**: Hardened path resolution for `@/` aliases and improved graph persistence for Cortex intelligence.

### Improved

- **Deployment Pipeline**: Unified Cloudflare deployment script for React/Vite Admin Panel (Student App logic removed/moved).
- **Infrastructure Health**: Integrated `ZombieHunter` for automated cleanup of detached Dart/Vite processes.
- **Real-time Observability**: Integrated DashboardServer for live stream logs during Cortex analysis runs.

### Removed

- **Repo Bloat**: Officially decommissioned `questerix-student-app` from this repository (moved to a dedicated repo).

## [2.2.6] - 2026-02-24

### Fixed

- **Accessibility (WCAG AA Compliance)**: Resolved all critical and serious violations on Dashboard, Domains, Questions, and Bulk Import pages.
- **Sortable Header**: Fixed critical `aria-allowed-attr` violation by removing `aria-sort` from button elements and relying on `aria-label`.
- **Contrast Ratios**: Hardened color contrast by upgrading `teal-600` to `teal-700` and `gray-400` to `gray-500/600` across all curriculum management components.
- **Readability**: Increased minimum font size for informative labels to `11px` and standardized on readable font slopes to support users with low vision.
- **Empty States**: Fixed visibility issues in Bulk Import empty states by removing container-level opacity and using high-contrast text.

### Added

- **App Management Stability**: Implemented automatic subdomain normalization (lowercase, filtered characters, 63-char limit) to ensure RFC compliance and prevent database length errors.
- **E2E Observability**: Added `data-testid="app-delete-btn"` and improved locator scoping for `AlertDialog` components to resolve background interaction interference in tests.

### Fixed

- **App Creation Bug**: Resolved a critical type mismatch where `grade_number` was sent as a string instead of an integer, causing `400 Bad Request` errors during app creation. Fixed via Zod coercion in `AppsPage.tsx`.
- **E2E Reliability**: Hardened "Questions Management" tests by switching to keyboard-based navigation (`ArrowDown` + `Enter`) for Radix Select components, eliminating 401/Failed to fetch flakiness in headless environments.

## [2.2.4] - 2026-02-24

### Added

- **Governed AI Content Generation**: Implemented a dual-model generation pipeline (Gemini Flash/Pro) with automated validation, score findings, and distractor quality analysis in `governedGeneration.ts`.
- **AI Content Studio**: Interactive review grid for AI-synthesized curriculum, permitting real-time editing and direct injection into the pedagogy library.
- **E2E Safety Net**: Added `governedGeneration.test.ts` for unit verification of the governance layer and established a baseline for E2E infrastructure validation.

### Fixed

- **E2E Seeding Stability**: Patched `.env.test` to disable dummy local keys that were interfering with cloud database connectivity during Playwright cycles.
- **Project Hygiene**: Purged obsolete `contract-drift.test.ts` following the removal of the Student App codebase, resolving 1 stagnant CI failure.
- **CSP Integrity**: Verified and consolidated CSP meta tags to ensure Cloudflare Workers connectivity is preserved across all viewport types.

### Fixed

- **Layout Cleanup**: Removed redundant inline search and count bars in `AppsPage.tsx` and `SubjectsPage.tsx`, unifying them into a single high-density "Standalone Toolbar" card.
- **Selection Logic**: Restored missing `handleSelectAll` functionality and header checkbox in `DomainList.tsx`, bringing it into parity with other curriculum management lists.
- **Stabilization**: Resolved an additional 10+ lint and TSC warnings, including component name collisions and unused filter imports. Integrated automated count displays for all lists using the premium `tabular-nums` formatting.

## [2.2.2] - 2026-02-21

### Fixed

- **Lint Stabilization**: Resolved over 50 systemic lint and TSC errors across the Admin Panel. Fixed missing `visibleColumns` resolution, restored truncated imports (React hooks, Lucide icons, Zod), and addressed "implicit any" errors in array iterators.
- **UI Consistency**: Updated `AppCard` and `SubjectCard` to respect `visibleColumns` toggles, ensuring UI parity between Table and Card views on mobile.
- **UX**: Optimized drag-and-drop feedback in `DomainList`, `SkillList`, and `QuestionList` by implementing a `useLayoutEffect` + `ref` pattern for handle transforms, bypassing inline style linting without performance loss.
- **Type Safety**: Reinforced type safety in `AppsPage.tsx` and `SubjectsPage.tsx` by implementing explicit mapping and validation for bulk CSV imports.

## [2.2.1] - 2026-02-21

### Fixed

- **Error Monitoring**: Resolved inability to delete error logs by applying missing `DELETE` and `UPDATE` RLS policies for tenant/super admins.
- **Accessibility**: Fixed 12+ "discernible text" lint errors in `ErrorLogsPage.tsx` by adding `title` attributes to all buttons and inputs.

### Added

- **Error Monitoring**: Implemented high-performance server-side filtration and pagination for error logs.
- **Error Monitoring**: Debounced search functionality (500ms) with server-side `ilike` matching.
- **Error Monitoring**: URL-persisted state for status filters and pagination to enable deep-linking and improved browser navigation.
- **Testing**: Added comprehensive unit test suite for `useErrorLogs` hook covering pagination, searching, and deletion calls.

## [2.2.0] - 2026-02-21

### Security (Project HADES Hardening)

- **Rate Limiting**: Implemented production-grade `RateLimiter` with circuit breaker support and persisted state for all sensitive Edge Functions (F-05).
- **RLS isolation**: Fixed `jwt_is_tenant_admin` and hardened `approval_workflows` to prevent cross-tenant leaks (F-01, F-06).
- **CORS Hardening**: Replaced wildcard origins with strict whitelist validation across all AI and session endpoints (F-04).
- **Error Sanitization**: Implemented `withErrorSanitization` HOC to mask internal stack traces and disclose only safe error messages (F-09).
- **PII Redaction**: Added recursive object scrubbing to error breadcrumbs (Email, Password, Token redaction) (F-18).
- **Timing Protection**: Migrated webhook secret verification to constant-time `timingSafeEqual` to prevent side-channel leaks (F-14).
- **Input Sanitization**: Implemented prompt-level sanitizers for custom instructions and source text in AI generation pipelines (F-11, F-12).
- **Resource Limits**: Enforced client-side document size limits (10MB) to prevent browser memory exhaustion (F-17).
- **Auth Standardization**: Standardized role checks to use the `role` enum instead of the legacy `is_admin` boolean (F-13).

### Fixed

- **Sync Drift**: Resolved `mastery_level` naming discrepancy between Supabase RPCs and Flutter data models (F-02).
- **Cost Control**: Forced explicit failure on AI quota exhaustion instead of partial/silent failures (F-08).
- **CSP**: Tightened Content Security Policy by removing `unsafe-eval` from production headers (F-10).
- **Infra Fallbacks**: Removed hardcoded fallbacks to ensure deployment fails explicitly on missing environment variables (F-07).

## [2.1.0] - 2026-02-20

### Added

- **Workers AI**: New Cloudflare Workers project (workers/ — now in questerix-content-engine repo) with AI-powered question generation and content validation endpoints.
- **Workers AI**: Model routing — DeepSeek R1 32B for math, Llama 3.1 8B for general subjects, DeepSeek R1 for all validation.
- **Workers Email**: Critical alert email delivery via Cloudflare Email Workers with HTML templates.
- **Admin Panel**: Workers-first AI integration with automatic Supabase Edge Function fallback via `VITE_WORKERS_URL` env var.
- **Testing**: Workers test suite — 73 tests across 9 files covering shared modules, AI handlers, email handler, router, and regression guards (BUG-W1–W4).

### Changed

- **Code Hygiene**: Removed 50+ stale deploy logs, test outputs, and debug files from root, admin-panel, student-app, and workers directories.
- **Code Hygiene**: Archived .builder/ design docs to docs/archive/.
- **Code Hygiene**: Fixed Dart warning (unused `stack` catch variable in `main.dart`).

- **Admin Panel**: Improved responsive layout for 375px viewports across all curriculum management pages and forms.
- **Admin Panel**: Added global `overflow-x-hidden` and adaptive typography to prevent layout breakage on small screens.
- **Admin Panel**: Standardized padding and shadow behaviors on mobile for `LoginPage`, `DomainList`, `SkillList`, and `QuestionList`.
- **Admin Panel**: Cross-app transparency for Super Admins in Curriculum management. List views now display the associated Application name when viewing across all apps.
- **Admin Panel**: Enhanced deletion confirmation with precise application context for impacted items.
- **Testing**: Added tests/responsiveness.spec.ts for automated mobile/tablet/desktop responsiveness validation.
- **Testing**: Added tests/verify-icon-removal.spec.ts to enforce clean table UI and prevent regression of decorative icons.

### Fixed

- **Type Safety**: Fixed `sortBy` type indexing in `UserManagementPage` to eliminate `tsc` errors.
- **Type Safety**: Resolved `ReferenceError: Badge is not defined` in `DashboardPage.tsx` and `Loader2` in `SubjectsPage.tsx`.
- **Type Safety**: Hardened `handleImport` logic in `AppsPage.tsx` and `SubjectsPage.tsx` with explicit type casting and normalization.
- **Admin Panel**: Resolved domain deletion discrepancy where associated skills/questions were incorrectly reported due to multi-tenant overlap.
- **Admin Panel**: Fixed `usePaginatedSkills` and `usePaginatedQuestions` hooks to allow Super Admins to view all apps when the 'All Apps' filter is active.
- **Type Safety**: Fixed `no-explicit-any` violation in `skill-list.tsx` by replacing `any` with safe `unknown` error handling.
- **Project HADES**: Completed Phase 3 (The Anatomy) Architecture Audit - Architecture Drift & Multi-tenant Visibility.
- **UI**: Removed redundant decorative icons (Layout, GraduationCap, Globe) from admin panel tables to reduce visual noise.
- **Admin**: Fixed domain deletion bug where Super Admins could not delete domains if they differed from the current app context.
- **Admin Panel**: Resolved 403 Forbidden error on Subject creation/deletion for administrators.
- **Admin Panel**: Hardened error tracking by filtering `ResizeObserver` and `AbortError` noise.
- **Admin Panel**: Applications now normalized to lowercase on save to prevent DNS mismatch.
- **Student App**: Fixed `int.parse` crash on hex primary colors and enabled case-insensitive subdomain matching.
- **Student App**: Hardened `pull_changes` and `submit_attempt` RPCs against schema drift.
- **UI**: Standardized all content forms with integrated `isPending` loading states.
- **UX**: Simplified table rows for high-density curriculum management.
- **Testing**: Resolved 7 critical failures in the Admin Panel test suite (Vite/Vitest).
- **Testing**: Fixed race conditions in `useBulkImport` progress tracking using fake timers.
- **Testing**: Corrected Zod validation expectations and UUID format tests.
- **Testing**: Refactored illegal `await import` calls in unit tests to standard top-level imports.
- **Testing**: Stabilized `data-utils` tests by switching to `globalThis` spying for URL APIs and expanded coverage to 100% with pure unit testing strategies.
- **Backend**: Refactored Supabase Edge Functions to use handlers and guarded server loops for unit test compatibility.
- **Student App**: Refactored `LoginScreen` and `RegisterScreen` to use a centralized `AuthController` and `AsyncValue` pattern for robust state management.
- **Student App**: Migrated `AppConfigService` to `AsyncValue`, providing consistent loading, success, and error states for multi-tenant bootstrapping.
- **Student App**: Improved initialization UI in `app.dart` with a themed splash experience and "Try Again" error handling for tenant configuration failures.
- **Student App**: Resolved the "Login Trap" where users were sometimes unable to navigate away from the login screen despite successful authentication.
- **Student App**: Fixed multiple unit and widget tests affected by the `AsyncValue` refactor.
- **Scripts**: Fixed a path resolution bug in `run-student-web.ps1` that prevented the app from launching correctly from the root directory.

## [2.0.2] - 2026-02-16

### Added

- **Orchestration**: Added `-SkipTesting` and `-SkipBuild` flags to `orchestrator.ps1` for flexible deployment pipelines.

### Fixed

- **Deployment**: Stabilized `deploy-all.ps1` by switching to sequential execution, ensuring environment variable inheritance for Cloudflare credentials.
- **Deployment**: Sanitized all PowerShell scripts to be ASCII-only, eliminating "Unexpected token" syntax errors caused by encoding drift of emojis/box-drawing characters.
- **Deployment**: Hardened Cloudflare authentication by detecting and clearing `REPLACE_ME` placeholders in `.secrets`, allowing fallback to local Wrangler sessions.
- **Testing**: Resolved `ResizeObserver` and `matchMedia` definition errors in `jsdom` by implementing a global `vitest.setup.ts`.
- **Testing**: Updated `useToast` unit tests to align with the production `TOAST_LIMIT` of 3.
- **Infrastructure**: Fixed path resolution in `generate-env.ps1` to handle absolute paths for configuration and secrets.

### Changed

- **Governance**: Updated `docs/LEARNING_LOG.md` and `tasks.md` to reflect the shift from "Assumed 100% Coverage" to "Verified Stabilization."

## [2.0.1] - 2026-02-14

### Added

- **Super Admin Cross-Tenant Access**: Complete platform-wide visibility for super admin role
  - Cross-tenant data access across domains, skills, and questions
  - App filtering UI in curriculum management pages
  - Dashboard view toggle ("Current App" vs "All Apps")
  - User management with cross-tenant visibility
  - Database RLS policies with JWT helper functions
- **Database Migration**: `20260214210000_super_admin_jwt_claims.sql`
  - JWT helper functions: `jwt_is_admin()`, `jwt_is_super_admin()`, `jwt_is_mentor()`
  - Database-backed role verification for enhanced security
- **AppContext Enhancements**: Added `userRole` and `isSuperAdmin` properties
- **UI Components**: Super admin controls and role-based feature visibility

### Fixed

- **Type Safety**: Eliminated all explicit 'any' types across test suite (40+ instances)
  - `use-bulk-import.test.tsx`: Replaced 'any' with `QueuedQuestion` interfaces
  - `file-parsers.test.tsx`: Fixed PDF.js and FileReader types
  - `data-utils.test.tsx`: Fixed Blob and FileReader event handlers
  - `governedGeneration.test.ts`: Fixed Supabase return types
  - `sanitize.test.ts`: Removed unnecessary type assertions
  - `import-schema.test.ts`: Fixed discriminated union types
- **Accessibility**: Achieved WCAG 2 AA compliance across all pages
  - Fixed color contrast violations (5 components)
  - Added aria-labels to icon-only buttons (2 components)
  - All accessibility tests now passing (5/5)
- **Build**: Fixed TypeScript compilation errors
  - Restored database.types.ts
  - Fixed dependency cruiser configuration
- **Lint**: Replaced explicit 'any' types with proper database types

### Changed

- Cleaned up tasks.md organization
- Enhanced documentation for GitHub Codespaces workflow

### Documentation

- Added comprehensive Codespaces setup guide
- Documented accessibility testing procedures
- Created documentation best practices guide

## [0.9.0] - 2026-02-10

### Added

- **AI Pipeline**: Completed the end-to-end AI content generation workflow.
- **RPC**: `import_questions_bulk` for transactional batch imports.
- **UI**: New `BulkImportPage` wizard.

### Verification

- **Quality**: 100% Pass on Code Quality Audit (Phase 18).
- **Security**: Passed Supabase Advisor Audit (Phase 19).
