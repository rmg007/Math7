# Session 3: Fragility Engine + Verify Foundation — Implementation Brief

> **For**: Cursor AI (implementer)
> **Reviewed by**: Antigravity (will audit your output)
> **Estimated effort**: ~2.5 hours
> **Branch**: `cortex-v2/session-3`
> **Depends on**: Session 1 complete (cortex.db, Scanner graph)
> **Independent from**: Session 2 (can run in parallel)

---

## Codebase Context

- **CortexDB**: `questerix-cortex/src/cortex-db/index.ts` (Session 1)
- **normalizePath**: `questerix-cortex/src/utils/normalize-path.ts` (Session 1)
- **RiskScorer**: `questerix-cortex/src/risk-scorer/index.ts` — existing, 229 lines, 6 dimensions
- **Historian**: `questerix-cortex/src/historian/index.ts` — existing, 36 lines. **DO NOT MODIFY**
- **Admin panel path**: `admin-panel/` — for running `tsc` and test commands
- **tsc errors**: Currently **0** pre-existing errors. Direct pass/fail — no baseline needed

---

## Step 1: `cortex_fragility` Tool

Create logic in `questerix-cortex/src/mcp-server/tools/fragility.ts` (or wherever tools live from Session 2).

### Purpose

"Is file X historically dangerous?" — returns fragility data.

### Input

```json
{ "files": ["features/auth/hooks/use-auth.ts"] }
```

### Behavior:

1. **Normalize** input paths via `normalizePath()`
2. **Query** `fragility` table for each file
3. **Return**:
   ```json
   {
     "files": [
       {
         "file": "features/auth/hooks/use-auth.ts",
         "fragility_index": 0.42,
         "change_count": 15,
         "failure_count": 6,
         "confidence": "HIGH",
         "last_failure": "2026-02-20T10:30:00Z",
         "common_failure_pattern": "auth token expiry race condition"
       }
     ],
     "warnings": [
       "features/auth/hooks/use-auth.ts has HIGH fragility (0.42) — consider extra test coverage"
     ]
   }
   ```
4. **Warning threshold** (FIXED):
   - `fragility_index > 0.30` AND `change_count >= 5` → emit warning
   - Below threshold → include data but no warning

---

## Step 2: Fragility Attribution Logic

This is **triggered by `cortex_verify`** (Session 4) after tests complete. Build it as a standalone function that `cortex_verify` will call.

Create `questerix-cortex/src/mcp-server/fragility-engine.ts`:

### Function: `attributeFragility(db, changedFiles, testResults, sessionId)`

**Algorithm (FIXED)**:

```
For each changedFile:
  1. INCREMENT fragility.change_count
  2. If any test result failed:
     a. Walk edges backward from failing test to find which changedFile is a dependency
     b. For each attributed file:
        - INCREMENT fragility.failure_count
        - SET fragility.last_failure = now
        - SET fragility.common_failure_pattern = most recent failure message
  3. Recalculate fragility_index:
     - Pull last 20 change_log entries for this file
     - Count how many had failures
     - fragility_index = failures_in_window / total_in_window
  4. Update fragility.confidence:
     - change_count >= 10 → "HIGH"
     - change_count >= 5  → "MEDIUM"
     - change_count < 5   → "LOW"
  5. UPSERT into fragility table
```

### Rolling Window (FIXED):

- Window size: 20 changes
- Query: `SELECT tests_failed FROM change_log WHERE file_path = ? ORDER BY timestamp DESC LIMIT 20`
- `fragility_index = COUNT(WHERE tests_failed > 0) / COUNT(*)` over that window

### Why cached, not computed:

- `fragility_index` is a column, not a computed-on-read value
- It's recalculated by `cortex_verify` after every test run
- `cortex_fragility` reads it directly — no recomputation

---

## Step 3: `change_log` Write Logic

Create `questerix-cortex/src/mcp-server/change-logger.ts`:

### Function: `logChange(db, filePath, sessionId, testsPassed, testsFailed, failureDetails)`

Inserts a row into `change_log`:

```typescript
db.prepare(
  `
  INSERT INTO change_log (file_path, timestamp, session_id, tests_passed, tests_failed, failure_details)
  VALUES (?, ?, ?, ?, ?, ?)
`,
).run(
  normalizePath(filePath),
  new Date().toISOString(),
  sessionId,
  testsPassed,
  testsFailed,
  JSON.stringify(failureDetails),
);
```

---

## Step 4: `cortex_verify` Read Logic (Test Runner)

**Note**: The full `cortex_verify` tool is wired in Session 4. Here, build the **execution engine** that Session 4 will call.

Create `questerix-cortex/src/mcp-server/verify-engine.ts`:

### Function: `runVerification(db, changedFiles, adminPath, sessionId)`

**Steps (FIXED)**:

1. **TypeScript check**: Run `tsc --noEmit --incremental` with `cwd: adminPath`

   ```typescript
   const tscResult = execSync("npx tsc --noEmit --incremental", {
     cwd: adminPath,
     encoding: "utf-8",
     stdio: "pipe",
   });
   // Exit code 0 = pass, non-zero = fail
   ```

   ⚠️ **`cwd: adminPath`** is CRITICAL. Without it, tsc picks up the cortex tsconfig.
   ⚠️ **`stdio: 'pipe'`** is CRITICAL. Without it, tsc output corrupts the MCP channel.

   **Error handling**: `execSync` throws on non-zero exit code. Wrap in try/catch:

   ```typescript
   let tscPassed = true;
   let tscOutput = "";
   try {
     tscOutput = execSync("npx tsc --noEmit --incremental", {
       cwd: adminPath,
       encoding: "utf-8",
       stdio: "pipe",
     });
   } catch (err: any) {
     tscPassed = false;
     tscOutput = err.stdout + err.stderr;
   }
   ```

2. **Find targeted tests**: Query edges for `relationship = 'tests'` + `relationship = 'imports'` where target is in `changedFiles`

   ```sql
   -- Direct tests
   SELECT source_id FROM edges WHERE target_id = ? AND relationship = 'tests'
   UNION
   -- Tests of files that import the changed file
   SELECT e2.source_id
   FROM edges e1
   JOIN edges e2 ON e1.source_id = e2.target_id
   WHERE e1.target_id = ? AND e1.relationship = 'imports' AND e2.relationship = 'tests'
   ```

3. **Run targeted tests**:
   - **Unit tests**: `npx vitest run --reporter=json <test_file_1> <test_file_2>` with `cwd: adminPath`
   - **E2E tests**: `npx playwright test <test_file_1> <test_file_2> --reporter=json` with `cwd: adminPath`
   - Both with `stdio: 'pipe'`

4. **Parse results**: Extract pass/fail counts from JSON output

5. **Return** structured result for Session 4 to use:
   ```typescript
   return {
     tsc: { passed: tscPassed, output: tscOutput, errorCount: ... },
     unitTests: { passed: N, failed: N, details: [...] },
     e2eTests: { passed: N, failed: N, details: [...] },
     changedFiles: changedFiles
   };
   ```

### TypeScript Error Handling: Direct Pass/Fail (FIXED)

> As of v8, the codebase has **0 pre-existing TypeScript errors**.
> `cortex_verify` uses **direct pass/fail**: exit code 0 = pass, non-zero = fail.
>
> **No baseline strategy is needed.** If errors re-accumulate in the future,
> the `scan_meta` table supports a `tsc_error_baseline` key — but don't implement
> that logic now. Keep it simple.

---

## DO NOT List

- ❌ **Do NOT modify `Historian`** — it's a 36-line JSON wrapper, intentionally unchanged
- ❌ **Do NOT implement `cortex_plan`** — that's Session 4
- ❌ **Do NOT implement baseline tsc error counting** — 0 pre-existing errors, use direct pass/fail
- ❌ **Do NOT use `stdio: 'inherit'`** in any child process
- ❌ **Do NOT compute `fragility_index` on read** — it's a cached column, written by cortex_verify
- ❌ **Do NOT run the full test suite** when targeted tests are available
- ❌ **Do NOT modify `admin-panel/` code**

---

## Acceptance Criteria (What the Reviewer Will Check)

1. [ ] `cortex_fragility` returns fragility data for queried files
2. [ ] Warning threshold: `fragility_index > 0.30` AND `change_count >= 5`
3. [ ] Confidence levels: LOW (<5), MEDIUM (5-9), HIGH (≥10)
4. [ ] `attributeFragility` increments `change_count` for ALL changed files
5. [ ] `attributeFragility` increments `failure_count` only for files attributed to failures
6. [ ] Rolling window uses last 20 `change_log` entries for each file
7. [ ] `fragility_index` is recalculated and stored — not computed on read
8. [ ] `change_log` entries include session_id, timestamps, and failure details
9. [ ] `tsc` runs with `cwd: adminPath` (resolves to `admin-panel/`)
10. [ ] `tsc` uses direct pass/fail — no baseline logic
11. [ ] All `execSync` calls use `stdio: 'pipe'` and `encoding: 'utf-8'`
12. [ ] Targeted test selection uses graph edges (not full suite)
13. [ ] Unit and E2E tests run separately with proper reporters
14. [ ] `Historian` is completely untouched
15. [ ] Results return structured JSON with pass/fail counts
