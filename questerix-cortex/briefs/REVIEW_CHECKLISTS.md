# Cortex v2 — Review Checklists

> **For**: Antigravity (reviewer)
> **Purpose**: Structured audit of Cursor's implementation per session
> **Protocol**: After Cursor commits to a branch, open a fresh Antigravity chat,
> read this checklist, and systematically verify each item.

---

## How to Review

For each session:

1. Read the session brief for context
2. Run through the checklist item by item
3. For each item: ✅ (pass), ❌ (fail + note), ⚠️ (minor issue)
4. Compile findings into a list for Cursor to fix
5. After fixes, re-review only the failed items

---

## Session 1 Review Checklist

### Schema Verification

```sql
-- Run against cortex.db to verify structure
.tables
-- Should show: nodes edges change_log fragility scan_meta tool_calls

PRAGMA table_info(nodes);
-- id TEXT, type TEXT, file_path TEXT, metadata TEXT, updated_at TEXT

PRAGMA table_info(edges);
-- source_id TEXT, target_id TEXT, relationship TEXT, metadata TEXT

PRAGMA table_info(fragility);
-- file_path TEXT, change_count INTEGER, failure_count INTEGER,
-- fragility_index REAL, last_failure TEXT, common_failure_pattern TEXT, confidence TEXT

PRAGMA journal_mode;
-- Should return: wal
```

### Code Checks (grep/view these)

- [ ] **S1-01**: `cortex.db` created at `questerix-cortex/outputs/cortex.db`
- [ ] **S1-02**: WAL mode enabled: `this.db.pragma('journal_mode = WAL')`
- [ ] **S1-03**: Busy timeout set: `this.db.pragma('busy_timeout = 5000')`
- [ ] **S1-04**: All 6 tables created with EXACT column names from brief
- [ ] **S1-05**: UNIQUE constraint on edges: `(source_id, target_id, relationship)`
- [ ] **S1-06**: All 6 indexes created (edges: source, target, relationship; changelog: filepath, session; toolcalls: session)
- [ ] **S1-07**: `normalizePath` handles absolute Windows paths → relative
- [ ] **S1-08**: `normalizePath` handles `admin-panel/src/` prefix → strips it
- [ ] **S1-09**: `normalizePath` handles `src/` prefix → strips it
- [ ] **S1-10**: `normalizePath` handles `@/` prefix → strips it
- [ ] **S1-11**: `normalizePath` is idempotent (running twice gives same result)
- [ ] **S1-12**: `skipFileDependencyResolution: true` REMOVED from run.ts
- [ ] **S1-13**: `tsConfigFilePath` points to `admin-panel/tsconfig.json`
- [ ] **S1-14**: Scanner resolves `@/` imports to actual source files
- [ ] **S1-15**: Node IDs use normalized paths (not raw absolute paths)
- [ ] **S1-16**: Symbol node IDs use `path#symbolName` format
- [ ] **S1-17**: Edge `imports` direction: source=importer, target=imported
- [ ] **S1-18**: Per-file edge refresh: DELETE old + INSERT new for each file
- [ ] **S1-19**: Stale pruning in a transaction (nodes + orphan edges)
- [ ] **S1-20**: E2E test mapping creates `tests` edges
- [ ] **S1-21**: No `admin-panel/` source files modified

### Integration Test

```bash
cd questerix-cortex
npm run health  # Should complete without errors
# Then verify cortex.db has data:
# sqlite3 outputs/cortex.db "SELECT COUNT(*) FROM nodes;"
# sqlite3 outputs/cortex.db "SELECT COUNT(*) FROM edges WHERE relationship='imports';"
# sqlite3 outputs/cortex.db "SELECT COUNT(*) FROM edges WHERE relationship='tests';"
```

---

## Session 2 Review Checklist

### Code Checks

- [ ] **S2-01**: `@modelcontextprotocol/sdk` in `package.json` dependencies
- [ ] **S2-02**: Server uses `StdioServerTransport` (not HTTP)
- [ ] **S2-03**: Session UUID generated with `uuid.v4()` at startup
- [ ] **S2-04**: `cortex_impact` registered as MCP tool with correct schema
- [ ] **S2-05**: `cortex_query` registered as MCP tool with correct schema
- [ ] **S2-06**: `cortex_impact` calls `normalizePath()` on all input files
- [ ] **S2-07**: `cortex_impact` runs delta scan before CTE query
- [ ] **S2-08**: CTE uses `target_id = ?` (correct direction for "what imports this")
- [ ] **S2-09**: CTE depth limited to 2 hops
- [ ] **S2-10**: `cortex_impact` includes test files in response
- [ ] **S2-11**: `cortex_impact` includes fragility warnings in response
- [ ] **S2-12**: `cortex_query` implements suffix match: `LIKE '%#' || ?`
- [ ] **S2-13**: `cortex_query` returns disambiguation list for multiple matches
- [ ] **S2-14**: `cortex_query` falls back to file-node lookup on 0 symbol matches
- [ ] **S2-15**: Delta scan uses `--diff-filter=d` for modified files
- [ ] **S2-16**: Delta scan uses `--diff-filter=D` for deleted files
- [ ] **S2-17**: Delta scan filters paths to `admin-panel/src/` only
- [ ] **S2-18**: Deleted files pruned from nodes + cascade-delete edges
- [ ] **S2-19**: `scan_meta.last_scan_commit` updated after delta scan

### stdio Safety (CRITICAL)

- [ ] **S2-20**: ZERO `console.log()` calls in MCP server code
- [ ] **S2-21**: Every `execSync` uses `encoding: 'utf-8'`
- [ ] **S2-22**: Every `execSync` uses `stdio: 'pipe'` (or object form without 'inherit')
- [ ] **S2-23**: No `spawn` or `exec` with default (inherit) stdio
- [ ] **S2-24**: Debug logging uses `console.error()` or `process.stderr.write()` if present

### Graceful Degradation

- [ ] **S2-25**: Missing cortex.db → returns warning, not crash
- [ ] **S2-26**: Empty graph → returns warning, not crash
- [ ] **S2-27**: Unknown file → returns warning with empty affected list
- [ ] **S2-28**: Corrupted DB → catches error, returns warning
- [ ] **S2-29**: All responses are valid JSON

### GitOracle Safety

- [ ] **S2-30**: `GitOracle.ship()` is NEVER called from MCP server
- [ ] **S2-31**: All git commands are read-only (diff, rev-parse, log)

---

## Session 3 Review Checklist

### Fragility Engine

- [ ] **S3-01**: `cortex_fragility` returns fragility data for queried files
- [ ] **S3-02**: Warning threshold: `fragility_index > 0.30 AND change_count >= 5`
- [ ] **S3-03**: Confidence: LOW (<5), MEDIUM (5-9), HIGH (≥10) change_count
- [ ] **S3-04**: `attributeFragility` increments `change_count` for ALL changed files
- [ ] **S3-05**: `attributeFragility` increments `failure_count` only for ATTRIBUTED files
- [ ] **S3-06**: Attribution uses edge walk from failing test → dependency → changed file
- [ ] **S3-07**: Rolling window = last 20 `change_log` entries per file
- [ ] **S3-08**: `fragility_index` = failures_in_window / total_in_window
- [ ] **S3-09**: `fragility_index` is WRITTEN to DB (not computed on read)
- [ ] **S3-10**: `change_log` rows have: session_id, timestamp, pass/fail counts, failure details

### Verify Engine

- [ ] **S3-11**: `tsc` command: `npx tsc --noEmit --incremental`
- [ ] **S3-12**: `tsc` uses `cwd: adminPath` (resolves to `admin-panel/`)
- [ ] **S3-13**: `tsc` uses `stdio: 'pipe'` and `encoding: 'utf-8'`
- [ ] **S3-14**: `tsc` is direct pass/fail — NO baseline counting logic
- [ ] **S3-15**: Targeted test selection queries edges (not full suite)
- [ ] **S3-16**: Unit tests run via `vitest` with `--reporter=json`
- [ ] **S3-17**: E2E tests run via `playwright test` with `--reporter=json`
- [ ] **S3-18**: Both test runners use `stdio: 'pipe'`
- [ ] **S3-19**: Results return structured JSON with pass/fail counts
- [ ] **S3-20**: `Historian` module is UNTOUCHED (no imports, no modifications)

---

## Session 4 Review Checklist

### cortex_plan

- [ ] **S4-01**: Tier A default for small (<= 5 files), low-fragility changes
- [ ] **S4-02**: Tier B for >5 files OR any fragility > 0.30
- [ ] **S4-03**: Tier C for >10 files, fragility > 0.50, or STRUCTURAL_JSON_LIST
- [ ] **S4-04**: STRUCTURAL_JSON_LIST uses glob matching (verify: `vite.config.*` matches `vite.config.ts`)
- [ ] **S4-05**: `cortex_plan` returns: tier, label, reason, protocol, fragility_warnings, suggested_tests
- [ ] **S4-06**: `cortex_plan` integrates RiskScorer (risk_assessment in response)
- [ ] **S4-07**: `cortex_plan` does NOT run tests
- [ ] **S4-08**: `cortex_plan` writes to `tool_calls` table

### cortex_verify

- [ ] **S4-09**: `cortex_verify` calls verify engine → change logger → fragility attribution (this order)
- [ ] **S4-10**: `cortex_verify` writes to `tool_calls` table
- [ ] **S4-11**: `cortex_verify` returns verdict, tsc results, test results, fragility updates, duration_ms
- [ ] **S4-12**: `cortex_verify` does NOT classify tiers

### Compliance

- [ ] **S4-13**: `checkCompliance()` queries `tool_calls` for plan + verify counts
- [ ] **S4-14**: Compliance returns `compliant: true` only when both plan and verify were called

---

## Session 5 Review Checklist

### GEMINI.md

- [ ] **S5-01**: Cortex v2 protocol section added (cortex_plan + cortex_verify)
- [ ] **S5-02**: Tier A/B/C protocol documented
- [ ] **S5-03**: Key files table updated with cortex.db, MCP server, briefs
- [ ] **S5-04**: No existing GEMINI.md content deleted or modified

### Reporter

- [ ] **S5-05**: Health report includes Cortex v2 compliance section
- [ ] **S5-06**: Report shows plan/verify call counts
- [ ] **S5-07**: Report shows top 5 fragile files
- [ ] **S5-08**: Report shows graph statistics (nodes, edges, last scan)
- [ ] **S5-09**: Reporter doesn't crash when cortex.db is missing
- [ ] **S5-10**: Reporter doesn't crash when tables are empty

### Graceful Degradation (Full Audit)

- [ ] **S5-11**: cortex.db missing → all tools return warning
- [ ] **S5-12**: Empty graph → all tools return warning
- [ ] **S5-13**: File not in graph → warning, not error
- [ ] **S5-14**: DB locked → busy_timeout handles it
- [ ] **S5-15**: git unavailable → delta scan skips with warning
- [ ] **S5-16**: tsc unavailable → cortex_verify reports "unavailable"
- [ ] **S5-17**: No tests match → cortex_verify runs tsc only
- [ ] **S5-18**: Absolute Windows path → normalizePath handles it
- [ ] **S5-19**: `@/` prefixed path → normalizePath handles it

### Scope

- [ ] **S5-20**: Scope boundaries documented (covered vs. not covered)
- [ ] **S5-21**: E2E convention coverage documented (~26-32 of 64)
- [ ] **S5-22**: `npm run health` completes successfully

---

## Final Integration Test

After all 5 sessions, verify end-to-end:

```bash
# 1. Run health check — populates cortex.db
cd questerix-cortex && npm run health

# 2. Start MCP server
node dist/mcp-server/index.js
# (In a separate terminal, send tool calls via stdin JSON-RPC)

# 3. Verify cortex_plan response
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"cortex_plan","arguments":{"files":["features/auth/hooks/use-auth.ts"]}},"id":1}' | node dist/mcp-server/index.js

# 4. Verify cortex_impact response
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"cortex_impact","arguments":{"files":["features/auth/hooks/use-auth.ts"]}},"id":2}' | node dist/mcp-server/index.js

# 5. Check cortex.db has tool_calls entries
sqlite3 outputs/cortex.db "SELECT tool_name, result_tier FROM tool_calls ORDER BY timestamp DESC LIMIT 5;"
```
