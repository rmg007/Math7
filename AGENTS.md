# Agent Rules & Conventions

> These rules apply to **all AI coding agents** working on Questerix, in any IDE.
>
> **Governance Model (2-file SSoT)**:
>
> - `AGENTS.md` (this file) — **Universal**: applies to Cursor, Claude, Copilot, Antigravity, and any other agent
> - `GEMINI.md` (user memory) — **Antigravity-specific**: turbo permissions, ops_runner fallback, MCP stack, circuit breaker counts
>
> When the two files conflict, **`GEMINI.md` wins for Antigravity IDE** sessions.
> When adding a new universal coding rule, add it here. When adding an Antigravity-specific permission, add it to `GEMINI.md`.

## Core Rules

1. **No TODO/FIXME/HACK in code.** All work items go in `tasks.md`.
2. **Document after every task.** Append a session entry to `docs/LEARNING_LOG.md` (what was done, what was learned).
3. **Tasks only in `tasks.md`.** No rules, docs, or history in that file.
4. **DO NOT PUBLISH landing-pages.** This component is for local development only. Orchestrator scripts are locked to skip it.
5. **Admin Panel Feature Freeze.** DO NOT add any new features to `admin-panel/`. Bug fixes and maintenance only. No new pages, components, hooks, routes, or UI elements.
6. **Use Premium UI Components.** If maintaining tables, use `ColumnToggle` (visibility) and `BulkActionBar` (multi-select actions) to ensure UI consistency.
7. **Every bug/issue requires a preventative test.** Before closing any bug or issue, you MUST write a new test case that reproduces the failure. The test must fail before the fix and pass after. No exceptions. Log the test file path in `docs/LEARNING_LOG.md` tagged `[test created]`.

## Discovery (How to Find What You Need)

**Primary (Cortex — always available):**

- **Codebase orientation**: Read `questerix-cortex/outputs/SKELETON_SUMMARY.md`.
- **Symbol lookup**: Use `cortex_search <query>` MCP tool or run `npm run health -- skeleton:search "query"` in `questerix-cortex/`.
- **Session start**: Read `questerix-cortex/outputs/AGENT_CONTEXT.md` and `questerix-cortex/outputs/NEXT_TASK.md` before coding.
- **Session context**: Use `cortex_briefing` MCP tool to get current session context with staleness warning.

**Quick Commands:**

- `npm run health` — Run Cortex health check
- `npm run cortex:selftest` — Validate MCP server
- `cortex_search <query>` — Search code symbols via MCP
- `cortex_briefing` — Get session context via MCP

**Workflows:** `.agent/workflows/process.md` (lifecycle), `.agent/workflows/help.md` (commands). **Coding standards:** `docs/standards/ORACLE_COGNITION.md` (supplementary). **Rule:** Never scan `node_modules`, `build`, or `dist`.

## File Placement

| What                         | Where                               | NOT here          |
| ---------------------------- | ----------------------------------- | ----------------- |
| Tasks / backlog              | `tasks.md`                          | —                 |
| Agent rules & conventions    | `AGENTS.md` (this file)             | `tasks.md`        |
| Session learnings            | `docs/LEARNING_LOG.md`              | `tasks.md`        |
| Agent discovery / navigation | AGENTS.md (Discovery section above) | —                 |
| Agent workflows              | `.agent/workflows/*.md`             | —                 |
| Test account credentials     | `.agent/TEST_ACCOUNTS.md`           | hardcoded in code |
| Project documentation        | `docs/`                             | root directory    |

## Testing Strategy

### Tier 1 — Functional E2E (Playwright, chromium only)

- Auth, CRUD, navigation, data integrity. No visual assertions.
- `npx playwright test tests/admin-panel.e2e.spec.ts`
- `npx playwright test tests/bulk-import.e2e.spec.ts`

### Tier 2 — Visual Regression (Playwright `toHaveScreenshot`)

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
- Supabase: Row Level Security on all tables. Multi-tenant via `app_id`.

## Testing Standards

### TypeScript Testing (Admin Panel)

#### **E2E Testing with Playwright**

- **Multiple selector strategies**: Use fallbacks for UI changes
- **Form handling**: Support different input types (text, rich text, selects)
- **Error resilience**: Proper waits and error handling
- **Production safety**: Use dedicated monitoring accounts

```typescript
// Robust selector strategy
const logoutTargets = [
  'button:has-text("Sign Out")',
  'button:has-text("Logout")',
  '[title*="Sign Out"]',
  '[aria-label*="Sign Out"]',
];

for (const target of logoutTargets) {
  if (await page.locator(target).isVisible()) {
    await page.locator(target).click();
    break;
  }
}
```

### Edge Function Testing (Supabase)

#### **Deno Testing Framework**

- **Authentication testing**: Critical for all edge functions
- **AI service mocking**: Mock different response scenarios (success, errors, invalid JSON)
- **Quota enforcement**: Test token consumption and limits
- **Input validation**: Test malformed requests and edge cases

```typescript
// Standard edge function test pattern
Deno.test('function handles auth correctly', async () => {
  const req = new Request('http://localhost/function', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer fake-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  });

  const res = await function(req);
  assertEquals(res.status, 200);
});
```

### Testing Implementation Tiers

#### **Tier 1 — Functional E2E (Playwright)**

- **Scope**: Auth, CRUD, navigation, data integrity
- **Frequency**: CI/CD pipeline
- **Tools**: Playwright with chromium only

#### **Tier 2 — Visual Regression (Playwright)**

- **Scope**: 5 pages × 2 viewports (Desktop + iPad Pro)
- **Frequency**: PR validation
- **Baselines**: `tests/__screenshots__/`

#### **Tier 3 — Unit/Integration Tests**

- **Admin Panel**: Vitest + React Testing Library
- **Edge Functions**: Deno testing framework
- **Content Engine**: Python pytest

#### **Coverage Requirements**

- **Admin Panel**: 70% minimum coverage gate
- **Python Content Engine**: 80% minimum coverage gate

### Test Data Management

#### **Test Accounts**

- **Use `TEST_USERS.SUPER_ADMIN`** from `tests/test-utils.ts` for admin E2E tests
- **Never use real user credentials** in automated tests
- **Test account credentials** stored in `.agent/TEST_ACCOUNTS.md`

#### **Mocking Strategy**

- **Never call real AI APIs** in tests - always mock
- **Mock data must pass Zod validation** schemas
- **Edge Functions**: Mock Supabase client, Gemini AI, environment variables

### CI/CD Integration

#### **Test Execution Order**

2. **Unit/Integration Tests** (fast feedback)
3. **E2E Tests** (full user flows)
4. **Visual Regression** (UI consistency)
5. **Coverage Reporting** (quality gates)

#### **Quality Gates**

- **Zero TypeScript errors** required (`tsc --noEmit`)
- **Zero critical security vulnerabilities**
- **Minimum coverage thresholds** enforced
- **All E2E tests must pass** on main branch

### Testing Anti-Patterns

#### **❌ Avoid These**

- **Testing implementation details** - test user behavior, not internal state
- **Hardcoded waits** - use proper waiting strategies
- **Test data in production** - use dedicated test environments
- **Brittle selectors** - use semantic HTML and accessible selectors
- **Ignoring test failures** - never skip failing tests without investigation
- **Fixing bugs without a regression test** - every bug fix MUST be accompanied by a new test case that reproduces the original failure (Core Rule #7)

#### **✅ Preferred Patterns**

- **Page Object Model** for E2E tests
- **Custom test utilities** for common operations
- **Environment-specific configurations** for test vs production
- **Comprehensive error scenarios** - test failure paths, not just happy paths
- **Accessibility testing** - include screen reader and keyboard navigation tests
