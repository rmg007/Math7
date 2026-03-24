# Questerix — AI Agent Instructions

---

## 🔴 MANDATORY TASK CLOSE CHECKLIST — Run After EVERY Task

> **This runs after EVERY task, not just at end of session.**
> Do not sign off or say "done" until all 4 steps are complete.

- [ ] **1. TIME_LOG** — Add a row to `docs/TIME_LOG.md` (main Questerix repo) with: date, time range, hours, app(s), work type, description. Recalculate monthly total + YTD.
- [ ] **2. LEARNING_LOG** — Append session summary to `docs/LEARNING_LOG.md` with what was done and any prevention rules discovered.
- [ ] **3. Temp Files** — Delete any scratch files, debug scripts, or `/tmp/` files created during this task. Note cleanup in TIME_LOG row.
- [ ] **4. tasks.md** — Mark completed tasks `[x]`. Add any newly discovered sub-tasks.

> ❌ Skipping any step = **non-compliant session**. The user has explicitly flagged this pattern.

---

## 🛑 MANDATORY: Work Discipline & Tasks.md

> **CRITICAL**: BEFORE performing ANY work (reading files, writing code, running tests), you MUST read `tasks.md`.
>
> 1. **No Unrecorded Work**: NEVER work on anything unless it is recorded in `tasks.md`.
> 2. **Task State Discipline**:
>    - Mark the task you are currently working on with `[/]` (Active).
>    - Mark finished tasks with `[x]` (Completed).
>    - Add new discoveries or sub-tasks to the queue immediately.
> 3. **Session Start**: Your first action in every session is to read `tasks.md` and acknowledge the active task.
> 4. **No Gaps**: If a request comes in that isn't in `tasks.md`, add it to `tasks.md` FIRST before proceeding.

## 🚫 HARD RULE — Admin Panel Feature Freeze

> **DO NOT add any new features to `admin-panel/`.**
> Bug fixes and maintenance only. No new pages, components, hooks, routes, or UI elements.
> This rule is non-negotiable and overrides any other instruction or request.

## 📋 HARD RULE — Task File Boundaries

> **Two task files exist. Each has a strictly enforced scope. NEVER mix them.**
>
> | File                                                              | Scope                       | What belongs here                                                                                                                                               |
> | :---------------------------------------------------------------- | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | `tasks.md`                                                        | **Questerix / Cortex only** | ALL Questerix/Cortex work — active sprint AND future queue (H, I, J-slots, K-slots, etc.). If the work executes inside the Questerix/Cortex repo, it goes here. |
> | `.future_projects_plan_out_of_scope/futer_projects_plan_tasks.md` | **Vault folder only**       | Tasks that create or edit files **inside** `.future_projects_plan_out_of_scope/` (e.g., authoring architecture docs, updating the manifesto, adding prompts).   |
>
> **Rules**:
>
> - If the work executes inside the Questerix/Cortex codebase (`admin-panel/`, `questerix-cortex/`, `supabase/`, etc.) → it goes in `tasks.md`, regardless of how "future" it is.
> - If the work is authoring/editing a file inside `.future_projects_plan_out_of_scope/` → it goes in `.future_projects_plan_out_of_scope/futer_projects_plan_tasks.md`.
> - When a future queue slot becomes the active sprint slot, move it to the Active section of `tasks.md`.
> - **NEVER** put Questerix/Cortex codebase work in `.future_projects_plan_out_of_scope/futer_projects_plan_tasks.md`.

## 🚀 Session Bootstrap Protocol

**MANDATORY** — read these files in order at the start of EVERY session before writing any code:

1. `questerix-cortex/outputs/MACHINE_BRIEFING.md` — health snapshot, conventions, known gotchas
2. `questerix-cortex/outputs/NEXT_TASK.md` — highest-priority action with anti-hallucination guardrails
3. `questerix-cortex/outputs/FAILURE_DIGEST.md` — if failures > 0, understand them before touching code
4. `questerix-cortex/outputs/LAST_CHANGED.md` — which files shifted in the last run
5. `docs/LEARNING_LOG.md` — last 3 entries for recent lessons learned
6. `questerix-cortex/outputs/SKELETON_SUMMARY.md` — ALWAYS first orientation
7. `questerix-cortex/outputs/UTILITY_REGISTRY.md` — before writing any new helper

> Skip to step 6-7 only if you are 100% sure you are not modifying shared hooks or utilities.

## 🏁 Session Close Protocol

**MANDATORY** — at the END of every session before signing off:

1. **Update `docs/TIME_LOG.md`** — add a row to the current month with hours, app(s), work type, and description. Recalculate monthly total and YTD summary.
2. **Clean temp files** — delete any scratch files, one-off debug scripts, or `/tmp/` files created during the session.
3. **Append to `docs/LEARNING_LOG.md`** — summarize what was done and any prevention rules discovered.
4. **Update `tasks.md`** — mark completed tasks `[x]`, add any new discovered tasks.

> Session close is as important as session start. A session without a TIME_LOG entry is an unrecorded business expense.

## Light Bootstrap (for trivial tasks)

If the task is a **typo fix**, **comment edit**, or **documentation-only change**:

1. Read `questerix-cortex/outputs/SKELETON_SUMMARY.md` (orientation).
2. Read `questerix-cortex/outputs/FAILURE_DIGEST.md` (ensure no breakage).
3. Skip the remaining 5 bootstrap files.
4. Proceed directly.

**Full bootstrap is mandatory** for any code change, schema change, or new feature.

## Project Context

Questerix is an educational platform with:

- **Admin Panel**: React/Vite/TypeScript (in `admin-panel/`)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Cloudflare Pages via scripts/deploy-all.ps1 (runs from scripts/ directory)

## Autonomous Execution Rules

1. **Turbo Mode is ON**. All commands are pre-authorized via `// turbo-all`.
2. **Use `SafeToAutoRun: true`** for every `run_command` call.
3. If IDE gates a command, use the `ops_runner.py` workaround (see `/superpower` workflow).

## Research-First Protocol

When encountering an error or unfamiliar API:

1. **DO NOT GUESS.** Search first.
2. **Priority search domains** (search these before anything else):
   - `supabase.com/docs` — Database, Auth, RLS, Edge Functions
   - `vitejs.dev` — Build tool, HMR, config
   - `react.dev` — React patterns, hooks, best practices
   - `vitejs.dev` — Build tool, HMR, config
   - `react.dev` — React patterns, hooks, best practices
   - `vitest.dev` — Unit testing configuration and APIs
   - `playwright.dev` — E2E testing patterns
3. **Use exact error messages** in search queries.
4. **Prefer official docs** over blog posts.

## Watchdog Circuit Breakers

**CRITICAL**: These are hard limits to prevent infinite loops and resource waste.

- **5 consecutive failures** on the same sub-task → STOP and escalate to user
- **3 consecutive identical errors** → You're in a loop. STOP.
- **25 total iterations** per session → Checkpoint progress and STOP
- **60 second test timeout** → Kill the test, investigate the hang
- **15 minutes with no progress** → Checkpoint and escalate

When any circuit breaker triggers, output:

```text
⚠️ [CIRCUIT BREAKER]: {reason}. Saving progress and pausing for user review.
```

## ⚠️ Known Gotchas

Project-specific traps that have caused real failures. Check before touching related code:

| Trap                        | Rule                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **PowerShell em-dashes**    | NEVER use `—` or smart quotes in `.ps1` files. Use `-` instead. Parser will throw `Unexpected token`.         |
| **Orchestrator timeouts**   | Any task delegating to scripts needs ≥15 min. `900_000ms` is the minimum for compound tasks.                  |
| **Supabase query builder**  | IMMUTABLE — always chain `.eq()`, `.neq()`, `.filter()`. Never call on a stored variable without reassigning. |
| **Radix Select in E2E**     | Use keyboard navigation (`ArrowDown` + `Enter`), not mouse clicks — more reliable in Playwright.              |
| **PowerShell -NoProfile**   | All automation scripts must use `-NoProfile` to avoid user shell profile interference.                        |
| **Draft vs Live lifecycle** | Publish tests require entities to START as `draft`. Creating as `live` bypasses transition logic.             |

## Coding Standards

- **TypeScript**: Strict mode, no `any`, no `@ts-ignore` without justification
- **React**: Functional components, hooks-based, follow existing patterns in `features/`
- **Tests**: Co-locate unit tests, use `--bail` flag, focus on behavior not implementation
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

## Cortex v2 — Required Protocol

### Pre-Edit: Always call `cortex_plan`

Before modifying any source file in `admin-panel/src/`, call the `cortex_plan` MCP tool:

```js
cortex_plan({ files: ["features/auth/hooks/use-auth.ts", ...] })
```

This returns a tier classification (A/B/C) and protocol:

- **Tier A** (auto-approve): Proceed, then verify
- **Tier B** (auto-plan): Outline your changes, then proceed and verify
- **Tier C** (human gate): Get user approval before editing

### Post-Edit: Always call `cortex_verify`

After completing edits, call `cortex_verify`:

```js
cortex_verify({ files: ["features/auth/hooks/use-auth.ts", ...] })
```

This runs targeted tsc + tests and updates fragility data.

### Compliance

Both calls are logged to `cortex.db`. Skipping either is flagged in the health report.

## 🔐 MANDATORY: RLS Checklist for Every Migration

**CRITICAL RULE**: Any migration that creates a new table MUST include all applicable RLS policies.
This rule exists because missing policies cause silent data access failures that are hard to debug in production.

### For every new table, decide and document which operations apply

| Operation | Add a policy if...                | Omit if...                                                   |
| --------- | --------------------------------- | ------------------------------------------------------------ |
| `SELECT`  | Users or admins need to read rows | Read is via SECURITY DEFINER RPC only                        |
| `INSERT`  | Users/admins create rows directly | Created via trigger or service role RPC                      |
| `UPDATE`  | Rows are mutable                  | Data is intentionally immutable (e.g., audit logs, attempts) |
| `DELETE`  | Admins need to prune data         | Rows are permanent records (e.g., audit trails)              |

### Required comment in migration for any OMITTED policy

```sql
-- UPDATE intentionally omitted: curriculum_snapshots are immutable once published
-- DELETE intentionally omitted: generation_audit_log is append-only
```

### After any migration touching the schema, run the RLS audit

```sql
-- psql $DATABASE_URL -f supabase/scripts/audit-rls.sql
-- Expect ZERO 🔴 rows in the output.
```

### Admin-managed tables that MUST have SELECT + INSERT + UPDATE + DELETE policies

`known_issues`, `error_logs`, `source_documents`, `app_landing_pages`, `curriculum_meta`, `security_logs`

---

## Key Files

| What                      | Where                                                             | Scope                                                                                                    |
| :------------------------ | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **Active sprint tasks**   | `tasks.md`                                                        | Questerix / Cortex work ONLY                                                                             |
| **Future project tasks**  | `.future_projects_plan_out_of_scope/futer_projects_plan_tasks.md` | Vault document work ONLY (authoring/editing files inside the vault)                                      |
| AetherFlow template vault | `.future_projects_plan_out_of_scope/`                             | Tech-stack agnostic lessons/patterns distilled from Questerix — reusable scaffold for any future project |
| Future project vault nav  | `.future_projects_plan_out_of_scope/README.md`                    | Navigation & rules for the vault                                                                         |
| Learning log              | `docs/LEARNING_LOG.md`                                            | —                                                                                                        |
| **Developer time log**    | `docs/TIME_LOG.md`                                                | Payroll / tax records — update every session                                                             |
| Changelog                 | `CHANGELOG.md`                                                    | —                                                                                                        |
| DB types                  | `admin-panel/src/types/database.types.ts`                         | —                                                                                                        |
| Supabase config           | `supabase/config.toml`                                            | —                                                                                                        |
| Loki Mode skill           | `.agent/skills/loki-mode/SKILL.md`                                | —                                                                                                        |
| Agent workflows           | `.agent/workflows/`                                               | —                                                                                                        |
| Skeleton summary          | `questerix-cortex/outputs/SKELETON_SUMMARY.md`                    | —                                                                                                        |
| Utility registry          | `questerix-cortex/outputs/UTILITY_REGISTRY.md`                    | —                                                                                                        |
| Machine briefing          | `questerix-cortex/outputs/MACHINE_BRIEFING.md`                    | —                                                                                                        |
| Cortex v2 DB              | `questerix-cortex/outputs/cortex.db`                              | —                                                                                                        |
| MCP Server                | `questerix-cortex/src/mcp-server/server.ts`                       | —                                                                                                        |
| Session briefs            | `questerix-cortex/briefs/`                                        | —                                                                                                        |
