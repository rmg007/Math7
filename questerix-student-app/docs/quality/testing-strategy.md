# Testing Strategy and Coverage

**Last updated**: 2026-02-21  
**See also**: [`docs/TEST_PLAN.md`](../TEST_PLAN.md) for the full coverage map, UAT scenarios and CI pipeline matrix.

---

## Test Pyramid

```
         /\
        /  \   E2E: ~12 specs, ~180 tests (Playwright + Flutter driver)
       /----\
      /      \  Integration: ~30 files, ~150 tests (hooks + RPCs mocked)
     /--------\
    /          \ Unit: 50+ files, ~400 tests (Vitest + Flutter test)
   /────────────\
```

**Target ratios**: 60% unit / 30% integration / 10% E2E

---

## Component Coverage Targets

| Component                  | Framework                          | Coverage Target                                  | CI Command                            |
| -------------------------- | ---------------------------------- | ------------------------------------------------ | ------------------------------------- |
| Admin Panel (TS/React)     | Vitest + RTL                       | ≥80% statements, lines, functions; ≥75% branches | `npm run test:ci`                     |
| Admin Panel (E2E)          | Playwright (chromium)              | All P0 smoke specs pass                          | `npx playwright test`                 |
| Workers / Edge Fns (TS)    | Vitest (miniflare)                 | ≥80% unit coverage                               | `npm run test:ci` (workers workspace) |
| Student App (Flutter/Dart) | `flutter test`                     | ≥80% line coverage                               | `flutter test --coverage`             |
| Content Engine (Python)    | pytest                             | ≥80% (`--cov`)                                   | `pytest -q --cov`                     |
| Database SQL               | pg-tap / Supabase regression suite | All RLS policies covered                         | `npm run test:supabase`               |

---

## Test Environments

### Dual-DB Pattern

| Env         | Supabase Project     | Purpose                                            |
| ----------- | -------------------- | -------------------------------------------------- |
| Development | `QuesterixDB` (prod) | Local dev only — never run E2E against this        |
| E2E / CI    | `QuesterixDB-test`   | Staging project; E2E and regression tests run here |

E2E tests connect via `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` pointed at the test project.  
SQL regression tests connect via `TEST_DB_URL` (full Postgres connection string).

**Rule**: Never run destructive tests (DELETE, truncate, publish_curriculum) against the production DB.

---

## Shared Test Infrastructure

| Artifact                | Purpose                                                                                | Location                                  |
| ----------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------- |
| `test-utils.ts`         | `TEST_USERS` constants + `login()` helper                                              | `admin-panel/tests/`                      |
| `supabase-factory.ts`   | Chainable Supabase mock client                                                         | `admin-panel/src/__tests__/mocks/`        |
| `questions.ts` fixtures | One fixture per question type                                                          | `admin-panel/tests/fixtures/`             |
| POM classes             | `LoginPage`, `DomainsPage`, `SkillsPage`, `QuestionsPage`, `GroupsPage`, `PublishPage` | `admin-panel/tests/pom/`                  |
| Actions layer           | `createDomain()`, `createSkill()`, `createQuestion()`, `publishCurriculum()`           | `admin-panel/tests/actions/curriculum.ts` |

---

## E2E Suite Structure

### Smoke Suite (P0 — runs on every PR, ~10 min)

| Spec                               | Coverage                 |
| ---------------------------------- | ------------------------ |
| `auth-flow.e2e.spec.ts`            | AP-AUTH-001..011         |
| `rbac-guards.e2e.spec.ts`          | AP-RBAC-001..006         |
| `curriculum-lifecycle.e2e.spec.ts` | CL-001..004 (happy path) |

### Full Suite (main + nightly, ~35 min)

All smoke specs above, plus:

| Spec                      | Coverage                                  |
| ------------------------- | ----------------------------------------- |
| `mentor-hub.e2e.spec.ts`  | AP-MENTOR-001..006                        |
| `rls-bypass.e2e.spec.ts`  | DB-RLS-001..006 + tenant isolation        |
| `bulk-import.e2e.spec.ts` | 4 import scenarios                        |
| `apps.e2e.spec.ts`        | Full CRUD + validation                    |
| `admin-panel.e2e.spec.ts` | Legacy curriculum CRUD                    |
| `accessibility.spec.ts`   | WCAG 2.1 AA (critical/serious violations) |
| `responsiveness.spec.ts`  | No horizontal overflow on key pages       |

---

## Test Conventions

### Selectors (Playwright)

- **Prefer**: `data-testid` attributes (added via systematic sweep in Phase 9)
- **Fallback**: ARIA roles (`getByRole()`) or stable text content (`getByText()`)
- **Avoid**: CSS class selectors, XPath, nth-child

### Mock Strategy (E2E)

- Use `page.route('**/rest/v1/<table>**', ...)` to intercept Supabase REST calls
- Assert on **persistent DOM state** — lists, badges, counts — not transient toasts
- Pull in real `TEST_USERS` credentials for auth; mock DB reads for everything else

### Mock Strategy (Vitest)

- Use `mockSupabaseClient()` from `supabase-factory.ts`
- Use `vi.fn()` for edge function calls
- Use `expect.objectContaining()` for partial metadata assertions

### Flutter Testing

- Use `ProviderContainer` with Riverpod overrides for state isolation
- Use `MockDatabase` from `test/helpers/mock_database.dart` for Drift DB tests
- Widget tests: `tester.pumpAndSettle()` after async operations

---

## QA Health Dashboard

Run after test suites to generate `docs/reports/TEST_COVERAGE.md`:

```bash
node scripts/generate-test-report.js
# In CI (exit 1 if thresholds not met):
node scripts/generate-test-report.js --ci
```

---

## Gaps to Close (as of 2026-02-21)

Tracked in `docs/TEST_PLAN.md` Section B (coverage map). Key P1 gaps:

- Full invitation code → registration → JWT claims chain (SYS-004)
- `publish_curriculum` RPC integration test (SYS-001 step 3)
- Flutter: assignment appears in Student "My Assignments" view (SYS-005)
- AI governance settings E2E (Super Admin only — SYS-003)

See also `docs/TEST_PLAN.md` Section E for `data-testid` and seeder gaps.
