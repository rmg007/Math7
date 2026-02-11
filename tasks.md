## 🛡️ HARDENING BACKLOG

### 🔴 High Priority (Institutional Integrity)
- [ ] **[TEST] Admin Panel Services**: Unit tests for `CurriculumService`, `OracleService`.
- [ ] **[TEST] Admin Panel Hooks/Utils**: Unit tests for `use-bulk-import`, `use-ai-generator`, `data-utils`, `file-parsers`.
- [ ] **[TEST] Content Engine**: Functional tests for `question_generator`, `document_parser`, `question_schema` with real inputs/outputs.
- [ ] **[TEST] Edge Functions**: Schema validation tests for `generate-questions` and `validate-content` with mocked AI responses.
- [ ] **[SECURITY] DAST Integration**: Configure OWASP ZAP (GitHub Action) for dynamic scanning of Admin & Edge endpoints.
- [ ] **[PERF] Lighthouse CI**: Integrate LHCI into GitHub Actions for performance/A11y/SEO auditing.

### 🟡 Medium Priority
- [ ] **[TEST] Student App**: Add tests for `progress/`, `home/`, `settings/` features, and `core/errors/`.
- [x] **[TEST] Student App MainShell**: Fixed widget tests, resolved pending timers and hit-test offset errors.
- [ ] **[TEST] E2E Restoration**: Fix and enable disabled tests (domain CRUD, logout, dashboard stats).
- [ ] **[GOVERNANCE] Coverage Gate**: Implement minimum threshold (50%) in CI for core modules.
- [x] **[CLEANUP] Remove Redundant Curriculum/Provider Files**: Delete files replaced by `core_providers.dart` and `curriculum_repositories.dart`.
- [x] **[AI] Address "Missing Temp" False Positives**: Align `generateContent` usage with forensic script pattern or update script.
- [x] **[SECURITY] Audit Edge Functions for Missing Temp**: Verify `temperature` in all `generateContent` calls.

## ✅ Recently Completed

- **[ARCH] Consolidate Curriculum Repositories**: Unified Local/Remote repos and providers.
- **[ARCH] Consolidate Core Providers**: Merged DB, Supabase, and Connectivity providers.
- **[TESTS] Fix Student App Widget Tests**: Verified all 78 tests passing in the Student App.
- **[TESTS] Student App MainShell**: Fixed failing widget tests, resolved pending timers (Drift/StreamBuilder), and corrected hit-test offset errors in responsive layouts.
- **[SECURITY] Sanitize Question Content**: Implemented `DOMPurify` sanitization for `dangerouslySetInnerHTML` in the Admin Panel.
- **[AUDIT] Verify Tenant Isolation (VUL-018)**: Hardened RLS policies for `profiles`, `apps`, and `subjects`. Fixed VUL-018 in `import_questions_bulk` RPC.

- **[AI] Content Generation Pipeline**: Implemented end-to-end document-to-curriculum pipeline with deterministic temperature and review grid.
- **[CLEANUP] Final Forensic Audit**: Executed All-Seeing Auditor Protocol, remediated debt warnings, and purged 25+ stale log/backup files.
- **[INFRA] Bulk Import Consistency**: Verified `import_questions_bulk` RPC with tenant isolation and batching support.
