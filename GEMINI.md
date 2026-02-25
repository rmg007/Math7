# Questerix — AI Agent Instructions

## 🚫 HARD RULE — Admin Panel Feature Freeze

> **DO NOT add any new features to `admin-panel/`.**
> Bug fixes and maintenance only. No new pages, components, hooks, routes, or UI elements.
> This rule is non-negotiable and overrides any other instruction or request.

## 🚀 Session Bootstrap Protocol

**MANDATORY** — read these files in order at the start of EVERY session before writing any code:

1. `questerix-cortex/outputs/MACHINE_BRIEFING.md` — health snapshot, conventions, known gotchas
2. `questerix-cortex/outputs/NEXT_TASK.md` — highest-priority action with anti-hallucination guardrails
3. `questerix-cortex/outputs/FAILURE_DIGEST.md` — if failures > 0, understand them before touching code
4. `questerix-cortex/outputs/LAST_CHANGED.md` — which files shifted in the last run
5. `docs/LEARNING_LOG.md` — last 3 entries for recent lessons learned
6. `questerix-cortex/outputs/SKELETON_SUMMARY.md` — ALWAYS first orientation (replaces API_MAP.json)
7. `questerix-cortex/outputs/UTILITY_REGISTRY.md` — before writing any new helper

> Skip to step 6-7 only if you are 100% sure you are not modifying shared hooks or utilities.

## Project Context

Questerix is an educational platform with:

- **Admin Panel**: React/Vite/TypeScript (in `admin-panel/`)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Cloudflare Pages via `scripts/deploy-all.ps1`

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

## 🔐 MANDATORY: RLS Checklist for Every Migration

**CRITICAL RULE**: Any migration that creates a new table MUST include all applicable RLS policies.
This rule exists because missing policies cause silent data access failures that are hard to debug in production.

### For every new table, decide and document which operations apply:

| Operation | Add a policy if...                | Omit if...                                                   |
| --------- | --------------------------------- | ------------------------------------------------------------ |
| `SELECT`  | Users or admins need to read rows | Read is via SECURITY DEFINER RPC only                        |
| `INSERT`  | Users/admins create rows directly | Created via trigger or service role RPC                      |
| `UPDATE`  | Rows are mutable                  | Data is intentionally immutable (e.g., audit logs, attempts) |
| `DELETE`  | Admins need to prune data         | Rows are permanent records (e.g., audit trails)              |

### Required comment in migration for any OMITTED policy:

```sql
-- UPDATE intentionally omitted: curriculum_snapshots are immutable once published
-- DELETE intentionally omitted: generation_audit_log is append-only
```

### After any migration touching the schema, run the RLS audit:

```sql
-- psql $DATABASE_URL -f supabase/scripts/audit-rls.sql
-- Expect ZERO 🔴 rows in the output.
```

### Admin-managed tables that MUST have SELECT + INSERT + UPDATE + DELETE policies:

`known_issues`, `error_logs`, `source_documents`, `app_landing_pages`, `curriculum_meta`, `security_logs`

---

## Key Files

| What             | Where                                          |
| ---------------- | ---------------------------------------------- |
| Task tracking    | `tasks.md`                                     |
| Learning log     | `docs/LEARNING_LOG.md`                         |
| Changelog        | `CHANGELOG.md`                                 |
| DB types         | `admin-panel/src/types/database.types.ts`      |
| Supabase config  | `supabase/config.toml`                         |
| Loki Mode skill  | `.agent/skills/loki-mode/SKILL.md`             |
| Agent workflows  | `.agent/workflows/`                            |
| API map summary  | `questerix-cortex/outputs/SKELETON_SUMMARY.md` |
| Utility registry | `questerix-cortex/outputs/UTILITY_REGISTRY.md` |
| Machine briefing | `questerix-cortex/outputs/MACHINE_BRIEFING.md` |
