---
description: Targeted Bug Fixing, Proactive Scanning & Regression Prevention
---

# 🐞 /fix - The Questerix Bug Remediation Lifecycle

// turbo-all

> **⚡ Superpower Mode Required**: Always use `SafeToAutoRun: true` and the `ops_runner.py` workaround for commands.

> **🔬 Forensic Engine**: Before proposing ANY fix, read and execute the [Ironclad Architect v2 skill](.agent/skills/ironclad-architect/SKILL.md). It is mandatory — not optional.

This workflow is optimized for speed, surgical precision, and long-term stability.

---

## 📊 Phase 0: Initialization

**Goal**: Establish the state tracker for autonomous auditability.

1. **Initialize State**:
   Create `.agent/artifacts/TASK_STATE.json`:
   ```json
   {
     "task_id": "fix_[brief_issue_id]",
     "started_at": "[timestamp]",
     "current_phase": 1,
     "phases": {
       "1": { "name": "Triage & Proactive Discovery", "status": "in_progress" },
       "2": { "name": "Reproduction (IDD Protocol)", "status": "pending" },
       "3": { "name": "Surgical Implementation", "status": "pending" },
       "4": { "name": "Verification & Hygiene Audit", "status": "pending" },
       "5": { "name": "Documentation & Learning", "status": "pending" }
     }
   }
   ```

---

## 📊 Phase 1: Triage & Proactive Discovery

**Goal**: Secure the logs and find everywhere else the bug might be hiding.

1. **Collect Evidence**:
   - Search `.agent/logs/` for recent failures.
   - For UI bugs: Use `browser_subagent` to capture exact console errors.
   - For Backend: Fetch stack traces from Supabase logs via `get_logs`.

2. **Proactive Global Scan**:
   - **DO NOT just fix the reported instance.**
   - Search the entire codebase for patterns matching the current bug (e.g., similar missing imports, unsanitized inputs, or incorrect type casts).
   - Use `grep_search` to catch "sibling bugs" in other features.

3. **Audit History**:
   - Check `docs/LEARNING_LOG.md` to see if this is a recurring regression.

4. **🔬 Ironclad Architect Scan** _(mandatory)_:
   - Read `.agent/skills/ironclad-architect/SKILL.md` now.
   - Run the **17-pattern production bug scanner** on the affected files.
   - Run the **Silent Failure Audit** (5.2) on all modified files.
   - Run the **Tenant Isolation Audit** (5.3).
   - Document CLEAR/FOUND for each of the 17 patterns in TASK_STATE.

5. **🔍 REFACTOR SAFETY SCAN** _(mandatory when any refactoring is planned)_:
   Before touching any file, read the **whole function** you're changing, not just the lines near the bug. Check:
   - Are there **redundant patterns** that will conflict with your fix? (e.g., don't add timeout logic to a function that already has a retry-with-backoff wrapping it)
   - Are there **unused imports** that will be stranded by your change? (`dart:math`, lodash, etc.)
   - Does the function have an **outer retry loop** AND an **inner retry helper**? If so, you must eliminate one — double-retry logic causes exponential attempt counts.
   - Are there **state guards** (`isSyncing`, `isLoading`) whose invariants your change might break?

**EXIT GATE**: TASK_STATE updated. Phase 1 → `completed`, Phase 2 → `in_progress`.

---

## 🛑 Phase 2: Reproduction (IDD Protocol)

**Goal**: Prove the bug exists with a failing test. **DO NOT ATTEMPT TO FIX UNTIL REPRODUCED.**

1. **Create Reproducer**:
   - Write a minimal failing test case (Unit or E2E) for the reported bug.
   - **Crucial**: Also create test cases for any "sibling bugs" found during Phase 1.
   - Test names must follow: `test_should_fail_when_<bug_scenario>`.

2. **🧪 Mock Discipline Check** _(mandatory for Dart/Flutter tests)_:
   Before writing mocks, check the **actual return type** of the method you are mocking:
   - Use `mcp_dart-mcp-server_hover` on the method to get its exact signature.
   - Never use `thenReturn` for a method that returns a `Future` — **always use `thenAnswer((_) => ...)`** to avoid the mocktail "use thenAnswer" runtime error.
   - If a method chains (e.g., `rpc().timeout()`), mock **both the outer call AND the chained method** together in `setUp`, not lazily.
   - When mocking a generic method (`rpc<T>`) without knowing `T` exactly, prefer `any()` matchers and let mocktail resolve it rather than hardcoding the generic.

3. **Confirm Failure**:
   - Run the tests and verify they fail with matching error signatures.

4. **3-Strike Rule**:
   - If the same test fails **3 consecutive times** with different errors while you're fixing mocks, **STOP** and re-read the API signature with `hover`. Do not keep guessing.

**EXIT GATE**: A set of failing test cases covering the reported bug and similar patterns.

---

## 🛠️ Phase 3: Targeted Implementation

**Goal**: Apply surgical fixes to ALL identified instances.

1. **Multi-File Surgery**:
   - Apply the fix to the primary bug and all "sibling bugs" discovered in Phase 1.

2. **IDD Guardrails**:
   - If the bug was a silent failure (swallowed error), add proper logging and rethrowing.
   - Replace any `catch (error: any)` with safe type-checked error handling.

3. **🔎 Post-Edit Correctness Checklist** _(run mentally after every file edit)_:
   - [ ] **Unused imports**: Did I remove a function whose sole consumer was an import? Remove the import too.
   - [ ] **Dead code**: Did I remove a loop or branch that was the only user of a helper variable? Remove the variable.
   - [ ] **Logic duplication**: After my fix, is this logic now applied twice (once in my new code, once in old code I didn't delete)? Fix it.
   - [ ] **Promise/Future discipline**: Did I wrap a `Future` return with `async/await` unnecessarily, or fail to `await` something important?
   - [ ] **State consistency**: If I set a state flag (`isSyncing = true`) at the top, is there a guaranteed path that clears it in every error/success branch (use `try/finally`)?

4. **Verify Fix**:
   - Run the reproduction tests. They must all pass now.

---

## 🧪 Phase 4: Verification & Quality Audit

**Goal**: Ensure zero-bug status and no regressions.

1. **Mandatory Regression Tests**:
   - **Rule**: If you fixed a bug, a new test must exist to prevent it from ever returning.
   - Every test must have a `reason:` argument explaining _what invariant it protects_.
   - Coverage targets for the modified code:
     - ✅ Happy path
     - ✅ Timeout / network error path
     - ✅ Concurrent call guard (e.g., `isSyncing` guard blocks double execution)
     - ✅ Dead Letter Queue promotion (items that exceed retry limit are marked `failed`)

2. **Full Platform Scan**:
   - Run `npx tsc --noEmit` and `npm run lint` (TypeScript).
   - Run `flutter analyze` (Dart).
   - Run `powershell .\scripts\preflight.ps1` for parallel validation.

3. **Architectural Guard**:
   - Run `npm run test:arch` to ensure the fix didn't violate feature isolation.

4. **IDD Silent Failure Hunt**:
   - Scan for empty `catch`/`except` blocks in modified files.
   - Verify that any `null` returns are explicitly handled.

5. **Security & Hygiene Scan**:
   - Run `powershell .\scripts\code-hygiene-scan.ps1`.
   - Ensure the fix didn't introduce secrets or insecure regex patterns.

6. **🔬 Final Ironclad Forbidden Pattern Scan**:
   - Re-read the Forbidden Patterns table in `.agent/skills/ironclad-architect/SKILL.md`.
   - Run it against the **final diff** of every modified file.
   - If ANY forbidden pattern is found, fix it before committing.
   - This step cannot be skipped — it is what catches the class of bugs introduced by this session (double retry, `thenReturn` for Future, unused imports after refactor).

**EXIT GATE**: All tests pass + 0 Silent Failures + Hygiene Scan Clear + Ironclad Forbidden Pattern Scan Clear.

---

## 📝 Phase 5: Documentation & Learning Loop

**Goal**: Update the Single Source of Truth.

1. **Update Learning Log**:
   - Document the Root Cause and the "Global Fix" list in `docs/LEARNING_LOG.md`.
   - Use the mandatory Learning Flag: `[need test]`, `[test created]`, or `[no test needed]`.
   - **If you had to self-correct during this session** (e.g., fixed the same test 3 times), document the pattern that tripped you up under a new `## Anti-Pattern` heading.

2. **Commit & Push**:
   - Use semantic commit: `fix: <description of bug and proactive fixes>`.
   - Push immediately with `git push --no-verify`.

3. **Close Task**:
   - Update `tasks.md` and remove the `.agent/artifacts/TASK_STATE.json` once fully pushed.

---

## ✅ Finalization

1. **Summary**: Provide the USER with the "Global Impact Report":
   - **Primary Bug**: Resolved
   - **Proactive Fixes**: List of other files/modules where sibling bugs were corrected
   - **Prevention**: Summary of tests added to catch this pattern globally
2. **Announcement**: **"Codebase stabilized. Pattern-based fixes and regression tests applied."**

---

## 🚫 Anti-Patterns (Hard Rules)

These are mistakes that have occurred in past sessions. They are permanently banned:

| Anti-Pattern                                      | Why It's Banned                                                                       | Rule                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Double retry logic                                | `retryWithBackoff` + outer recursive retry = up to 4× attempts, exponential hang time | If `retryWithBackoff` is present, remove any outer retry loop   |
| `thenReturn` for a Future-returning mock          | Throws at runtime in mocktail                                                         | Always use `thenAnswer((_) => Future.value(...))`               |
| Unused import after refactor                      | Fails `dart analyze`, `tsc --noEmit`                                                  | After removing a function's caller, always remove its import    |
| Bare throw in `main.tsx` before React mounts      | Results in a blank white page                                                         | Always render a native DOM fallback before throwing             |
| Catching the mock but not its chain               | `rpc()` returns a builder; the chain (`.timeout()`, `.select()`) must also be mocked  | In `setUp`, mock every chained accessor you expect to be called |
| Adding a timeout around an already-timed-out call | Creates unpredictable race between two timeout mechanisms                             | Read the whole function before adding timeouts                  |
