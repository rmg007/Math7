# Questerix Development Tasks

## 🛡️ TEST COVERAGE RECOVERY PLAN

### 🏗️ Phase 1: Unblock CI (Config + Edge Function Fixes)

- [x] **Step 1.1: Standardize Vitest Thresholds**
  - Remove coverage thresholds from `admin-panel/vitest.config.ts`.
  - Rely on CI gate (70%) as the single source of truth.
- [x] **Step 1.2: Content Engine Local Stability**
  - Add `pytest>=7.0.0` and `pytest-cov>=4.0.0` to `content-engine/requirements.txt`.
- [x] **Step 1.3: Fix Edge Function Tests**
  - Refactor `supabase/functions/*/index.ts` to use handlers.
  - Guard `Deno.serve` calls with `import.meta.main`.
- [x] **Step 1.4: Verification Checkpoint**
  - [x] Verify Admin Panel coverage generates `lcov.info`.
  - [x] Verify Content Engine hits 80% locally.
  - [x] Verify Edge Functions run without a local server.

### 🧪 Phase 2: Close Coverage Gaps

- [x] **Step 2.1: Admin Panel Feature Hooks**
  - [x] Test `use-domains.ts`, `use-questions.ts`, `use-skills.ts`, `use-publish.ts`, `use-apps.ts`.
- [x] **Step 2.2: Student App Auth Providers**
  - [x] Unit tests for `auth_provider.dart` and `SessionRepository`.
- [x] **Step 2.3: Admin Panel AI API Logic**
  - [x] Test `generateQuestions.ts`, `governedGeneration.ts`, `validate-content.ts`.

### 📝 Phase 3: Documentation & Hardening

- [x] **Update Documentation**
  - [x] Mark service/hooks/content-engine tasks as DONE.
  - [x] Correct `docs/reports/TEST_COVERAGE.md` matrix.
- [x] **[SECURITY] DAST Integration**
  - Configured OWASP ZAP via `dast.yml` GitHub Action.
- [x] **[PERF] Lighthouse CI**
  - Integrated LHCI via `lighthouse.yml` and `admin-panel-e2e.yml`.

---

## 🤖 CI AUTOMATION

- [x] **Dependabot**: npm, pip, GitHub Actions, Flutter/Pub ecosystems covered.
- [x] **Auto-Format**: `auto-format.yml` for consistent code style.
- [x] **Type Generation**: `type-generation.yml` for Supabase types.
- [x] **Platform Health Report**: `platform-health-report.yml` aggregates CI results on PRs.
- [x] **Self-Healing CI (v2)**: Signature-based deduplication + auto-close on green. Monitors all 35 workflows.
- [x] **Forensic Audit Script**: `scripts/ci-failure-audit.ps1` for bulk backlog sweep.
- [x] **CI Recovery Protocol**: `scripts/ci-recover.ps1` for mass-rerunning and unblocking CI.
- [x] **Tier 1 Auto-Fix**: `ci-auto-fix.yml` — headless auto-fixer for husky, lockfile, dart patterns.
- [x] **Make It Green Button**: `ci-recover-button.yml` — one-click mass rerun from GitHub UI.
- [ ] **GitHub Secrets**: Add Supabase + test user credentials to GitHub Settings.
- [x] **`gh auth login`**: Authenticate GitHub CLI for agent issue discovery and PR management.
- [ ] **CLI-First PRs**: Transition all PR lifecycle management (list, view, merge) to `gh` CLI.
