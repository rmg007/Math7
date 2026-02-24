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

- [ ] **Full Playwright suite**: `npx playwright test` (all projects: chromium, mobile, tablet)
- [ ] **Full Vitest unit suite**: `npm run test -- --run --coverage`
- [ ] **Coverage report**: Open `coverage/index.html` — confirm no critical paths uncovered

### 1.4 Pre-Deploy Certification

- [ ] **Run certify Phase 0 (automated evidence)**: `powershell .\scripts\certify-evidence.ps1`
- [ ] **DB Integrity check**: Confirm RLS live test passes (two-tenant cross-access)
- [ ] **Code hygiene scan**: `powershell .\scripts\code-hygiene-scan.ps1` — confirm 0 forbidden patterns
- [ ] **Bundle size check**: `npm run build` → verify `dist/` size is acceptable (< 500KB increase)
- [ ] **Chaos check**: Rapid-fire clicks on submit, invalid input injection, offline simulation — verify graceful handling

---

## 🚀 Phase 2: Deploy to Cloudflare Pages

> **Gate**: All Phase 1 tests must be green before deploying.

- [ ] **Confirm `wrangler.toml`** is scoped to the correct Cloudflare Pages project (`questerix-admin` or equivalent)
- [ ] **Build admin panel**: `npm run build` in `admin-panel/`
- [ ] **Deploy to Cloudflare Pages**: `npx wrangler pages deploy dist/ --project-name questerix-admin`
- [ ] **Verify production deployment**: Open production URL — confirm auth, RBAC, and AI generation work end-to-end
- [ ] **Check CSP headers live**: Inspect network tab in production — confirm `connect-src` allows Cloudflare Workers domain
- [ ] **Deploy edge functions (if changed)**: `supabase functions deploy` for any updated workers

---

## 📦 Phase 3: Push to GitHub

> **Gate**: Cloudflare deployment verified before pushing.

- [ ] **Stage all changes**: `git add .`
- [ ] **Review diff**: `git diff --staged` — confirm no debug code, no test UUIDs, no `.env` leaks
- [ ] **Commit**: `git commit -m "feat: <summary of changes>"`
- [ ] **Confirm CI passes**: Check GitHub Actions — `ci.yml` must be green (lint, unit tests, E2E smoke)
- [ ] **Tag release (if applicable)**: `git tag v<version>` + `git push --tags`

---

## 🛠️ Phase 4: Questerix Sentinel — QA Engine & Live Dashboard

> **Goal**: A standalone `questerix-qa/` utility that semantically maps the codebase, generates risk-weighted test cases, runs the full test suite with live browser progress, and outputs a premium health report.

- [x] **4.0 Architecture**: Plan approved (`questerix-qa/ARCHITECTURE.md`).
- [ ] **4.1 Infrastructure**: Initialize `questerix-qa/` as a standalone Node.js/TypeScript project (package.json, tsconfig).
- [ ] **4.2 Semantic Scanner**: `ts-morph`-powered walker — maps Pages, Hooks, Services and their test coverage status → `SURFACE_MAP.json`.
- [ ] **4.3 Risk-Weighted Factory**: Reads Surface Map, identifies logic gaps, generates prioritized `TEST_PLAN.md` (P0 mutations, P1 auth paths, P2 utilities).
- [ ] **4.4 Unified Orchestrator**: Single command runs Vitest → Playwright (all viewports) → ESLint → RLS audit in sequence.
- [ ] **4.5 Live Browser Dashboard**: Local server opens `http://localhost:5050` automatically — real-time progress as suites run, no terminal watching needed.
- [ ] **4.6 Premium Reporter**: Outputs `HEALTH_REPORT.md` — Health Score, Coverage Heat Map, Failure Digest, and pre-written AI Agent Action Items.

---

## 📋 Backlog (Deferred)

- [ ] **Auth Flow Integrity**: Invitation code logic and profile creation verification
- [ ] **Performance Audit**: Admin Panel data fetching + `SyncService` latency profiling
- [ ] **Health Dashboard**: `/admin/maintenance` route surfacing `error_logs` + smoke statuses
- [ ] **Nightly Failure Reporting**: Auto-create GitHub Issue on nightly E2E regression failure
- [ ] **AI Multi-Model Fallback**: Auto-fallback to Llama 3 if DeepSeek R1 latency > 1s
