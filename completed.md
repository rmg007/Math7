# Questerix — Completed Tasks

## March 2026 Sprints

- [x] **Student App UI Polish & Resilience**
  - [x] Integrate branded loaders (`QuesterixLoading`) across all screens.
    - [x] `OnboardingScreen` (Auth flows)
    - [x] `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen`
    - [x] `MainShell` (Sync badge)
    - [x] `DomainsScreen`, `SkillsScreen` (Data fetching)
    - [x] `PracticeScreen` (Loading questions)
    - [x] `ProgressScreen` (Stats fetching)
    - [x] `SettingsScreen` (Connection checks & Join class)
  - [x] Enhanced Error Tracking (`errorTracker.captureException`)
    - [x] `OnboardingScreen` (Registration & Parent Approval)
    - [x] `PracticeScreen` (Session management & Scoring)
  - [x] Haptic Feedback integration in `PracticeScreen`.
  - [x] Multi-tenant English-only audit (Enforced via system prompt).

- [x] **Deployment Pipeline Maturity & Hardening (Master Task)**
  - [x] **Subdomain Verification: fmath.questerix.com**
  - [x] **[TRACK G] Deployment Safety (Gate-then-Promote Architecture)**
    - [x] **Preview Deploy Implementation**: [x] Modified `scripts/deploy/deploy-all.ps1`.
    - [x] **Gated Validation**: [x] Integrated `smoke-gate.ps1`.
    - [x] **Production Promotion**: [x] Implemented in `orchestrator.ps1`.

  - [x] **[TRACK H] Security & Credential Hygiene (SSoT Hardening)**
    - [x] **Auth Code Refactor**:
      - [x] Search and replace hardcoded credentials in `admin-panel/tests/global-setup.ts`.
      - [x] Ensure `setup-test-users.js` and `provision_test_user.py` use `.secrets` exclusively.
    - [x] **Secret Audit Implementation**:
      - [x] Review `hardcoded-secrets.log` (findings from `code-hygiene-scan.ps1`).
      - [x] Systematic migration: Move keys to `.secrets` → Map to `VITE_` in `master-config.json` → Update source code.
    - [x] **Success Criteria**: No plaintext passwords or keys in any checked-in file in `admin-panel/` or `scripts/`.

  - [x] **[TRACK I] Infrastructure & Resilience Hardening**
    - [x] **JWT Session Stability**:
      - [x] Update Supabase Dashboard settings (manual or via API) to set `JWT_EXPIRY` to 7200s (2h).
      - [x] Documentation update: Record this requirement in `MACHINE_BRIEFING.md`.
    - [x] **Log Lifecycle Management**:
      - [x] Add auto-cleanup logic to `orchestrator.ps1` Phase 5: `Remove-Item` for any file in `questerix-cortex/outputs/logs/` older than 7 days.
    - [x] **Structured Reporting**:
      - [x] Enhance `DEPLOY_LOG.md` template with markdown tables showing parallel job durations (e.g., `Admin Unit: 42s`, `Typecheck: 12s`).
    - [x] **Success Criteria**: Zero "Session Expired" flakiness in long test runs and 100% automated log rotation.

  - [x] **[TRACK J] Markdown, Text, and Log File SSoT Cleanup (Master Task)**
    - [x] **Step 1: Gitignore & Prevention**
      - [x] Update root `.gitignore` with catch-all patterns.
      - [x] Delete all stray tracked `*.txt`, `*.log`, and diagnostic files.
    - [x] **Step 2: Root Documentation Consolidation**
      - [x] Relocate `PLATFORM_MAP.md`, `CLAUDE_HANDOFF.md`, `CODESPACES.md`.
      - [x] Ensure `plan.md` remains in root.
    - [x] **Step 3: Co-located Documentation Migration**
      - [x] Migrate `FEATURE_GUIDE.md` to TSDoc in `index.ts`.
      - [x] Delete standalone source `.md` files.
    - [x] **Step 4: Subtree Cleanup & ADR Creation**
      - [x] Triage and migrate `admin-panel/docs/` to root `docs/` or archive.
      - [x] Create `docs/decisions/` and initialize `ADR-001`.
      - [x] Consolidate `admin-panel/tests/*.md` into `docs/quality/testing-strategy.md`.
    - [x] **Step 5: Final Purge & Verification**
    - [x] **Success Criteria**: Zero non-allowed `.md`, `.txt`, or `.log` files exist outside of `docs/` and `questerix-cortex/`.

  - [x] **[TRACK K] Automated Runtime Cleanup (Post-Success Finalization)**
    - [x] **Orchestrator Integration**:
      - [x] Add a `Cleanup-RuntimeArtifacts` function to `orchestrator.ps1`.
      - [x] Trigger deletion of `tasks.json`, `tasks.status.json`, and any root `*.tmp` files ONLY on `SUCCESS`.
    - [x] **Command Hygiene**:
      - [x] Implement a check to ensure `ops_runner.py` cleanup does not delete necessary logs.
    - [x] **Context Management**:
      - [x] Create `.antigravityignore` with togglable `questerix-student-app/` to prevent context noise.
    - [x] **Success Criteria**: Root directory is automatically cleared of all "agent-transient" files after a green deployment.

- [x] Brainstorming and Planning session with the User.

### [Completed on 2026-03-09]

- [x] **Test Suite Refresh & Deployment**
  - [x] Update all post-deployment tests to reflect the current API mocking strategy and route list.
  - [x] Run full test suite to guarantee green execution.
  - [x] Commit everything and deploy to Cloudflare via orchestrator.ps1.

### [Completed on 2026-03-12]

- [x] **Platform Integrity & Performance Optimization**
  - [x] **PARITY-001**: Audit and reconcile field name discrepancies between Student App and Admin Panel Types. (Renamed 'answered'->'response', 'points_earned'->'score_awarded', added 'user_activity', 'user_metadata', etc to schema_master.sql, fixed 'CurriculumStatus' filter).
  - [x] **PARITY-002**: Align 'Blind' Tables (user_activity, curriculum_meta, etc.) with Admin Panel understanding. (Added definitions to schema_master.sql).
  - [x] **PARITY-003**: Documented identified Feature Flags in 'docs/FEATURE_FLAGS.md'.
  - [x] **HARDEN-001**: Run Full Verification Suite for Admin Panel (Lint + TS + Tests)
  - [x] **HARDEN-002**: Run Full Verification Suite for Student App (100% pass rate on 319+ tests).
  - [x] **HARDEN-003**: Perform RLS Governance Audit for all new tables (user_activity, user_metadata, purchases).
  - [x] **DEPLOY-001**: Pre-deployment Smoke Test for Mentorship Views in Production Staging (Fixed 54 tests).
  - [x] **DEPLOY-002**: Unified Deployment via 'orchestrator.ps1' (Admin + Student).
  - [x] **SEC-AUDIT-001**: Check for hardcoded secrets or sensitive logs in both apps.
  - [x] **PERF-AUDIT-001**: Optimize data fetching / skeleton UI in Student Details Page. (Parallelized profile/metadata fetch, memoized metacognition calculations, and O(1) heatmap lookup optimization).
  - [x] **SEC-AUDIT-002**: Review RLS policies for missing 'deleted_at' filters. (Hardened 9 tables with explicit tombstone filtering for non-admins).
- [x] **REL-03: SQL Security Hardening**: Applied `SET search_path = public, pg_temp;` to all `SECURITY DEFINER` functions in `supabase/migrations/` to prevent search_path hijacking.
- [x] **VUL-003: Edge Function Security**: Resolved service role leaks and ensured secure `supabaseClient` initialization in all 5 core edge functions.
- [x] **RLS-AUDIT-2026: Database Access Control**: Performed a full RLS audit, hardened policies for 4 admin-managed tables, and verified zero gaps using the `audit-rls.sql` tool.
- [x] **Session Initialization**: Cleanup of `tasks.md` and establishment of the Hardening Master List.
