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
- [ ] **[SECURITY] DAST Integration**
  - Configure OWASP ZAP (GitHub Action) for endpoint scanning.
- [ ] **[PERF] Lighthouse CI**
  - Integrate LHCI for performance/A11y/SEO auditing.
