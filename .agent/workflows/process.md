---
description: Unified Questerix Development Lifecycle
---

// turbo-all

# 🚀 /process - The Unified Questerix Lifecycle

> **⚡ Superpower Fallback**: If commands need approval, use `/sp` - I output JSON, you paste into `tasks.json`, watcher runs it.

This workflow governs the entire development cycle.
**Core Principle**: **"Document As You Go."**
- **Bug Fixed?** → Update `docs/LEARNING_LOG.md` immediately.
- **Phase Done?** → Update relevant `docs/*.md` immediately.

---

## 📊 Initialization

Before Phase 1, create `.agent/artifacts/TASK_STATE.json`:

```json
{
  "task_id": "[brief_task_name]",
  "started_at": "[timestamp]",
  "current_phase": 1,
  "plan_artifact": null,
  "phases": {
    "1": {"name": "Planning & Strategy", "status": "in_progress"},
    "2": {"name": "Database & Schema Evolution", "status": "pending"},
    "3": {"name": "Implementation & Quality Loop", "status": "pending"},
    "4": {"name": "Verification & Quality Audit", "status": "pending"},
    "5": {"name": "Finalization", "status": "pending"},
    "6": {"name": "Release", "status": "pending"}
  }
}
```

---

## 🛑 Phase 1: Planning & Strategy (Interactive)
**Goal**: Reach a 100% complete technical blueprint through expert-led consultation.
**Constraint**: **NO CODING ALLOWED.**

1.  **Explore & Audit**: Analyze the request against the current repository state and existing legacy patterns.
2.  **Expert Consultation (Team Mode)**: Communicate as a senior technical partner. Do not just "listen and obey"—Proactively challenge assumptions, suggest better architectural alternatives, and warn about potential downstream risks. Discuss until a "Gold Standard" plan is reached.
3.  **Threat Modeling** (IDD Protocol - Phase 2):
    *   **Generate exactly 5 failure vectors** (one from each category):
        1. **Input Abuse** (null, overflow, type coercion, Unicode)
        2. **State Corruption** (race conditions, stale data, partial writes)
        3. **Dependency Failure** (API timeout, 500, empty response, schema drift)
        4. **Resource Exhaustion** (memory leak, CPU spike, disk full, recursion depth)
        5. **Security Surface** (injection, auth bypass, data leakage in logs/errors)
    *   Document each as a **concrete scenario** in the implementation plan
    *   Cross-reference with `vulnerability_taxonomy.md` for known patterns
    *   See `docs/standards/ORACLE_COGNITION.md` for IDD Protocol details
4.  **Architectural Lockdown**: Explicitly identify the Design Patterns (e.g., Repository, Bloc, Factory) and SOLID principles. Justify why these patterns are the best choice for this specific feature.
5.  **Structural Map**: Define the file structure and strict module boundaries to prevent spaghetti growth.
6.  **Impact Analysis**: Explicitly state the impact on existing systems (Database, API, UI).
7.  **Edge Case Audit**: Document at least 3 edge cases and how they are handled.
8.  **Final Blueprint**: Produce a detailed Implementation Plan once consensus is reached.

**EXIT GATE**: USER gives explicit approval to proceed.
> **IMPORTANT**: Once approved, **PROCEED AUTONOMOUSLY** through Phases 2, 3, 4, and 5. Do not stop to ask for permission again until the final "Task Finished" announcement.

**State Update**: Update `TASK_STATE.json`:
- Phase 1: `status = "completed"`, `completed_at = [timestamp]`
- `plan_artifact = [path to plan markdown]`
- `current_phase = 2`

---

## 🏗️ Phase 2: Database & Schema Evolution
**Goal**: Secure, typed, and verified data foundation.

1.  **Migration Execution**: 
    *   Write and apply SQL migrations (`supabase db push` or equivalent).
    *   Ensure all constraints (Unique, Foreign Key, Check) match the plan.
2.  **RLS & Multi-Tenant Audit**:
    *   Implement/Update Row Level Security policies.
    *   **Verification**: Run SQL checks to ensure `app_id` isolation is enforced.
3.  **Type Synchronization**:
    *   **TypeScript**: Run `supabase gen types typescript` to update frontend interfaces.
    *   **Dart**: Update models/mappers in `questerix_domain` or `student-app` to match schema.
4.  **Seed Data Integrity**:
    *   Apply/Update `seed.sql` with realistic data.
    *   Verify that no constraint violations occur during ingestion.

**EXIT GATE**: Schema applied, RLS verified, and Types synchronized.

**State Update**: Update `TASK_STATE.json`:
- Phase 2: `status = "completed"`, `completed_at = [timestamp]`
- Add: `artifacts = [migration files, type files]`
- `current_phase = 3`

**Phase Documentation**:
- Update `docs/DATABASE_SCHEMA.md` (or equivalent) with new tables/columns immediately.

---

## 🛠️ Phase 3: Implementation & Quality Loop (Recursive)
**Goal**: Deliver clean, functional code that matches the plan.

1.  **IDD Test-First Protocol** (Before ANY Implementation):
    *   Write tests covering all 4 paths:
        ✅ **Happy Path** (2-3 normal use cases)
        💥 **Destructive Path** (all 5 threat vectors from Phase 1)
        ⏱️ **Boundary Path** (min/max/empty/single-element edge cases)
        🔄 **Idempotent Path** (repeated calls produce same result)
    *   Test naming: `test_<behavior>_when_<condition>_should_<outcome>`
    *   All tests MUST pass before moving to implementation
2.  **Execute**: Implement the approved plan in small, logical chunks.
3.  **Dependency & Bundle Hygiene**:
    *   Evaluate if the logic can be written in vanilla code before adding a new package.
    *   If a new dependency is added, verify its size and impact on build time/bundle size.
3.  **Quality Enforcement**:
    *   **Separation of Concerns**: Keep business logic out of UI files.
    *   **DRY & SOLID**: Refactor redundant logic into shared utilities or base classes.
    *   **Readability**: Use descriptive naming and avoid deep nesting (>3 levels).
4.  **Devil's Advocate Stress Test**:
    *   Simulate low-connectivity/offline states.
    *   Test "Rapid-Fire" scenarios (hitting buttons multiple times quickly).
    *   Verify handling of "Unexpected Nulls" or "Empty Data States".
5.  **Self-Review**: After each chunk, run static analysis and "hallucination check."
6.  **Fix Loop**: If errors, inconsistencies, or "spaghetti smells" are found, fix them immediately.
    *   **Micro-Postmortem**: If you fixed a bug, **IMMEDIATELY** add a bullet point to `docs/LEARNING_LOG.md` with the Root Cause and Fix.
7.  **Repeat**: Loop until all planned features are implemented and the Agent is 100% confident.

**EXIT GATE**: All code implemented, stress-tested, and refactored for quality.

**State Update**: Update `TASK_STATE.json`:
- Phase 3: `status = "completed"`, `completed_at = [timestamp]`
- Add: `files_modified = [count]`, `commits = [commit hashes]`
- `current_phase = 4`

**Phase Documentation**:
- if APIs/logic changed, update `docs/API.md` or relevant technical specs NOW.

---

## 🧪 Phase 4: Verification & Quality Audit
**Goal**: Zero-bug status, premium visual fidelity, and enterprise-grade safety.

1.  **Test Creation**: Write unit/integration/E2E tests as specified in the plan.
2.  **Multi-Tenant & Security Isolation**:
    *   **Data Leakage Check**: Verify that RLS policies explicitly filter data by `app_id` or `tenant_id`.
    *   **Session Isolation**: Test with different user sessions to ensure one tenant cannot see another's data.
3.  **IDD Silent Failure Hunt** (Phase 5 of IDD Protocol):
    *   **Scan for ambiguous error handling**:
        - Empty `catch`/`except` blocks (must log + rethrow OR return typed error)
        - Functions returning `null`/`undefined` where a typed error is more appropriate
        - Returning `0`, `''`, or `false` for both "not found" AND "actual zero/empty/false"
        - Missing input validation at public API boundaries
    *   **For each silent failure found**:
        a. Write a test that exposes the failure
        b. Fix the code (add logging, rethrow, or return typed error)
        c. Re-run all tests
    *   **Document**: "Silent failures found: [N]. All resolved."
4.  **Architectural Vulnerability Check**:
    *   Read `vulnerability_taxonomy.md` for patterns relevant to changed files
    *   Run detection methods for each applicable VUL-XXX pattern
    *   If new vulnerability discovered → Append to taxonomy with VUL-XXX ID
    *   Document results: "Verified: VUL-002 (Subject Leakage) - PASS"
5.  **Performance & Jank Audit**:
    *   Check for unnecessary re-renders (React) or frame drops (Flutter).
    *   Ensure expensive operations are run in background threads (Isolates/Workers).
    *   Verify virtualization/pagination for large lists.
6.  **Dependency Hygiene Check** (TypeScript/React only):
    *   Run: `npm run deps:validate` (from workspace root)
    *   Verify: No circular dependencies introduced by new code
    *   Verify: Feature isolation maintained (no cross-feature imports)
    *   **Proof**: Command output showing "no dependency violations found"
7.  **QA Loop**: Run tests. If any fail, fix the code and re-run.
    *   **Micro-Postmortem**: For every test failure fixed, **IMMEDIATELY** add an entry to `docs/LEARNING_LOG.md`.
7.  **Visual Design Audit (If UI changed)**:
    *   **Visual Inspection**: Use `browser_subagent` to capture screenshots of all modified screens.
    *   **Premium Critique**: Review for "Wow" factor: check gradients, glassmorphism, spacing consistency, and modern typography.
    *   **UX Fidelity**: Verify smooth transitions, responsive layouts, and intuitive button placement.
    *   **Accessibility Check**: Ensure contrast ratios and screen reader labels meet standards.
8.  **Repeat**: Loop until **100% of tests pass**, **Visuals are Premium**, and **Performance is Smooth**.
9.  **Evidence**: Provide a summary of passed tests (pass/fail counts) and **attach visual proof** (screenshots).

**EXIT GATE**: 100% Test Success, Security Verified, and Visual Design Approved.

**State Update**: Update `TASK_STATE.json`:
- Phase 4: `status = "completed"`, `completed_at = [timestamp]`
- Add: `tests_passed = [count]`, `visual_proof = [screenshot paths]`
- `current_phase = 5`

**Phase Documentation**:
- Capture any new test patterns or "gotchas" in `docs/TESTING.md` if applicable.

---

## 📝 Phase 5: Finalization (Learning & Docs)
**Goal**: Capture knowledge and update the Single Source of Truth.

1.  **Postmortem**: Complete the Bug Learning Loop for any issues caught during development.
    *   Update `docs/LEARNING_LOG.md`.
2.  **Documentation**: Update documentation in extreme detail.
    *   **Goal**: If this doc is given to another AI, they produce the exact same result.
    *   Follow the "Lean Docs" principle.
3.  **Git Push**: Stage, commit with a semantic message, and push to remote.

**EXIT GATE**: Registry/Docs updated and changes pushed.

**State Update**: Update `TASK_STATE.json`:
- Phase 5: `status = "completed"`, `completed_at = [timestamp]`
- Add: `git_push = true`, `docs_updated = [file paths]`
- `current_phase = 6`

---

## 🚀 Phase 6: Release (Deployment)
**Goal**: Secure and verified deployment.

1.  **Prompt**: Ask the USER: *"Would you like to deploy? If so, which application (Admin Panel / Student App / Landing Pages)?"*
2.  **Deploy**: Execute the specific deployment script for the chosen app.
3.  **Verify**: Perform a post-deployment smoke test.

**EXIT GATE**: Deployment successful or USER declined.

**State Update**: Update `TASK_STATE.json`:
- Phase 6: `status = "completed"`, `completed_at = [timestamp]`
- Add: `deployed = [true/false]`, `deployment_target = [app name]`

---

## ✅ Task Completion
**Goal**: Announce success.

1.  **Announcement**: State clearly: **"We have finished this task."**
2.  **Summary**: Provide a brief recap of what was achieved (Features, Tests Passed, Docs Updated).
