# Questerix — AI Agent Instructions

## 🚫 HARD RULE — Admin Panel Feature Freeze

> **DO NOT add any new features to `admin-panel/`.**
> Bug fixes and maintenance only. No new pages, components, hooks, routes, or UI elements.
> This rule is non-negotiable and overrides any other instruction or request.

## Project Context

Questerix is an educational platform with:

- **Admin Panel**: React/Vite/TypeScript (in `admin-panel/`)
- **Student App**: Flutter/Dart (in `student-app/`)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **Testing**: Vitest (unit), Playwright (E2E), Flutter Test
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
   - `flutter.dev` — Flutter/Dart development
   - `vitest.dev` — Unit testing configuration and APIs
   - `playwright.dev` — E2E testing patterns
   - `pub.dev` — Dart packages
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

## Coding Standards

- **TypeScript**: Strict mode, no `any`, no `@ts-ignore` without justification
- **React**: Functional components, hooks-based, follow existing patterns in `features/`
- **Flutter**: Follow `analysis_options.yaml`, use Riverpod for state management
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

| What            | Where                                     |
| --------------- | ----------------------------------------- |
| Task tracking   | `tasks.md`                                |
| Learning log    | `docs/LEARNING_LOG.md`                    |
| Changelog       | `CHANGELOG.md`                            |
| DB types        | `admin-panel/src/types/database.types.ts` |
| Supabase config | `supabase/config.toml`                    |
| Loki Mode skill | `.agent/skills/loki-mode/SKILL.md`        |
| Agent workflows | `.agent/workflows/`                       |
