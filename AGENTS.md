# Agent Rules - Questerix Admin Panel

> **Inherit ALL rules from `../AGENTS.md` (master file for all IDEs)**
> **This file contains ONLY admin-panel-specific rules and overrides.**

## Project-Specific Rules

1. **DO NOT add any new features to `admin-panel/`.** Bug fixes only.
2. **Deployment allowlist (absolute): ONLY deploy `questerix` and `questerix-student-app`.**
3. **Use Premium UI Components.** e.g., `ColumnToggle`, `BulkActionBar`.
4. **Every P0/P1 bug requires a test.** Opt-in for P2/P3.
5. **MANDATORY: Use `cortex_search`.** Use it for symbol lookup and discovery.

## RLS Checklist

For any migration creating a table, define SELECT/INSERT/UPDATE/DELETE policies or explicitly document omission. Run `psql $DATABASE_URL -f supabase/scripts/audit-rls.sql` after.

## Testing Standards

- **Tier 1 (E2E)**: Playwright (desktop only). Auth, CRUD, navigation.
- **Tier 2 (Visual)**: Playwright baselines.
- **Tier 3 (Unit)**: Vitest (Admin) / Deno (Edge) / Pytest (Content).
- **Conventions**: Use `TEST_USERS.SUPER_ADMIN`. Mock real APIs (never hit Gemini API in tests). Validate with Zod before RPC.
