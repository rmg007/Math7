# Agent Rules & Conventions

> These rules apply to **all AI coding agents** working on Questerix, in any IDE.
> **Governance Model (2-file SSoT)**:
>
> - `AGENTS.md` (this file) — **Universal**: applies to all agents
> - `GEMINI.md` (user memory) — **Antigravity-specific**: execution permissions

## Task Tiers (Read First)

if message contains `// quick` or `// light`: TIER S — skip all bootstrap, Cortex, and close checklist
if message contains `// full` or `// sprint`: TIER L — full bootstrap, Cortex plan/verify, full session close
default: TIER M — read SKELETON_SUMMARY.md only, update tasks.md, batch session close

## 🔴 MANDATORY SESSION CLOSE CHECKLIST

> **This runs after EVERY session (daily work period), not per micro-task.**

- [ ] **1. TIME_LOG** — Add a row to `docs/TIME_LOG.md` with: date, hours, app(s), work type, description.
- [ ] **2. Temp Files** — Delete any scratch files or `/tmp/` files.
- [ ] **3. tasks.md** — Mark completed tasks `[x]`, add any new sub-tasks.
- [ ] **4. LEARNING_LOG** — Append weekly summary of prevention rules (only if meaningful).

## Core Rules

1. **No TODO/FIXME/HACK in code.** All work items go in `tasks.md`.
2. **Tasks only in `tasks.md`.** No rules, docs, or history in that file.
3. **DO NOT add any new features to `admin-panel/`.** Bug fixes only.
4. **Use Premium UI Components.** e.g., `ColumnToggle`, `BulkActionBar`.
5. **Every P0/P1 bug requires a test.** Opt-in for P2/P3.
6. **MANDATORY: Use `cortex_search`.** Use it for symbol lookup and discovery.
7. **Flag manual actions.** Explicitly highlight required user interventions.
8. **Automate over document.** Prefer CLIs and CI/CD over written guides.

## Discovery (The Faster Way)

- **Primary**: `cortex_search <query>` (MCP tool)
- **Codebase Orientation**: Read `questerix-cortex/outputs/SKELETON_SUMMARY.md`
- **RLS Evidence Bridge**: Read `RLS_REMOTE_EVIDENCE.json` if present; fallback to CLI.

## RLS Checklist

For any migration creating a table, define SELECT/INSERT/UPDATE/DELETE policies or explicitly document omission. Run `psql $DATABASE_URL -f supabase/scripts/audit-rls.sql` after.

## Testing Standards

- **Tier 1 (E2E)**: Playwright (desktop only). Auth, CRUD, navigation.
- **Tier 2 (Visual)**: Playwright baselines.
- **Tier 3 (Unit)**: Vitest (Admin) / Deno (Edge) / Pytest (Content).
- **Conventions**: Use `TEST_USERS.SUPER_ADMIN`. Mock real APIs (never hit Gemini API in tests). Validate with Zod before RPC.

## File Placement

| What              | Where                     |
| ----------------- | ------------------------- |
| Active backlog    | `tasks.md`                |
| Developer time    | `docs/TIME_LOG.md`        |
| Session learnings | `docs/LEARNING_LOG.md`    |
| Agent rules       | `AGENTS.md`               |
| Test accounts     | `.agent/TEST_ACCOUNTS.md` |
