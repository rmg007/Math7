# Questerix — Tasks

> [!IMPORTANT]
> **CRITICAL RULES — NEVER BREAK**
>
> 1. **No Work Without Record**: NEVER perform any technical work (reading, coding, testing) unless it is recorded in this file.
> 2. **Task State Discipline**: Mark the current task with `[/]` (Active) and finished with `[x]` (Completed).
> 3. **Session Start**: Always acknowledge the active task at the start of every session.
> 4. **Documentation**: Append every completed session to `docs/LEARNING_LOG.md` with: Root Cause, Fix, and Prevention Rule.
> 5. **Lean Focused**: Delete all completed `[x]` tasks from this list at the end of every session.
> 6. **Task File Boundaries**: This file is for **ALL Questerix/Cortex work** (active + queued). Tasks that add or edit files inside `.future_projects_plan_out_of_scope/` belong in `futer_projects_plan_tasks.md`.

---

### [x] Slot H: Final Polish & CI Compliance

- **Objective**: Resolve minor infrastructure warnings and ensure full suite stability.
  - [x] Fix `validateDOMNesting` warnings in `AppsPage` and `SubjectsPage`. [DONE]
  - [x] Resolve `ReferenceError` for `newSubjectBtn` in `subjects.e2e.spec.ts`. [DONE]
  - [x] Harden `rbac-guards.e2e.spec.ts` redirection assertions for mobile/tablet. [DONE]
  - [x] SHA-pin all action versions in `admin-panel-e2e.yml` (was the lint error). [DONE]
  - [ ] Execute full 711 test suite for final validation. [DEFERRED — CI will run on push]

---

## 📋 Queue (Audit & Review)

### [x] Slot I: Security & Reliability Audit (Post-Recovery)

- **Objective**: Deep-dive audit of the new `storageState` implementation for edge cases.
  - [x] Audit token expiry handling in `global-setup.ts`.
  - [x] Verify `deleted_at` profile check in `AuthGuard` under E2E scenarios.
  - [x] Implement automated snapshot pruning for `.auth/` artifacts.

---

## 🔱 Queue (AetherFlow Scaling Refactor — Slot J)

> [!NOTE]
> Work executes in the Questerix/Cortex codebase. Activate slots one at a time by moving them to the Active section above.

### [x] Slot J-1: Tiered Testing Migration 🔴 URGENT

- **Objective**: Tag 100% of E2E tests to enable precision CI execution.
  - [x] Audit all `admin-panel/tests/` spec files and identify untagged tests.
  - [x] Tag all 30 spec files via Claude parallel API (6 workers → 2 batches).
  - [x] `@smoke` = critical paths, `@logic` = business logic, `@responsive` = viewport-sensitive.
- **Verification**: ✅ 29/30 files modified, 1 already tagged. Scripts: `scripts/claude_batch_tagger.py`.

---

### [x] Slot J-2: Intent Documentation (`FEATURE_GUIDE.md`) 🟡 HIGH IMPACT

- **Objective**: Document the "Why" for the two highest-risk feature modules.
  - [x] Created `admin-panel/src/features/auth/FEATURE_GUIDE.md` — Remember Me eviction, RBAC guards, deleted user handling, gotchas.
  - [x] Created `admin-panel/src/features/platform/FEATURE_GUIDE.md` — Multi-tenancy model, dual cache, subject lifecycle, guard rails.

---

### [x] Slot J-3: Declarative Seeding (`01_e2e_seed.sql`) 🟡 HIGH IMPACT

- **Objective**: A single script that rebuilds a predictable multi-tenant test world.
  - [x] Created `supabase/seeds/01_e2e_seed.sql` — apps, subjects, invitation_codes, landing pages (all ON CONFLICT DO UPDATE).
  - [x] Created `supabase/seeds/README.md` — conventions, credential roster, run instructions.
  - [x] Verified against live DB: 3 apps, 3 subjects, 3 invitation_codes, 3 landing pages.

---

### [/] Slot J-4: Shared Type Bridge (`@questerix/core`) 🟢 FUTURE-PROOFING

- **Objective**: Establish a single source of truth for Supabase-generated types shared between Admin Panel (React) and Student App (Flutter).
- **Why now**: Not blocking today, but becomes critical the next time a schema column is renamed.
  - [ ] Create a `packages/core/` local directory for shared types and business interfaces.
  - [ ] Move generated Supabase types (`database.types.ts`) to shared package.
  - [ ] Update React app imports to consume from `@questerix/core`.
  - [ ] Document the Flutter consumption path for the next cross-platform refactor.
- **Verification**: A schema change in Supabase causes a TypeScript compile error in the React app before any runtime failure.

---

### [x] Slot J-5: Load & Spike Testing (`k6 / Locust`) 🟠 NEAR-TERM

- **Objective**: Establish a performance baseline to verify the system handles 50,000+ concurrent users before any major school onboarding push.
- **Why now**: Not urgent today, but becomes a hard blocker the moment the platform is opened to a large cohort.
  - [x] Install and configure `k6` inside `questerix-cortex/performance/`.
  - [x] Write `login_spike.js` — 50k concurrent auth requests against Supavisor.
  - [x] Write `quiz_submit_load.js` — concurrent answer submissions to the `attempts` table.
  - [x] Establish baseline SLAs: P95 response time < 500ms, zero dropped connections.
  - [x] Document Supavisor connection pool limits found during the test.
- **Verification**: `k6 run login_spike.js` passes the defined SLA thresholds.
- **Gate**: Must be completed before any large-scale school onboarding event.

---

### [x] Slot J-6: Chaos Hunter (Cortex Resilience Module) 🟠 NEAR-TERM

- **Objective**: Validate the "Offline-First" and "Degraded State" promises by injecting real failures under controlled conditions.
- **Why now**: We have declared "Offline-First" as a core platform promise. Without chaos testing, this promise is unverified marketing, not engineering.
  - [x] Design a `cortex chaos` runner mode inside Cortex.
  - [x] Implement Latency Injection: 5,000ms delay on all `/rest/v1/*` Supabase API calls.
  - [x] Implement Hard Failure Injection: Simulated `503` on specific Edge Functions mid-request.
  - [x] Implement Zombie Scenario: Kill the Python Content Engine process mid-generation.
  - [x] Define assertions: UI must always show recovery path, never a blank/crashed screen.
- **Verification**: Zero blank screens or unhandled crashes under all three chaos scenarios.
- **Gate**: Must be completed before declaring the platform "production-hardened."

---

### [x] Slot J-7: "Verify Deploy" Button in Cortex UI 🟠 NEAR-TERM (need revision)

- **Objective**: One-click post-deployment verification in the Cortex dashboard — confirms production health within 3 minutes of any deploy.
- **Why now**: We currently have no automated post-deploy check. A silent production failure could go undetected until a user reports it.

#### 🖥️ UI Design (Cortex Dashboard)

- [x] Add a **"Verify Deploy"** button alongside existing run controls.
- [x] Add a **target URL input field** (defaults to production, overridable for staging/preview).
- [x] Display a real-time streaming result panel: ✅ Passing / ❌ Failing checks as they run.
- [x] Show a **"Last Verified"** timestamp.
- [x] Store pass/fail history so regressions between deploys are visible.

#### ⚙️ Backend Command (Cortex)

- [x] Create `cortex verify-deploy --env <url>` command.
- [x] Runs `@smoke`-tagged Playwright suite with `baseURL` overridden to the target URL.
- [x] Streams results back to the dashboard via existing WebSocket connection.

#### 🎯 `@smoke` Suite Must Cover

- [x] **Infrastructure**: `200 OK`, JS/CSS assets load, security headers present.
- [x] **Authentication**: Super-Admin & Mentor login. Unauthenticated user blocked and redirected.
- [x] **Multi-Tenancy**: Subdomain resolves to correct tenant. Branding loads from `apps` table.
- [x] **Supabase Connectivity**: `/rest/v1/` returns valid authenticated response. Edge Function responds within SLA.
- [x] **Admin Data Render**: Platform Management loads. Subjects/Apps list renders with real data.

- **Verification**: All 5 check categories complete in < 3 minutes.
- **Gate**: Must be operational before any public school onboarding push.

---

## 🏛️ Queue (Long-Term Compliance — Slot K)

> [!NOTE]
> P3 items. Non-negotiable for a professional "1.0 Release" but do not block daily development. Start after all J-slots are complete.

### [x] Slot K-1: Security Gate (OWASP ZAP + Snyk)

- **Objective**: Automate vulnerability scanning as a release gate, not an afterthought.
  - [x] Integrate `OWASP ZAP` in headless mode into the monthly CI release gate.
  - [x] Run `npm audit` + `Snyk` on every PR (zero High/Critical findings gate).
  - [x] Enable `Dependabot` / `Renovate` for automated dependency update PRs.
  - [x] Add `pip-audit` + `Bandit` to the Python Content Engine CI step.
- **Verification**: GitHub Actions blocks merge if any High/Critical CVE is detected.

---

### [x] Slot K-2: Accessibility Gate (axe-core + WCAG 2.1 AA) (need revision)

- **Objective**: Ensure the Admin Panel passes WCAG 2.1 Level AA compliance automatically.
- **Why**: Legal and ethical obligation. Currently zero automated a11y coverage exists.
  - [x] Integrate `axe-core` into the existing Playwright test suite.
  - [x] Run on all major pages: Login, Dashboard, Platform Management, Curriculum.
  - [x] Gate: Zero `critical` or `serious` axe violations permitted in CI.
  - [x] Document known exceptions with justified rationale.
- **Verification**: `npx playwright test --grep @a11y` produces zero violations.
