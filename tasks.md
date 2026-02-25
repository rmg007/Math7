# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🚀 Phase 2: Deploy to Cloudflare Pages (Delegated to Cortex)

> **Gate**: All Phase 1 tests must be green. ✅ Gate OPEN.
> Automated via `questerix-cortex/run.ts` (Release → Deploy Tiers).

- [ ] **Commit uncommitted changes**: ~40 modified files pending (see LAST_CHANGED.md)
- [ ] **Automated Release**: Run `npm run health -- release` in `questerix-cortex/`
  - [ ] **Build admin panel**: `npm run build` (Release Tier)
  - [ ] **Certify evidence**: `certify-evidence.ps1` (Release Tier)
- [ ] **Deploy**: Run `npm run health -- deploy` in `questerix-cortex/`
  - [ ] **Deploy to Cloudflare Pages**: `npx wrangler pages deploy` (Deploy Tier)
  - [ ] **Deploy edge functions**: `supabase functions deploy` (Deploy Tier)
- [ ] **Verify production deployment**: Post-deploy health check on live URL
- [ ] **Verify CSP/RBAC live**: Cortex smoke verification against production endpoint

---

## 📦 Phase 3: Push to GitHub (Delegated to Cortex)

> **Gate**: Cloudflare deployment verified before pushing.
> Automated via `questerix-cortex/run.ts` (Ship Tier).

- [ ] **Automated Push**: Run `npm run health -- ship` in `questerix-cortex/`
  - [ ] **Commit**: `git commit -m "feat: auto-ship via cortex"` (Ship Tier)
  - [ ] **Confirm CI passes**: GitHub Actions `ci.yml` trigger on push
  - [ ] **Tag release**: `git tag v<version>` + `git push --tags` (Conditional)

---

## 🧠 Phase 4: Cortex v2 — Real-Time MCP Intelligence

> **Gate**: Phase 2 deployed. See `plan.md` for full architecture.
> **Status**: Planning complete. Ready for Session 1.

- [ ] **Session 1**: SQLite schema (`cortex.db`) + Scanner writes `nodes`/`edges` to DB (~2h)
- [ ] **Session 2**: MCP server with `cortex_impact` and `cortex_query` tools (~3h)
- [ ] **Session 3**: `cortex_fragility` — Historian tracks file-level outcomes + attribution (~2h)
- [ ] **Session 4**: `cortex_plan` + `cortex_verify` — targeted verification + compliance (~3h)
- [ ] **Session 5**: Wire into agent rules (GEMINI.md, AGENTS.md) + compliance reporting (~1h)

---

## Backlog (Deferred)

- [ ] **Latency CI Budget**: Set CI budget — warn if initial data fetch > 2s (requires `LATENCY_METRICS.json` baseline)
- [ ] **Nightly Failure Reporting**: Auto-create GitHub Issue on nightly E2E regression failure
  - [ ] Add `on.schedule` cron job (`0 6 * * *`) to `.github/workflows/nightly.yml`
  - [ ] On failure: call `gh issue create` with test report, label `nightly-regression`
- [ ] **Health Dashboard**: `/admin/maintenance` route surfacing `error_logs` + smoke statuses
- [ ] **AI Multi-Model Fallback**: Auto-fallback to Llama 3 if DeepSeek R1 latency > 1s
- [ ] **Type Safety Gaps**: Resolve 16 remaining type safety gaps flagged by Cortex Analyst
