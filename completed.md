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
