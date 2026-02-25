# Session 2: MCP Server + Live Query Tools — Implementation Brief

> **For**: Cursor AI (implementer)
> **Reviewed by**: Antigravity (will audit your output)
> **Estimated effort**: ~3.5 hours
> **Branch**: `cortex-v2/session-2`
> **Depends on**: Session 1 complete (cortex.db schema + Scanner graph)

---

## Codebase Context

- **Cortex directory**: `questerix-cortex/`
- **New files go in**: `questerix-cortex/src/mcp-server/`
- **cortex.db location**: `questerix-cortex/outputs/cortex.db` (created by Session 1)
- **CortexDB class**: `questerix-cortex/src/cortex-db/index.ts` (created by Session 1)
- **normalizePath**: `questerix-cortex/src/utils/normalize-path.ts` (created by Session 1)
- **GitOracle**: `questerix-cortex/src/git-oracle/index.ts` — use for `git diff` ONLY
- **Scanner**: `questerix-cortex/src/scanner/index.ts` — has `scanFiles(paths)` (Session 1)
- **New dependency needed**: `@modelcontextprotocol/sdk` — install this

---

## Step 0: Install MCP SDK

```bash
cd questerix-cortex
npm install @modelcontextprotocol/sdk
```

This is the **only new dependency** for the entire Cortex v2 project.

---

## Step 1: MCP Server Skeleton

Create `questerix-cortex/src/mcp-server/server.ts`:

### Architecture (FIXED):

- **SDK**: `@modelcontextprotocol/sdk` (Node.js)
- **Transport**: `stdio` — REQUIRED for Cursor/VS Code compatibility
- **Session ID**: Generate UUID v4 at server startup, store in memory. Every `change_log` and `tool_calls` entry gets this UUID

### ⚠️ CRITICAL: stdio Safety Rule

In a stdio MCP server, `process.stdout` IS the MCP protocol channel (JSON-RPC). If child processes inherit stdout, their output **corrupts the protocol stream** and the IDE drops the connection.

**RULE**: Every `execSync` and `spawn` call inside the MCP server **MUST** use:

```typescript
execSync(cmd, { cwd: somePath, encoding: "utf-8", stdio: "pipe" });
```

**NEVER** use `stdio: 'inherit'`. **NEVER** let child process output reach `process.stdout`.

The existing `GitOracle` and `Scanner` both use `execSync` with `encoding: 'utf-8'` — this pattern is already proven. Apply it universally.

### Server startup pseudocode:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { v4 as uuidv4 } from "uuid";

const sessionId = uuidv4();
const server = new Server(
  { name: "cortex-mcp-server", version: "2.0.0" },
  { capabilities: { tools: {} } },
);
// ... register tools ...
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Step 2: `cortex_impact` Tool

### Purpose

"What breaks if I change file X?" — returns the blast radius.

### Input

```json
{ "files": ["features/auth/hooks/use-auth.ts", "lib/supabase.ts"] }
```

### Behavior (FIXED order):

1. **Normalize** all input paths via `normalizePath()`
2. **Delta scan** (graph freshness — see Step 4 below)
3. **Recursive CTE** — walk 2 hops upstream from each input file:
   ```sql
   WITH RECURSIVE impacted AS (
     SELECT source_id AS id, 1 AS depth
     FROM edges
     WHERE target_id = ? AND relationship = 'imports'
     UNION
     SELECT e.source_id, i.depth + 1
     FROM edges e
     JOIN impacted i ON e.target_id = i.id
     WHERE i.depth < 2 AND e.relationship = 'imports'
   )
   SELECT DISTINCT id, depth FROM impacted;
   ```
4. **Find test files** — query edges with `relationship = 'tests'` for all impacted files
5. **Get fragility** — join with `fragility` table for warnings
6. **Return** structured response:
   ```json
   {
     "affected_files": [...],
     "test_files": [...],
     "fragility_warnings": [...],
     "graph_freshness": "delta scan applied: 3 files re-scanned"
   }
   ```

### Edge direction reminder

"What depends on B?" → `WHERE target_id = B` (find everything that imports B)

---

## Step 3: `cortex_query` Tool

### Purpose

"Where is symbol Y used?" — find all consumers/importers of a symbol.

### Input

```json
{ "symbol": "useAuth" }
```

### Behavior: Suffix Match with Disambiguation (FIXED)

1. If input contains `#` → exact lookup: `WHERE id = ?`
2. If no `#` → suffix match: `WHERE id LIKE '%#' || ?`
3. Results:
   - **1 match** → return full dependency data (edges in + edges out)
   - **Multiple matches** → return all with file paths for disambiguation:
     ```json
     {
       "matches": [
         {
           "id": "features/auth/hooks/use-auth.ts#useAuth",
           "file": "features/auth/hooks/use-auth.ts"
         },
         {
           "id": "features/platform/hooks/use-auth-redirect.ts#useAuth",
           "file": "..."
         }
       ],
       "note": "Multiple symbols named 'useAuth'. Specify the file-qualified ID."
     }
     ```
   - **0 matches** → check if input matches a file-node ID (no `#`). If so, return that file's edges. If not, return empty with suggestion

---

## Step 4: Incremental Delta Scan

### Purpose

Keep the graph fresh between full `npm run health` scans.

### When it runs

Every `cortex_impact` call, **before** the CTE query.

### Behavior (FIXED):

1. Read `scan_meta.last_scan_commit`
2. Run `git rev-parse HEAD` — compare to stored commit
3. If different:
   a. `git diff --name-only --diff-filter=d <last_commit>` → modified/added files
   b. `git diff --name-only --diff-filter=D <last_commit>` → deleted files
   c. Filter to `admin-panel/src/` only (files outside graph scope are ignored)
   d. Re-scan modified/added via `Scanner.scanFiles(paths)` — resolves imports, refreshes edges
   e. Deleted files: `DELETE FROM nodes WHERE file_path = ?` + cascade-delete edges
   f. Update `scan_meta.last_scan_commit` to current HEAD
4. If same commit → skip (graph is fresh)

### GitOracle usage (FIXED):

- Use `execSync('git rev-parse HEAD', { cwd: projectRoot, encoding: 'utf-8' })` directly
- Use `execSync('git diff --name-only --diff-filter=d ...', { cwd: projectRoot, encoding: 'utf-8' })` directly
- **DO NOT call `GitOracle.ship()`** — it uses `git add .` which violates project rules
- GitOracle is used only for read-only operations. You can use its existing methods for `getRecentChanges()` and `getLastCommit()` if convenient, but verify they don't write anything

---

## Step 5: Graceful Degradation

### FIXED fallback responses:

| Scenario                  | Response                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `cortex.db` doesn't exist | `{ warning: "Graph not initialized. Run 'npm run health' first.", data: null }`                       |
| Graph is empty (0 nodes)  | `{ warning: "Graph is empty. Run 'npm run health' to populate.", data: null }`                        |
| DB file corrupted         | Catch SQLite error, delete `cortex.db`, return warning                                                |
| File not in graph         | `{ warning: "File not in graph — may be new, outside scope, or path mismatch.", affected_files: [] }` |
| Path normalization fails  | Log raw path, attempt best-effort match, return warning if no match                                   |

**Design principle**: Every tool returns a valid, parseable JSON response in ALL states. No unhandled errors. No stack traces.

---

## Step 6: Server Entry Point

Create `questerix-cortex/src/mcp-server/index.ts` as the CLI entry point:

```typescript
#!/usr/bin/env node
// Entry point for cortex-mcp-server (stdio transport)
```

Add to `questerix-cortex/package.json`:

```json
{
  "bin": {
    "cortex-mcp-server": "./dist/mcp-server/index.js"
  }
}
```

The server should be launchable via:

```bash
node questerix-cortex/dist/mcp-server/index.js
```

---

## DO NOT List

- ❌ **Do NOT use `stdio: 'inherit'`** in any child process — corrupts MCP protocol
- ❌ **Do NOT call `GitOracle.ship()`** — it uses `git add .`
- ❌ **Do NOT modify `admin-panel/` code**
- ❌ **Do NOT implement `cortex_plan`, `cortex_verify`, or `cortex_fragility`** — those are Sessions 3-4
- ❌ **Do NOT write to `change_log` or `fragility` tables** — that's Session 3
- ❌ **Do NOT add `console.log()` for debugging** — stdout is the MCP channel! Use stderr if you must log: `console.error('debug:', ...)`

---

## Acceptance Criteria (What the Reviewer Will Check)

1. [ ] `@modelcontextprotocol/sdk` installed in `package.json`
2. [ ] Server uses `stdio` transport (not HTTP, not WebSocket)
3. [ ] Session UUID generated at startup, stored in memory
4. [ ] `cortex_impact` normalizes paths, runs delta scan, then CTE query
5. [ ] CTE walks 2 hops with correct edge direction (`target_id = changed_file`)
6. [ ] `cortex_impact` returns affected files, test files, and fragility warnings
7. [ ] `cortex_query` implements suffix match with disambiguation
8. [ ] `cortex_query` falls back to file-node lookup on 0 symbol matches
9. [ ] Delta scan uses `--diff-filter=d` (modified) and `--diff-filter=D` (deleted)
10. [ ] Delta scan filters to `admin-panel/src/` only
11. [ ] Deleted files are pruned from nodes + edges
12. [ ] `scan_meta.last_scan_commit` is updated after delta scan
13. [ ] ALL `execSync` calls use `encoding: 'utf-8'` and NOT `stdio: 'inherit'`
14. [ ] No `console.log()` statements (stdout is MCP channel)
15. [ ] Graceful degradation for all 5 listed scenarios
16. [ ] Server starts and responds to MCP tool calls without crashing
17. [ ] `GitOracle.ship()` is never called from the MCP server
