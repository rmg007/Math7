# Agent Rules & Conventions

> These rules apply to **all AI coding agents** working on Questerix, in any IDE.

## Core Rules

1. **No TODO/FIXME/HACK in code.** All work items go in `tasks.md`.
2. **Document after every task.** Append a session entry to `docs/LEARNING_LOG.md` (what was done, what was learned).
3. **Tasks only in `tasks.md`.** No rules, docs, or history in that file.

## File Placement

| What | Where | NOT here |
|---|---|---|
| Tasks / backlog | `tasks.md` | — |
| Agent rules & conventions | `AGENTS.md` (this file) | `tasks.md` |
| Session learnings | `docs/LEARNING_LOG.md` | `tasks.md` |
| Agent discovery / navigation | `AGENT_QUICKSTART.md` | — |
| Agent workflows | `.agent/workflows/*.md` | — |
| Test account credentials | `.agent/TEST_ACCOUNTS.md` | hardcoded in code |
| Project documentation | `docs/` | root directory |

## Testing Strategy

**Tier 1 — Functional E2E (Playwright, chromium only)**
- Auth, CRUD, navigation, data integrity. No visual assertions.
- `npx playwright test tests/admin-panel.e2e.spec.ts`
- `npx playwright test tests/bulk-import.e2e.spec.ts`

**Tier 2 — Visual Regression (Playwright `toHaveScreenshot`)**
- 5 pages × 2 viewports (Desktop + iPad Pro). Baselines in `tests/__screenshots__/`.
- `npx playwright test tests/visual-regression.spec.ts`
- Update baselines: `npx playwright test tests/visual-regression.spec.ts --update-snapshots`

**Before pushing:** run `npx tsc --noEmit` — zero errors required.

## Test Conventions

- Use `TEST_USERS.SUPER_ADMIN` from `tests/test-utils.ts` for admin E2E tests.
- Mock Edge Functions and RPCs with `page.route()` — never call real AI APIs in tests.
- Mock data must pass Zod validation schemas (the app validates client-side before RPC).
- Assert on persistent state changes (buffer counts, disabled buttons), **not** transient toasts.

## Communication Rules

1. **Flag manual actions.** If anything you implement requires the user to take a manual step (run a command, change a setting, approve something), you MUST flag it clearly with:
   > ⚠️ **ACTION REQUIRED:** [what to do and why]
2. **Default to automation.** Always prefer automated solutions (CI, pre-commit hooks, scheduled workflows) over manual steps. If something can't be automated, explain why.
3. **Summarize what's automatic.** When completing a task, confirm what runs automatically vs. what needs manual intervention.

## Code Standards

- TypeScript strict mode — zero `any` where avoidable. Use `as unknown as Type` only when bridging Supabase-generated types.
- Admin Panel: React + Vite + shadcn/ui + TanStack Query.
- Student App: Flutter + Riverpod + Drift (offline-first).
- Supabase: Row Level Security on all tables. Multi-tenant via `app_id`.
