# 🚨 Questerix Remediation Plan: "Zero False Promises"

**Status**: Urgent  
**Objective**: Fix the gap between the *documented* architecture and the *actual* codebase state.  
**Philosophy**: "If it's not in the code, it doesn't exist."

---

## 🛑 Critical Defect 1: The "Phantom" Security System
**The Issue**: The database has a sophisticated `security_logs` table and `log_security_event` RPC, but the **Frontend never calls it**. It is currently "Security Theater."
**Remediation (Phase 3)**:
1.  **Admin Panel**: Create `src/services/SecurityLogger.ts`.
    *   Auto-log `login`, `logout`, `schema_change`, `export_data`.
    *   Hook into the global `supabase` client for `onAuthStateChange`.
2.  **Student App**: Create `lib/src/core/services/security_service.dart`.
    *   Auto-log `login`, `suspicious_activity` (rapid clicks).
3.  **Verification**: Prove it by logging in and querying the `security_logs` table in SQL.

## 🏚️ Critical Defect 2: The "Hollow" Snapshot System
**The Issue**: The `curriculum_snapshots` table only stores *counts* (e.g., "5 questions"). It does not verify *what* those questions were. Rollback is impossible.
**Remediation (Phase 2)**:
1.  **Schema Change**: `ALTER TABLE curriculum_snapshots ADD COLUMN content JSONB;`
2.  **RPC Update**: Update `publish_curriculum` to:
    *   Fetch all *published* Domains/Skills/Questions.
    *   Serialize them into a single JSON blob.
    *   Store in `content`.
3.  **Rollback Logic**: Create `rollback_curriculum(version_id)` RPC that parses this JSON and upserts it back to the live tables.

## 🎭 Critical Defect 3: "Fake" Environment Configuration
**The Issue**: `main.dart` contains fallback logic for `'placeholder.supabase.co'`. This defeats the purpose of the build system. If the build system fails to inject variables, the app *should crash* in dev (to alert the dev) and *refuse to build* for prod.
**Remediation (Phase 3)**:
1.  **Strict Mode**: Delete the `try/catch` and fallback values in `student-app/lib/main.dart`.
2.  **Build Enforcement**: Update `generate-env.ps1` to fail if keys are missing in `master-config.json`.
3.  **Config**: Update `master-config.json` to explicitly handle `SENTRY_DSN` (mark as "disabled" if empty, don't just leave it blank/ambiguous).

## 📉 Critical Defect 4: Test Visibility
**The Issue**: Tests exist (`question_widgets_test.dart`) but coverage is low and scattered.
**Remediation (Phase 4)**:
1.  **Visual Matrix**: Create a `TEST_COVERAGE.md` that explicitly maps features to test files.
2.  **Gap Fill**: Add the missing `MultiTenant_Isolation_test.dart` to verify that App A cannot see App B's data.

---

## 📋 Execution Order (Phase 2 & 3)

### Step 1: Database Truth (Phase 2)
*   [ ] SQL: Add `content JSONB` to snapshots.
*   [ ] SQL: Update `publish_curriculum` to save data.

### Step 2: Code Truth (Phase 3 - Frontend)
*   [ ] Flutter: Remove placeholders from `main.dart`.
*   [ ] Admin: Implement `SecurityLogger.ts` and hook up to `AuthProvider`.
*   [ ] Flutter: Implement `SecurityService.dart` and hook up to `AppLifecycle`.

### Step 3: Deployment Truth (Phase 6 - Config)
*   [ ] Config: Audit `master-config.json` and remove ambiguous empty strings where strict types are needed.

**Awaiting Approval to begin Step 1 (Database Remediation).**
