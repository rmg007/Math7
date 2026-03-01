---
description: Write, fix, and verify tests across the Questerix mono-repo (Playwright E2E, Vitest unit/integration, Flutter widget tests and SQL regression tests).
---

// turbo-all

# /test Workflow

## Overview

Use this workflow to write new tests, fix failing tests, or verify test coverage for any part of the Questerix platform.

**Modes:**

- `plan` — Audit coverage gaps, propose test cases, output a checklist
- `infra` — Set up shared fixtures, seeders, mock factories, or POMs
- `write` — Author new test files or migrate existing tests to new patterns
- `verify` — Run test suites, analyse failures, and produce a pass/fail report
- `commit` — Stage and commit test changes with a conventional commit message

Activate a specific mode by saying `/test plan`, `/test write`, `/test verify`, etc.

---

## Mode: `plan`

1. Read `docs/TEST_PLAN.md` (sections A–H) to understand coverage intent.
2. Read `tasks.md` to find the current Phase's test task items.
3. Audit existing test files:
   - `admin-panel/src/**/*.test.{ts,tsx}` — Vitest unit/integration
   - `admin-panel/tests/**/*.spec.ts` — Playwright E2E
   - `student-app/test/**/*_test.dart` — Flutter unit/widget
   - `student-app/integration_test/**/*_test.dart` — Flutter integration
4. Map each gap in `docs/TEST_PLAN.md` to a proposed test file and test ID.
5. Output a ranked checklist: P0 → P1 → P2, with estimated effort.
6. Create or update `tasks.md` with the new test items.

---

## Mode: `infra`

Set up shared test infrastructure before writing tests.

### Admin Panel (Vitest)

// turbo

1. Shared Supabase mock factory:
   `admin-panel/src/__tests__/mocks/supabase-factory.ts`
   - Provides `mockSupabaseClient()` with chainable Zod-validated returns
   - Follow the pattern in existing `supabase-factory.ts`

// turbo 2. Question fixtures:
`admin-panel/tests/fixtures/questions.ts`

- One fixture per question type (MC, TF, FIB, SA, MA)

### Admin Panel (Playwright)

// turbo 3. Page Object Model classes in admin-panel/tests/pom/ (create if missing):

- `LoginPage.ts`, `DomainsPage.ts`, `SkillsPage.ts`, `QuestionsPage.ts`
- `GroupsPage.ts`, `PublishPage.ts`
- Dual-selector strategy: prefer `data-testid`, fallback to ARIA roles

// turbo 4. Actions layer: `admin-panel/tests/actions/curriculum.ts`

- Functions: `createDomain()`, `createSkill()`, `createQuestion()`, `publishCurriculum()`

// turbo 5. Seed scripts in admin-panel/tests/seeders/ (create if missing):

- `curriculum.ts` — domains, skills, questions (all 5 types)
- `groups.ts` — group + members + assignments
- `users.ts` — admin, mentor, student roles

### Flutter

// turbo 6. Mock database helper: `student-app/test/helpers/mock_database.dart` 7. Connectivity mock: `student-app/test/helpers/mock_connectivity.dart`

---

## Mode: `write`

Write tests following these conventions:

### Admin Panel — E2E (Playwright)

```
Pattern: tests/<feature>.e2e.spec.ts
IDs: AP-<FEATURE>-<NNN> (e.g., AP-AUTH-001)
Use: test-utils.ts for TEST_USERS and login()
Use: POM classes from admin-panel/tests/pom/
Use: page.route() to mock Supabase REST calls
Assert: persistent DOM state — NOT transient toasts
```

// turbo
Run after writing:

```
npx playwright test tests/<new-file>.e2e.spec.ts --reporter=list
```

### Admin Panel — Unit (Vitest)

```
Pattern: src/<feature>/__tests__/<component>.test.tsx
Use: mockSupabaseClient() from supabase-factory.ts
Use: renderWithProviders() wrapper
Use: expect.objectContaining() for partial metadata assertions
```

// turbo
Run after writing:

```
npm run test -- --run --reporter=verbose <file>
```

### Flutter

```
Pattern: test/features/<feature>/<widget>_test.dart
Use: ProviderContainer + overrides (Riverpod)
Use: MockDatabase from test/helpers/mock_database.dart
```

// turbo
Run after writing:

```
flutter test test/features/<feature>/
```

---

## Mode: `verify`

// turbo

1. Run Playwright E2E smoke suite:
   ```
   npx playwright test --project=chromium tests/auth-flow.e2e.spec.ts tests/rbac-guards.e2e.spec.ts tests/curriculum-lifecycle.e2e.spec.ts
   ```

// turbo 2. Run full Playwright suite:

```
npx playwright test
```

// turbo 3. Run Vitest unit suite:

```
npm run test -- --run --coverage
```

// turbo 4. Run Flutter tests:

```
flutter test --coverage
```

5. Analyse failures:
   - E2E: check `playwright-report/index.html`
   - Vitest: check `coverage/index.html`
   - Flutter: check `coverage/lcov.info`

6. For each failure, classify:
   - **Flaky** (timing) → add `waitForLoadState('networkidle')` or extend timeout
   - **Broken selector** → update `data-testid` or ARIA role
   - **Logic bug** → fix the source code (follow `/fix` workflow)
   - **Stale mock** → update mock response to match current DB schema

7. Fix up to **5 failures maximum** per session (circuit breaker: escalate if more).

---

## Mode: `commit`

// turbo

1. Stage test changes:
   ```
   git add admin-panel/tests/ admin-panel/src/**/__tests__/ student-app/test/ docs/
   ```

// turbo 2. Commit with conventional prefix:

```
git commit -m "test: <what was tested and why>"
```

// turbo 3. Push:

```
git push
```

---

## Checklist Before Closing

- [ ] New tests added to `docs/TEST_PLAN.md` coverage map (Section B)
- [ ] `tasks.md` updated with `[x]` for completed test items
- [ ] No `test.only()` or `test.skip()` left in committed code (unless intentional with comment)
- [ ] All new POM selectors use `data-testid` where available
- [ ] CI passes (confirm via GitHub Actions or local `verify` mode run)
