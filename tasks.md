# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🚀 Phase 15: Launch Readiness & Operational Excellence (ACTIVE)

> **Objective**: Move from "it works in tests" to "it's ready for users." Focus on performance, accessibility, and high-fidelity user journeys.

### Step 1: High-Fidelity UAT Automation (P0)

Based on `TEST_PLAN.md` critical journeys:

- [ ] **AP-RBAC Guard Sweep**: Implement `tests/rbac-guards.e2e.spec.ts` to verify that direct URL access to super-admin routes (`/apps`, `/governance`, `/users`) redirects correctly for `admin` and `student` roles.
- [ ] **Curriculum Lifecycle E2E**: Verify the full path: Create Domain → Create Skill → Create 5 Question Types → Publish → Verify Version History. Currently, these exist as fragmented tests; we need one cohesive "Curriculum Happy Path" spec.
- [ ] **Student Account Journey**: Verify Invitation Code → Sign Up → Onboarding → First Practice Session → Progress Sync. This is the "First 5 Minutes" of the user experience.

### Step 2: Performance & Accessibility (P1)

- [ ] **SQLCipher Performance Audit**: Profile the encrypted Student App DB on a low-end emulator. Measure latency for `open`, `sync` (100+ items), and `search`. Document findings in `LEARNING_LOG.md`.
- [ ] **Accessibility (WCAG 2.1 AA) Audit**: Run a Playwright `axe-core` sweep across all 5 main Admin Panel pages and the Student App's core screens. Focus on color contrast, screen reader labels, and keyboard focus traps.
- [ ] **Responsive Visual Sweep**: Audit the "Premium UI" components (`BulkActionBar`, `ColumnToggle`) on narrow mobile viewports. Ensure no overlapping elements or broken touch targets.

### Step 3: Observability & Support (P2)

- [ ] **Health Dashboard (Admin)**: Create a simple, read-only "System Health" view in the Admin Panel (Maintenance segment) that surfaces recent `error_logs`, `ai_token_usage` trends, and the status of the 5 production endpoints from `smoke-test.sh`.
- [ ] **Nightly E2E Workflow**: Wire the 18+ regression tests into a nightly GitHub Action cron job. Configure it to post failures to a GitHub Issue (similar to secret-rotation).
- [ ] **Landing Page SEO Hardening**: Add missing meta tags, OG images, and structured data (JSON-LD) to the student app's web landing page to prepare for indexing.

---

## 📋 Backlog (Future Phases)

- [ ] **Student App App Store Content**: Prepare screenshots, description, and privacy manifest for Apple/Google submission.
- [ ] **Advanced Analytics**: Integration of PostHog or similar for non-PII behavioral tracking.
- [ ] **AI Multi-Model fallback**: Automated fallback to Llama 3 if DeepSeek R1 latencies exceed 1s.
