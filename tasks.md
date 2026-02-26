# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.
>
> **Task update rule**: Always update this file at the end of every session. Mark completed items and add new discoveries. **Always delete finished tasks** from the file to keep it lean and focused.
>
> **Bug → Test rule**: Whenever a bug is found during development, immediately create a test plan (unit or E2E) to cover the bug scenario and prevent regression.
>
> **Admin Panel Feature Freeze**: 🚫 NO NEW FEATURES. Bug fixes and maintenance only. No new pages, components, hooks, or UI elements.
>
> **Orientation Protocol**: MANDATORY — read `questerix-cortex/outputs/SKELETON_SUMMARY.md` first before any research or edits.
>
> **Autonomous Mode**: All commands are pre-authorized (Turbo Mode ON). Set `SafeToAutoRun: true` and use the `ops_runner.py` workaround if gated by the IDE.
>
> **Efficiency Directive**: Ensure Cortex outputs are detailed and clear enough to reduce redundant runs. Focus on `UTILITY_REGISTRY.md` and `SKELETON_SUMMARY.md`.

---

## 🧹 Phase: Cortex Hygiene & Maintenance

- [ ] **Document Evidence Bridge**: Add a note to `AGENTS.md` about the `RLS_REMOTE_EVIDENCE.json` pattern to avoid future CLI false positives.
- [ ] **Cortex Formatting Pipeline**: Add `lint` and `format` scripts to the `questerix-cortex/package.json` to leverage ESLint and Prettier for output formatting automatically.

## 🛡️ Phase: Security & Reliability

- [ ] **RLS verification**: Verify `AGENT_CONTEXT.md` reports `PASS` on a fresh `intel` run using the new evidence bridge.
- [ ] **Fragility Sweep**: Review the top 5 fragile files reported in `AGENT_CONTEXT.md` and propose a "Hardening Plan."
- [ ] **Script Environment Isolation**: Ensure `gen_types.ps1` and utility automated scripts source `.env.local` to prevent `SUPABASE_DB_PASSWORD` or related config execution context failures.
