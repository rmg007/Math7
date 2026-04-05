# Loki Mode — Learned Guardrails

> This file accumulates lessons from past RARV failures.
> It is the agent's "muscle memory" — scan it before each ACT phase.
> **Path**: `.antigravity/skills/loki-mode/guardrails.md`
> **Updated automatically**: When any circuit breaker fires, or a sub-task requires >3 iterations.

---

## 🚫 [HARD RULE] Admin Panel Feature Freeze (2026-02-16)

**DO NOT add any new features to `admin-panel/`.** Bug fixes and maintenance only. No new pages, components, hooks, routes, or UI elements. This rule is non-negotiable and overrides any other instruction or request.

---

## [import-path] Duplicate Import Deduplication (2026-02-16)

When adding new imports via multi_replace_file_content, always check that the existing import block doesn't already contain the same modules. Replacing a line that includes `import X from 'y'` with a block that also adds `import X from 'y'` will create duplicates. **Solution**: View lines 1–25 first.

---

## [pattern-violation] Arbitrary Tailwind Values (2026-02-16)

Never use `text-[10px]`, `text-[11px]`, or `tracking-[0.2em]` directly. Use the custom utilities `text-2xs` (10px), `text-xs` (12px standard), and `tracking-extra-wide` (0.2em) defined in `tailwind.config.js`.

---

## [auth-guard] Infinite Loading for Unauthorized Users BUG-A1/A2 (2026-02-18)

**Problem**: `standard-admin-guard.tsx` and `super-admin-guard.tsx` showed a perpetual spinner for unauthorized users instead of redirecting.
**Root cause**: Auth state check returned `loading=true` indefinitely when user lacked the required role.
**Fix pattern**: Guards must handle the `!hasRequiredRole` case explicitly after auth resolves — redirect to `/unauthorized`, never stay in loading state.
**Test**: [test created] — regression test in `admin-panel/tests/`

---

## [silent-failure] useCreateApp Silent Failure BUG-A3 (2026-02-18)

**Problem**: `useCreateApp()` returned `undefined` on failure without surfacing the error to the user.
**Fix pattern**: Mutations must call `onError` with a user-visible toast AND `captureException()`. Never return `null`/`undefined` where a typed error is appropriate.
**Test**: [test created]

---

## [tenant-scoping] Missing app_id in Mutations BUG-A4 (2026-02-18)

**Problem**: `UserManagementPage.tsx` mutations were not scoped to `currentApp.app_id`, allowing cross-tenant data writes.
**Fix pattern**: All mutations touching tenant-scoped data MUST include `.eq('app_id', currentApp.app_id)` or use the `useCurrentApp()` hook implicitly.
**Scan**: Before every mutation hook, grep for `app_id` in the mutation body.
**Test**: [test created]

---

## [perf] Client-Side Log Counting BUG-A5 (2026-02-18)

**Problem**: `useErrorLogStats()` fetched all rows client-side to count them, causing O(N) performance degradation.
**Fix pattern**: Always use server-side `count` option: `.select('*', { count: 'exact', head: true })`. Never fetch full rows just to count.
**Test**: [test created]

---

## [duplicate-hook] Duplicate Hook Registration BUG-A6 (2026-02-18)

**Problem**: `useDeleteKnownIssue` was defined in two separate files. The second definition silently shadowed the first.
**Fix pattern**: Before creating any new hook, search the codebase for existing hooks with similar names: `grep -r "useDelete" src/hooks/`.
**Test**: [no test needed] — resolved by deletion.

---

## [security] SECURITY DEFINER Missing search_path (2026-02-20)

**Problem**: SQL functions with `SECURITY DEFINER` that omit `SET search_path = 'public', 'auth'` are vulnerable to search path injection.
**Fix pattern**: Every `CREATE FUNCTION ... SECURITY DEFINER` must include:

```sql
SET search_path = 'public', 'auth'
```

**Scan**: `grep -r "SECURITY DEFINER" supabase/` — verify each has `SET search_path`.
**Test**: [need test] — add to forensic_audit.ps1 scan

---

## [testing] thenReturn vs thenAnswer for async Dart mocks (2026-02-18)

**Problem**: Using `thenReturn(Future.value(...))` with mocktail for Future-returning methods causes test failures.
**Fix**: Always use `thenAnswer((_) => Future.value(...))` for async mock return values.
**Applies to**: All mocktail mocks in questerix-student-app/test/

---

## [accessibility] Discernible Text for Interactive Elements (2026-02-18)

All `<button>`, `<select>`, and icon-only interactive elements MUST have either:

- Visible text content, OR
- `aria-label="..."` + `title="..."` attributes

Failure causes accessibility lint violations in Playwright a11y tests.

---

## [config-drift] SecurityLogger metadata assertions (2026-02-18)

**Problem**: `SecurityLogger.test.ts` used exact-match assertions on metadata objects. When new environment-specific metadata was added, all tests broke.
**Fix**: Use `expect.objectContaining({...})` for metadata assertions — allows new fields without breaking existing tests.

---

## [regression-key] Single-entity hooks must not depend on app context (2026-02-18)

**Problem**: `useDomain(id)`, `useSkill(id)`, `useQuestion(id)` query keys were accidentally including `app_id`, making them context-dependent when they should be globally stable by ID.
**Fix**: Single-entity hooks use `['entity-name', id]` as the query key — never include `app_id`.
**Test**: [test created] — stable query key regression test in `regression.test.tsx`

---

## [governance] Skill Directory Authority (2026-02-20)

**.antigravity/skills/ is the canonical skill directory.** `.agent/skills/` is legacy and has been deleted.

- Loki state → `.antigravity/skills/loki-mode/state.json`
- Loki logs → `.antigravity/skills/loki-mode/logs/`
- Loki config → `.antigravity/skills/loki-mode/config.json` (v2.x)

Do not create files in `.agent/skills/` — that directory is retired.

---

## [governance] turbo-all Permission SSoT (2026-02-20)

The single source of truth for autonomous execution permissions is **`GEMINI.md`** (user memory).

- `autopilot.md` is a thin shim — it does NOT duplicate the permission list
- Do not add new `// turbo` patterns to `autopilot.md`
- To add a new permitted command pattern, update `GEMINI.md` user memory
