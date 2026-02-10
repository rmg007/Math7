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


## [0.9.0] - 2026-02-10
### Added
- **AI Pipeline**: Completed the end-to-end AI content generation workflow.
- **RPC**: `import_questions_bulk` for transactional batch imports.
- **UI**: New `BulkImportPage` wizard.

### Verification
- **Quality**: 100% Pass on Code Quality Audit (Phase 18).
- **Security**: Passed Supabase Advisor Audit (Phase 19).
