# Changelog

All notable changes to the Questerix project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Beta Prep**: Content Security Policy (CSP) and `robots.txt` for security hardening.
- **Admin Panel**: Bulk Import feature for Questions (CSV support).
- **Admin Panel**: "Feedback" button in sidebar for direct support access.
- **Admin Panel**: Premium High-Performance Dashboard with real-time stats and Recharts integration.
- **Hardening**: Bulk Import module stabilization (type-safety, dry-run support, and PapaParse integration).
- **Hardening**: Duplicate prevention for Bulk Import via `content_hash` matching.
- **Hardening**: Self-Healing Error Boundary with Project Oracle (AI) integration.
- **Admin Panel**: AI-powered "Import from Prompt" capability for unstructured curriculum sync.
- **Observability**: RPC hardening and transactional batch logging for bulk operations.
- **Architecture**: Implemented "One Brain, One Repo" unification, consolidating all documentation and pruning redundant logs.
- **Auth**: Role-based redirection logic added to prevent access loops for non-super-admins.
- **UI**: Standardized `EmptyState` components across all management features for premium consistency.
- **UI**: Implemented conditional sidebar navigation groups based on user role visibility.
- **UX**: Added loading indicators with animated spinners to async buttons in Invitation Codes page (GENERATE CODE and Deactivate Selected buttons).
- **UX**: Verified Template and Upload buttons in Domain Registry DataToolbar component are fully functional with proper error handling.

### Fixed

- **Testing**: Resolved 7 critical failures in the Admin Panel test suite (Vite/Vitest).
- **Testing**: Fixed race conditions in `useBulkImport` progress tracking using fake timers.
- **Testing**: Corrected Zod validation expectations and UUID format tests.
- **Testing**: Refactored illegal `await import` calls in unit tests to standard top-level imports.
- **Testing**: Stabilized `data-utils` tests by switching to `globalThis` spying for URL APIs and expanded coverage to 100% with pure unit testing strategies.
- **Backend**: Refactored Supabase Edge Functions to use handlers and guarded server loops for unit test compatibility.

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
