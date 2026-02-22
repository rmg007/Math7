---
description: Autonomous QA loop that continuously scans for coverage gaps, writes missing tests, runs them, fixes failures, and commits — until the suite is green or a circuit breaker triggers.
---

// turbo-all

# /qa-autoloop Workflow

## Overview

This workflow runs an autonomous, self-healing QA loop. Unlike `/test` (which is human-guided), `qa-autoloop` runs end-to-end with minimal intervention: scan → plan → write → run → fix → commit.

**Use when:**

- Onboarding a new feature area that has zero test coverage
- After a large refactor that broke multiple tests at once
- Running a nightly CI sweep to catch coverage regressions

**Do NOT use when:**

- You need to reason about architecture before writing tests (use `/test plan` first)
- A single known bug needs fixing (use `/fix`)

---

## Circuit Breakers 🔴

**Hard stop on ANY of the following:**

| Condition                                        | Action                          |
| ------------------------------------------------ | ------------------------------- |
| 5 consecutive test run failures on the same file | STOP and escalate to user       |
| 3 identical error messages in a row              | STOP — you're in a loop         |
| 25 total iterations (scan+write+run cycles)      | Checkpoint progress and STOP    |
| A single test times out > 60 seconds             | Kill it, log the hang, continue |
| 15 minutes wall-clock with no new green tests    | Checkpoint and escalate         |

When a circuit breaker fires, output:

```
⚠️ [CIRCUIT BREAKER]: {reason}. Saving progress and pausing for user review.
```

Then update `tasks.md` with `[/]` status on the in-progress item and stop.

---

## Phase 1: Scan

1. Read `docs/TEST_PLAN.md` sections B (Coverage Map) and E (Missing Instrumentation).
2. List all test IDs marked as **GAP** in Section B.
3. Rank gaps: P0 first, then P1, then P2.
4. Cross-reference with `tasks.md` to avoid duplicating completed work.
5. Pick the **top 3 P0 gaps** as targets for this loop iteration.

---

## Phase 2: Plan

For each target gap:

1. Identify the spec file it belongs to (create new if no file exists).
2. Identify what mock data or seed is needed.
3. Determine whether infra (POM, seed, factory) needs to be added first.
4. Write a ≤5-line description of the test: actor, precondition, actions, assertions.

---

## Phase 3: Write

For each planned test:

// turbo

1. Write the test following the conventions in `.agent/TEST_WRITING_GUIDE.md`.
2. If infra is missing, create it first (follow `/test infra` mode).
3. Use `page.route()` for Supabase REST mocks in E2E tests.
4. Assert on **persistent DOM state**, not transient toasts.
5. Add the test ID and description to `docs/TEST_PLAN.md` Section B.

---

## Phase 4: Run

// turbo
Run only the new/modified spec:

```bash
# Playwright
npx playwright test tests/<file>.spec.ts --reporter=list

# Vitest
npm run test -- --run --reporter=verbose src/features/<feature>/__tests__/<file>.test.tsx

# Flutter
flutter test test/features/<feature>/<file>_test.dart
```

Capture stdout. Proceed to Phase 5 if any tests fail.

---

## Phase 5: Fix

For each failure:

1. **Classify** the failure type:
   - Timing → add `waitForLoadState('networkidle')` or increase timeout
   - Wrong selector → find correct `data-testid` or ARIA role in the DOM
   - Mock mismatch → update mock response to match DB schema
   - Logic bug in source code → **STOP autoloop**, file as a bug, use `/fix`

2. Apply fix. Re-run the single failing test.

3. If still failing after fix → increment failure counter.
   - Counter ≥ 3 for same test → trigger circuit breaker.

4. If green → reset failure counter for that test.

---

## Phase 6: Commit

Once a batch of tests is green:

// turbo

```bash
git add admin-panel/tests/ admin-panel/src/**/__tests__/ student-app/test/ docs/
git commit -m "test: autoloop — add <test IDs> coverage"
git push
```

---

## Phase 7: Loop

1. Check circuit breakers (see above).
2. If not triggered: go back to **Phase 1** and pick the next 3 P0 gaps.
3. If all P0 gaps covered: move to P1.
4. If all P0+P1 covered: output a summary and **STOP** (don't start P2 without explicit approval).

---

## Summary Output Format

After each loop iteration (or on stop), output:

```
=== QA Autoloop Iteration N ===
Tests written: <N>
Tests passing: <N>
Tests failing: <N>
Circuit breakers triggered: <none|reason>
Coverage gaps closed: <list of test IDs>
Remaining P0 gaps: <list or "none">
Next action: <continue|stopped|escalate>
```

Update `tasks.md` to reflect `[x]` for completed gaps and `[/]` for in-progress ones.
