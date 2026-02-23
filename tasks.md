# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🚀 Phase 15: Launch Readiness & Operational Excellence (ACTIVE)

> **Objective**: Move from "it works in tests" to "it's ready for users." Focus on performance, accessibility, and high-fidelity user journeys.

### Step 1: High-Fidelity UAT Automation (P0)

Based on `TEST_PLAN.md` critical journeys:

- [ ] **AP-RBAC Guard Sweep**: Implement `tests/rbac-guards.e2e.spec.ts`. Verify `/apps`, `/governance`, `/users`, and `/monitoring` (new) are blocked for non-super-admins.
- [ ] **Curriculum Lifecycle E2E**: Implement `tests/curriculum-journey.e2e.spec.ts`. Full path: Domain → Skill → Question → Publish → Verify Snapshot.
- [ ] **Student Account Journey**: Implement `tests/student-onboarding.e2e.spec.ts`. Verify Invitation Code → Auth → Profile → First Practice.

### Step 2: Performance & Accessibility (P1)

- [ ] **SQLCipher Performance Audit**: Profile encrypted Drift DB. Measure `SyncService` latency with 100+ items.
- [ ] **Accessibility (axe-core) Integration**: Update `ci.yml` or integration tests to use `@axe-core/playwright`. Audit: `QuestionForm`, `BulkImport`, `Settings`.
- [ ] **Responsive Visual Sweep**: verify `BulkActionBar` and `ColumnToggle` on mobile viewports (375px/390px).

### Step 3: Observability & Support (P2)

- [ ] **Health Dashboard (Admin)**: Implement `/admin/maintenance` route surfacing `error_logs` and `smoke-test` statuses.
- [ ] **Nightly Failure Reporting**: Update `.github/workflows/nightly-e2e.yml` (infra created) to create a GitHub Issue automatically when regressions fail.
- [ ] **Landing Page SEO Hardening**: Add JSON-LD and OG tags to Student App Landing Page.

---

## 📋 Backlog (Future Phases)

- [ ] **Student App App Store Content**: Prepare screenshots, description, and privacy manifest for Apple/Google submission.
- [ ] **Advanced Analytics**: Integration of PostHog or similar for non-PII behavioral tracking.
- [ ] **AI Multi-Model fallback**: Automated fallback to Llama 3 if DeepSeek R1 latencies exceed 1s.
