# Questerix — AI Agent Instructions

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
