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

## [0.9.0] - 2026-02-10

### Added

- **AI Pipeline**: Completed the end-to-end AI content generation workflow.
- **RPC**: `import_questions_bulk` for transactional batch imports.
- **UI**: New `BulkImportPage` wizard.

### Verification

- **Quality**: 100% Pass on Code Quality Audit (Phase 18).
- **Security**: Passed Supabase Advisor Audit (Phase 19).
