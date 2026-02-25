# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🧠 Phase 4: Cortex v2 — Real-Time MCP Intelligence

> **Gate**: Phase 2 deployed ✅. See `plan.md` for full architecture.
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
