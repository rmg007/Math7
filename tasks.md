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

---

## 🧠 Cortex v2 Implementation (Two-Agent Workflow)

> **Plan**: `plan.md` (v8 — final)
> **Briefs**: `questerix-cortex/briefs/` (5 session briefs + review checklists)
> **Protocol**: Cursor implements → Antigravity reviews

| Session                  | Status       | Branch                | Brief                | Effort |
| ------------------------ | ------------ | --------------------- | -------------------- | ------ |
| **1** Graph Foundation   | ✅ Completed | `cortex-v2/session-1` | `SESSION_1_BRIEF.md` | ~4.5h  |
| **2** MCP Server         | ✅ Completed | `cortex-v2/session-2` | `SESSION_2_BRIEF.md` | ~3.5h  |
| **3** Fragility Engine   | ✅ Completed | `cortex-v2/session-3` | `SESSION_3_BRIEF.md` | ~2.5h  |
| **4** Surgical Architect | ✅ Completed | `cortex-v2/session-4` | `SESSION_4_BRIEF.md` | ~3h    |
| **5** Integration        | ✅ Completed | `cortex-v2/session-5` | `SESSION_5_BRIEF.md` | ~1.5h  |

**Dependencies**: Session 1 → Sessions 2 & 3 (parallel) → Session 4 → Session 5

---

## Backlog (Deferred)

- [ ] **Health Dashboard**: `/admin/maintenance` route surfacing `error_logs` + smoke statuses
  - ⚠️ Blocked by Admin Panel feature freeze (no new routes/pages allowed)
- [ ] **Regenerate Supabase Types**: Run `supabase gen types typescript` to fix the `validate_and_use_invitation_code` RPC cast in `LoginPage.tsx`
- [ ] **Test files `as any` cleanup**: ~50 `as any` casts in test files (`use-subjects.test.tsx`, `use-apps.test.tsx`, `use-landings.test.tsx`, `use-error-logs.test.tsx`, `use-skills.test.tsx`) — acceptable for Supabase mock chains but could be improved with typed test helpers
