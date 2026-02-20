---
description: Targeted Bug Fixing, Proactive Scanning & Regression Prevention
---

# 🐞 /fix - The Questerix Bug Remediation Lifecycle

// turbo-all

> **⚡ Superpower Mode Required**: Always use `SafeToAutoRun: true` and the `ops_runner.py` workaround for commands.

This workflow is optimized for speed, surgical precision, and long-term stability.

---

## 📊 Phase 0: Triage & Proactive Discovery

**Goal**: Secure the logs and find everywhere else the bug might be hiding.

1. **Collect Evidence**:
   - Search `.agent/logs/` for recent failures.
   - For UI bugs: Use `browser_subagent` to capture exact console errors.
   - For Backend: Fetch stack traces from Supabase logs via `get_logs`.
2. **Proactive Global Scan**:
   - **DO NOT just fix the reported instance.**
   - Search the entire codebase for patterns matching the current bug (e.g., similar missing imports, unsanitized inputs, or incorrect type casts).
   - Use `grep_search` or `codebase_search` to catch "sibling bugs" in other features.
3. **Audit History**:
   - Check `docs/LEARNING_LOG.md` to see if this is a recurring regression.

---

## 🛑 Phase 1: Reproduction (IDD Protocol)

**Goal**: Prove the bug exists with a failing test. **DO NOT ATTEMPT TO FIX UNTIL REPRODUCED.**

1. **Create Reproducer**:
   - Write a minimal failing test case (Unit or E2E) for the reported bug.
   - **Crucial**: Also create test cases for any "sibling bugs" found during the Proactive Global Scan.
   - Test names must follow: `test_should_fail_when_<bug_scenario>`.
2. **Confirm Failure**:
   - Run the tests and verify they fail with matching error signatures.

**EXIT GATE**: A set of failing test cases covering the reported bug and similar patterns found.

---

## 🛠️ Phase 2: Targeted Implementation

**Goal**: Apply surgical fixes to ALL identified instances.

1. **Multi-File Surgery**:
   - Apply the fix to the primary bug and all "sibling bugs" discovered in Phase 0.
2. **IDD Guardrails**:
   - If the bug was a silent failure (swallowed error), add proper logging and rethrowing.
   - Replace any `catch (error: any)` with safe type-checked error handling.
3. **Verify Fix**:
   - Run the reproduction tests. They must all pass now.

---

## 🧪 Phase 3: Verification & Quality Audit

**Goal**: Ensure zero-bug status and no regressions.

1. **Mandatory Regression Tests**:
   - **Rule**: If you fixed a bug, a new test must exist to prevent it from ever returning.
   - Ensure the tests created in Phase 1 are robust enough to catch this in CI.
2. **Full Platform Scan**:
   - Run `npx tsc --noEmit` and `npm run lint`.
   - Run `powershell .\scripts\preflight.ps1` for parallel validation.
3. **Architectural Guard**:
   - Run `npm run test:arch` to ensure the fix didn't violate feature isolation.

**EXIT GATE**: All tests pass + No regressions + 0 Type/Lint errors.

---

## 📝 Phase 4: Documentation & Learning Loop

**Goal**: Update the Single Source of Truth.

1. **Update Learning Log**:
   - Document the Root Cause and the "Global Fix" list in `docs/LEARNING_LOG.md`.
   - Use the Learning Flag: `[test created]`.
2. **Commit & Push**:
   - Use semantic commit: `fix: <description of bug and proactive fixes>`.
   - Push immediately with `git push --no-verify`.

---

## ✅ Finalization

1. **Summary**: Provide the USER with the "Global Impact Report":
   - **Primary Bug**: Resolved
   - **Proactive Fixes**: List of other files/modules where sibling bugs were corrected
   - **Prevention**: Summary of tests added to catch this pattern globally
2. **Announcement**: **"Codebase stabilized. Pattern-based fixes and regression tests applied."**
