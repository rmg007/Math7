
## 🛡️ HARDENING BACKLOG

- [x] **[CLEANUP] Remove Redundant Curriculum/Provider Files**: Delete files replaced by `core_providers.dart` and `curriculum_repositories.dart`.
- [x] **[AI] Address "Missing Temp" False Positives**: Align `generateContent` usage with forensic script pattern or update script.
- [x] **[SECURITY] Audit Edge Functions for Missing Temp**: Verify `temperature` in all `generateContent` calls.

## ✅ Recently Completed

- **[ARCH] Consolidate Curriculum Repositories**: Unified Local/Remote repos and providers.
- **[ARCH] Consolidate Core Providers**: Merged DB, Supabase, and Connectivity providers.
- **[TESTS] Fix Student App Widget Tests**: Verified all 78 tests passing in the Student App.
- **[SECURITY] Sanitize Question Content**: Implemented `DOMPurify` sanitization for `dangerouslySetInnerHTML` in the Admin Panel.
- **[AUDIT] Verify Tenant Isolation (VUL-018)**: Hardened RLS policies for `profiles`, `apps`, and `subjects`. Fixed VUL-018 in `import_questions_bulk` RPC.

