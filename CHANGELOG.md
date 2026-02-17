# Changelog

All notable changes to the Questerix project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Admin Panel**: Improved responsive layout for 375px viewports across all curriculum management pages and forms.
- **Admin Panel**: Added global `overflow-x-hidden` and adaptive typography to prevent layout breakage on small screens.
- **Admin Panel**: Standardized padding and shadow behaviors on mobile for `LoginPage`, `DomainList`, `SkillList`, and `QuestionList`.
- **Admin Panel**: Cross-app transparency for Super Admins in Curriculum management. List views now display the associated Application name when viewing across all apps.
- **Admin Panel**: Enhanced deletion confirmation with precise application context for impacted items.
- **Testing**: Added `tests/responsiveness.spec.ts` for automated mobile/tablet/desktop responsiveness validation.

### Fixed

- **Type Safety**: Fixed `sortBy` type indexing in `UserManagementPage` to eliminate `tsc` errors.
- **Admin Panel**: Resolved domain deletion discrepancy where associated skills/questions were incorrectly reported due to multi-tenant overlap.
- **Admin Panel**: Fixed `usePaginatedSkills` and `usePaginatedQuestions` hooks to allow Super Admins to view all apps when the 'All Apps' filter is active.
- **Type Safety**: Synchronized `QuestionListItem` and `DomainListItem` types with joined application metadata.
- **Project HADES**: Completed Phase 3 (The Anatomy) Architecture Audit - Architecture Drift & Multi-tenant Visibility.
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

- **Governance**: Updated `LEARNING_LOG.md` and `tasks.md` to reflect the shift from "Assumed 100% Coverage" to "Verified Stabilization."

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
