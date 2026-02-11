## 2026-02-11: Parallel Agent Productivity Suite & Automated Certification

### Session Context

- **Objective**: Parallelize repetitive agent tasks to reduce wall-clock time and token consumption during `/process` and `/certify` cycles.
- **Scope**: PowerShell automation, Husky hooks, certification artifacts, monorepo verification.
- **Outcome**: ✅ 5 parallelized scripts implemented. `/process` and `/certify` workflows updated. Pre-push hook upgraded to use `preflight.ps1`.

### What Was Done

1. **Parallel Preflight Validation (`preflight.ps1`)**
   - Bundled `tsc --noEmit`, `npm run lint`, `flutter analyze`, and `deps:validate` into parallel PowerShell jobs.
   - Reduced verification wall-clock time from ~5 mins to ~90 seconds.

2. **Automated Certification Evidence (`certify-evidence.ps1`)**
   - Implemented "Phase 0" for the `/certify` workflow.
   - Orchestrates tests, build metrics, and hygiene scans in parallel, outputting to timestamped artifact directories.

3. **Code Hygiene Scanner (`code-hygiene-scan.ps1`)**
   - Automated detection of empty catch blocks, hardcoded secrets, and service role leakage.
   - Replaced manual `grep` commands with structured parallel scanning.

4. **Workflow Hardening**
   - Updated `.agent/workflows/process.md` and `.agent/workflows/certify.md` to enforce the use of these scripts.
   - Upgraded `.husky/pre-push` to run `preflight.ps1`, ensuring global quality before any push.

### What Was Learned

1. **PowerShell Job Isolation**: Background jobs (`Start-Job`) run in a separate process. **Rule**: Always pass paths as arguments and use `Resolve-Path` to ensure absolute path consistency across different working directories.
2. **The "Silent Fail" Job Hazard**: PowerShell jobs don't automatically report exit codes to the parent. **Rule**: Use `exit $LASTEXITCODE` inside the script block and check `$job.ChildJobs[0].ExitCode` in the parent loop.
3. **IO Contention**: When multiple jobs write to the same log directory, ensure unique filenames (e.g., `JobName.log`) to prevent lock conflicts.
4. **Token ROI vs. Time ROI**: Automation saves modest tokens (~10-20%) but massive wall-clock time (~50-70%). The real value is in iteration velocity and developer focus, not just LLM cost reduction.

---

## 2026-02-11: Admin Panel Test Suite Stabilization & Coverage Recovery

### Session Context

- **Objective**: Resolve critical failures in the Admin Panel test suite (Vite/Vitest) and recover from a "false confidence" of 100% coverage.
- **Scope**: `admin-panel/src/__tests__/`, Vitest mocking, asynchronous hook testing, file parsing validation.
- **Outcome**: ✅ 7 critical test files fixed and stabilized. 100% pass rate restored for curriculum validation and bulk import logic.

### What Was Done

1. **Syntax & Infrastructure Repairs**
   - Eliminated illegal `await import()` calls inside synchronous `describe` blocks across `sanitize.test.ts` and `file-parsers.test.ts`. These were causing silent execution failures or esbuild crashes.
   - Refactored to standard top-level imports and used `vi.mocked()` for type-safe mocking of external libraries (`DOMPurify`, `pdfjs-dist`, `mammoth`).

2. **Asynchronous Hook Stabilization (`useBulkImport`)**
   - Implemented `vi.useFakeTimers()` to handle `setTimeout` progress resets.
   - Added `vi.advanceTimersByTime(1000)` to verify progress cleanup without introducing brittle `waitFor` delays.

3. **Schema & Validation Accuracy**
   - Corrected `import-schema.test.ts` to match Zod's native error strings ("Expected boolean" vs custom messages).
   - Fixed UUID validation tests that were using valid patterns as negative cases.

4. **Browser API Mocking Fixes**
   - Replaced `vi.stubGlobal('URL', ...)` with `vi.spyOn(globalThis.URL, ...)` in `data-utils.test.ts`. This ensured better isolation and prevented state leakage between tests.

### What Was Learned

1. **The "Describe-Sync" Constraint**: Vitest and Jest do not support top-level `await` or `await import` inside `describe` blocks if the wrapper isn't async. **Rule**: Always use standard imports and `vi.mock` at the top level.

2. **Ephemeral UI State Hazard**: Toasts and progress bars that auto-dismiss via `setTimeout` are the primary source of race conditions in unit tests. **Rule**: Use fake timers (`vi.useFakeTimers`) for any test involving progress tracking or transient notifications.

3. **Zod Error Precision**: When testing Zod schemas, if a custom `.error()` message isn't provided, Zod defaults to its internal error engine. Tests must match the *actual* generated string.

4. **Global Mock Poisoning**: Using `stubGlobal` can poison the global environment for other tests. `vi.spyOn` on `globalThis` is generally safer as it leverages Vitest's automatic restoration.

---

## 2026-02-11: Backend Testability & Pure Unit Testing Strategies

### Session Context

- **Objective**: Refactor Supabase Edge Functions for better testability and implement "pure" unit tests for browser-side utilities.
- **Scope**: `supabase/functions/`, `admin-panel/src/lib/data-utils.ts`, Deno dependency injection.
- **Outcome**: ✅ Edge Functions refactored to handler pattern. `data-utils` coverage expanded to 100% with zero external library mocks.

### What Was Done

1. **Edge Function Handler Pattern**
   - Refactored `index.ts` files in `supabase/functions` to separate core logic into a `handler` function.
   - Guarded `Deno.serve` with `if (import.meta.main)` to allow importing without side effects.
   - Switched from global `fetch` dependency to passing mocks directly into the handler.

2. **Pure Browser Mocking (`data-utils`)**
   - Replaced complex global mocks with a "Pure Unit Test" environment in `data-utils.test.ts`.
   - Used `Object.defineProperty` to manually stub `Blob`, `URL`, and `document` properties.
   - This approach eliminated flakiness caused by Vitest's `stubGlobal` not correctly cleaning up `globalThis`.

3. **CSV Parsing Edge Cases**
   - Added exhaustive tests for CSV parsing: escaped quotes (`""`), quoted newlines, and trailing commas.
   - Verified that the manual parser handles whitespace trimming and column count mismatches correctly.

4. **TypeScript & Test Hygiene**
   - **Type Narrowing**: Fixed `profile?.app_id` (null) to `profile?.app_id ?? undefined` to satisfy strict string types.
   - **Variable Shadowing**: Fixed `result` shadowing in `renderHook` act blocks by renaming testing variables to `toastResult`.
   - **Mock Alignment**: Synchronized `useAIGenerator` mocks with the full `AIQuestion` interface (adding `points`, `correct_answer`, `explanation`).

### What Was Learned

1. **Dependency Injection (DI) in Edge Functions**: The "Handler" pattern is the single most effective way to test Deno functions. By passing a `deps` object into a pure function, you can test complex AI workflows in milliseconds.

2. **Hard-coded Globals vs. Library Mocks**: For small, browser-centric utilities, manually defining the DOM interface (`document.createElement`) in the test file is more robust than relying on `jsdom`.

3. **import.meta.main is Essential**: In Deno, this is critical for hybrid files that act as both executable services and testable libraries.

4. **Shadowing Kills Traceability**: Renaming the `result` from `renderHook` or `act` to something specific like `hookResult` or `mountResult` prevents cryptic "used before declaration" errors in TypeScript.

### Preventative Measures (The "Always/Never" List)

- **ALWAYS** use `vi.useFakeTimers()` for any component with a progress bar or auto-dismissing toast.
- **ALWAYS** guard `Deno.serve` with `if (import.meta.main)` in Edge Functions.
- **ALWAYS** verify mock data against Zod schemas used in the `src` code to prevent "API shape matches but client code crashes" bugs.
- **NEVER** use `await import()` inside a synchronous `describe` block.
- **NEVER** use `stubGlobal` if `vi.spyOn` or `Object.defineProperty` is an option; it's too easy to leak state.
- **NEVER** shadow the `result` variable in a test; call it `hookState` or similar.

---

## 2026-02-11: Minimal Viable Automation (MVA) Implementation

### Session Context

- **Objective**: Implement a high-speed, cross-platform testing and quality strategy that enforces standards without slowing down development.
- **Scope**: Husky hooks, lint-staged, root package.json, monorepo path management.
- **Outcome**: ✅ Pre-commit hooks (<5s) and Pre-push hooks (<30s) implemented. Setup scripts for Bash/PowerShell created.

### What Was Done

1. **Monorepo Hook Infrastructure**
   - Created root-level `package.json` to manage Husky and lint-staged centrally.
   - Configured `.lintstagedrc.json` to handle path stripping for `student-app` (Flutter) and specific config for `admin-panel` (Vite).
   - Created `.husky/pre-commit` (lint-staged) and `.husky/pre-push` (typecheck/analyze).

2. **Cross-Platform Setup Scripts**
   - `scripts/setup-automation.sh` and `scripts/setup-automation.ps1` to initialize hooks on any OS.

### What Was Learned

1. **The "Check Overkill" Trap**: Anything > 10s in pre-commit will be bypassed. Keep it to fast linting/formatting.
2. **Monorepo Path Handling**: `lint-staged` passes absolute paths. Learned to run commands from sub-directories to find configs.

---

## 2026-02-10: Security Tooling Integration & plpgsql_check Bug Discovery

### Session Context

- **Objective**: Automate security scanning (Gitleaks, Dependabot, Semgrep, pgTAP) and validate database function integrity.
- **Scope**: CI workflows, pre-commit hooks, Supabase functions, Student App performance.
- **Outcome**: ✅ All security tools automated. 7 broken database functions discovered and fixed. Query performance bug resolved.

---

## 2026-02-09: Post-Merge Consolidation & Repository Hygiene

### Session Context
- **Objective**: Resolve final merge conflicts from `replit_branch`, unify `main`, and optimize agent performance.
- **Scope**: `admin-panel/` (Auth & Monitoring), `database.types.ts`, Git metadata.
- **Outcome**: ✅ Consolidated all features into `main`. Successfully deleted 7 stale branches. Recovered 317MB of agent memory via automated cleanup.

---

## 2026-02-09: Universal Intelligence & The Hybrid Oracle Architecture

### Session Context

- **Objective**: Consolidate conflicting architecture documents and move project knowledge from local files to a governed database SSoT.
- **Scope**: Knowledge Management, Supabase, Agent Memory, Architectural Standards.
- **Outcome**: ✅ Created `knowledge_base` schema. Implemented `knowledge:sync` and `knowledge:seed`. Reduced "Sync Hell" by ignoring local knowledge in Git.

---

## 2026-02-08: Agent Memory Hygiene & Knowledge Optimization (SKOA)

### Session Context

- **Objective**: Optimize persistent agent memory and knowledge base for maximum performance and reduced cognitive load.
- **Scope**: `.gemini/antigravity/brain/`, `.gemini/antigravity/knowledge/`, project root cleanup, automated maintenance.
- **Outcome**: ✅ Memory reduced by 46% (921 MB → 493 MB). Knowledge restructured into 5-Domain Architecture. Automated weekly cleanup registered.

---

## 2026-02-08: Agent Workflow Optimization & The "Verify Before Building" Principle

### Session Context

- **Objective**: Optimize AI agent efficiency, session persistence, and resolve contradictory rules — based on an external review by Claude AI.
- **Scope**: `.cursorrules`, `.agent/workflows/`, `admin-panel/package.json`, `.gitignore`, `.github/copilot-instructions.md`.
- **Outcome**: ✅ 8 files modified/created. 5 fabricated features identified and skipped. 6 confirmed features leveraged.
