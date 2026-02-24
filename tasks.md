# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🧪 Phase 1: Verification & Commit (Loki Cycle)

> **Goal**: Reason, Act, Reflect, and Verify the recent UI fixes (Rich Text Editor, Symbol Matrix clipping, etc.) and commit to main.

### 1.1 Smoke Layer — Run First (~5 min)

- [x] **Auth Flow E2E**: `npx playwright test tests/auth-flow.e2e.spec.ts --project=desktop`
- [x] **RBAC Guards E2E**: `npx playwright test tests/rbac-guards.e2e.spec.ts --project=desktop`
- [x] **Curriculum Lifecycle E2E**: `npx playwright test tests/curriculum-lifecycle.e2e.spec.ts --project=desktop`

### 1.2 Feature-Specific Tests — Targeted Areas

- [x] **Rich Text Editor**: Interaction test — verify toolbar doesn't clip, floating menus are visible.
- [x] **UI Clipping / Overflow**: Viewport tests at 375px (mobile) — verify Symbol Matrix popup is not cut off.
- [x] **AI Question Studio**: Governed generation flow implemented and verified (dual-model AI).
- [x] **RLS Regression**: Verified via `regression.test.tsx` (Single Entity Fetch Independence).
- [x] **CSP Header regression**: Verified via `infrastructure.spec.ts` (Connect-src allows workers).
- [x] **Purged Student App Drift**: Removed obsolete `contract-drift.test.ts` following student app removal.
- [x] **App Creation Fix**: Resolved `grade_number` type mismatch and improved subdomain normalization.
- [x] **E2E Stability**: Improved Radix Select reliability in MCQ creation and updated Apps CRUD for AlertDialog handling.
- [x] **Accessibility (Axe-core)**: Resolved critical and serious WCAG violations on Dashboard, Domains, Questions, and Bulk Import pages. Fixed `aria-allowed-attr` (SortableHeader) and `color-contrast` (bg-teal-700, gray-500).
- [x] **Update CHANGELOG.md**: Bump to v2.2.6.

### 1.3 Full Suite — After Smoke Passes

- [x] **Full Playwright suite**: `npx playwright test` (all projects: chromium, mobile, tablet)
- [x] **Full Vitest unit suite**: `npm run test -- --run --coverage`
- [x] **Coverage report**: Open `coverage/index.html` — confirm no critical paths uncovered

### 1.4 Pre-Deploy Certification

- [x] **Run certify Phase 0 (automated evidence)**: `powershell .\scripts\certify-evidence.ps1`
- [x] **DB Integrity check**: Confirm RLS live test passes (two-tenant cross-access)
- [x] **Code hygiene scan**: `powershell .\scripts\code-hygiene-scan.ps1` — confirm 0 forbidden patterns
- [x] **Bundle size check**: `npm run build` → verify `dist/` size is acceptable (< 500KB increase)
- [x] **Chaos check**: Rapid-fire clicks on submit, invalid input injection, offline simulation — verify graceful handling

---

## 🚀 Phase 2: Deploy to Cloudflare Pages (Delegated to Cortex)

> **Gate**: All Phase 1 tests must be green. This phase is now automated via `questerix-cortex/run.ts` (Deploy Tier).

- [x] **Confirm `wrangler.toml`** scoping (Cortex check)
- [ ] **Automated Release**: Run `npm run health` in `questerix-cortex/`
  - [ ] **Build admin panel**: `npm run build` (Injected into Release Tier)
  - [ ] **Deploy to Cloudflare Pages**: `npx wrangler pages deploy` (Injected into Deploy Tier)
  - [ ] **Deploy edge functions**: `supabase functions deploy` (Injected into Deploy Tier)
- [ ] **Verify production deployment**: Post-deploy health check on live URL
- [ ] **Verify CSP/RBAC live**: Cortex smoke verification against production endpoint

---

## 📦 Phase 3: Push to GitHub (Delegated to Cortex)

> **Gate**: Cloudflare deployment verified before pushing. Automated via `questerix-cortex/run.ts` (Ship Tier).

- [x] **Stage all changes**: `git add .` (Automated)
- [x] **Review diff**: `git diff --staged` (Automated integrity check)
- [ ] **Automated Push**: Run `npm run health` in `questerix-cortex/`
  - [ ] **Commit**: `git commit -m "feat: auto-ship via cortex"` (Injected into Ship Tier)
  - [ ] **Confirm CI passes**: GitHub Actions `ci.yml` trigger on push
  - [ ] **Tag release**: `git tag v<version>` + `git push --tags` (Conditional Ship sub-task)

---

## 🛠️ Phase 4: Questerix Cortex — Session Handover System

> **Goal**: A persistent intelligence layer in `questerix-cortex/` that manages project health, history, and AI-agent briefings.

- [x] **4.0 Architecture**: Final plan approved (`questerix-cortex/ARCHITECTURE.md`).
- [x] **4.1 Core Infrastructure**: Initialize `questerix-cortex/` with `package.json`, `tsconfig`, and `cortex.config.json`.
- [x] **4.2 Orchestrator & Live UI**: Implement the health runner + `localhost:5050` real-time progress dashboard.
- [x] **4.3 Semantic Scanner**: `ts-morph` mapper to identify unprotected logic and coverage gaps.
- [x] **4.4 Analyst Module**: Implement schema drift detection, dead code hunting, and migration safety audits.
- [x] **4.5 Intelligence Loop**: Generate the three outputs (`AGENT_CONTEXT`, `NEXT_TASK`, `HEALTH_REPORT`) with P0→P2 logic.
- [x] **4.6 Historian**: Trend tracking for health scores and coverage across sessions (last 30 runs).
- [x] **4.7 Control Plane**: Full delegation of Smoke, Deep, Intel, Release, Deploy, and Ship actions to the `localhost:5050` Dashboard.

---

## � Phase 5: Cortex Insight — Coverage & Technical Debt

> **P1 (High Priority)**: Address critical coverage gaps identified by the Cortex Analyst in the latest `HEALTH_REPORT.md` (Health Score: 0/100).

- [x] **Hook Hardening**: Vitest unit tests exist or created for:
  - `hooks/use-ai-generator.ts` ✅ (pre-existing)
  - `hooks/use-app.ts` ✅ (pre-existing)
  - `hooks/use-bulk-import.ts` ✅ (pre-existing)
  - `hooks/use-studio-generator.ts` ✅ (created this session)
- [x] **Core Page E2E**: Playwright smoke tests exist for:
  - `features/ai-assistant/pages/GenerationPage.tsx` → `ai-generation.e2e.spec.ts` ✅
  - `features/ai-content/pages/BulkImportPage.tsx` → `bulk-import.e2e.spec.ts` ✅
  - `features/auth/pages/LoginPage.tsx` → `auth-flow.e2e.spec.ts` ✅
- [ ] **Curriculum Module**: Close gaps in `domains-page.tsx` and `questions-page.tsx`.
- [x] **Cortex Scanner Fix**: 3-tier test detection added (sibling, `src/__tests__/`, Playwright `tests/`) — eliminates false-positive gap reports.
- [ ] **Refactor History**: Commit remaining uncommitted changes from `LAST_CHANGED.md`.

---

## �📋 Backlog (Deferred)

- [ ] **Auth Flow Integrity**: Invitation code logic and profile creation verification
  - [ ] E2E: valid invite code creates profile and redirects to dashboard
  - [ ] E2E: profile row exists in DB after successful signup
  - [ ] Unit: validate `invite_codes` RLS — used/expired codes rejected
- [ ] **Performance Audit**: Admin Panel data fetching + `SyncService` latency profiling
  - [ ] Instrument key `useQuery` hooks with `performance.mark` in dev
  - [ ] Benchmark P50/P95 load times for `/domains`, `/questions`, `/apps`
  - [ ] Set CI budget: warn if initial data fetch > 2s
- [ ] **Nightly Failure Reporting**: Auto-create GitHub Issue on nightly E2E regression failure
  - [ ] Add `on.schedule` cron job (`0 6 * * *`) to `.github/workflows/nightly.yml`
  - [ ] On failure: call `gh issue create` with test report, label `nightly-regression`
- [ ] **Health Dashboard**: `/admin/maintenance` route surfacing `error_logs` + smoke statuses
- [ ] **AI Multi-Model Fallback**: Auto-fallback to Llama 3 if DeepSeek R1 latency > 1s
