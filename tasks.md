# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

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

- [ ] **Automated Push**: Run `npm run health` in `questerix-cortex/`
  - [ ] **Commit**: `git commit -m "feat: auto-ship via cortex"` (Injected into Ship Tier)
  - [ ] **Confirm CI passes**: GitHub Actions `ci.yml` trigger on push
  - [ ] **Tag release**: `git tag v<version>` + `git push --tags` (Conditional Ship sub-task)

---

## Phase 5: Cortex Insight — Coverage & Technical Debt

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
