# 🧠 Cortex v2: Real-Time Codebase Intelligence via MCP (Design Document)

> **Vision**: Turn Cortex from a batch report generator into a **queryable intelligence layer** that any AI coding agent can consult mid-session. One system. One database. Five tools. Universal across IDEs.
>
> **Status**: Implementation Status & Design Document.
> **Reconciliation**: This document has been updated to reflect the _actual built implementation_ in `questerix-cortex`, discarding deprecated session estimates and addressing known architectural gaps.

---

## The Problem (Why This Exists)

Today, Cortex runs once, dumps markdown files, and the agent reads them at session start. During actual coding, the agent is **blind**:

| Failure Mode                  | Root Cause                                                   | Current Mitigation                         | Why It Fails                                                                           |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Structural Hallucination**  | Agent guesses which files are affected by a change           | `grep` for symbol names                    | Grep finds strings, not relationships. Misses re-exports, wrappers, indirect consumers |
| **"Agent Loading" Deadlocks** | IDE file watcher indexes every change in real-time           | `files.watcherExclude` in VS Code settings | Gaps in exclusions; no auto-healing mechanism                                          |
| **Regression Loops**          | Agent repeats the same mistake in historically fragile files | None — no failure memory                   | Agent treats every file as equally safe                                                |
| **Over-scoped Test Runs**     | Agent runs the full test suite for a 2-file change           | `npm run test`                             | 5-minute wait for feedback on a 10-second change                                       |
| **Ignored Protocols**         | Architect workflow is a markdown file agents can skip        | `.agent/workflows/`                        | No enforcement, no compliance verification                                             |

**The unified fix**: A Cortex MCP Server backed by local SQLite that agents query in real-time.

---

## Architecture: One Server, Five Tools

```
┌─────────────────────────────────────────────────┐
│                  AI Coding Agent                 │
│         (Antigravity / Claude / Copilot)         │
└──────────────┬──────────────────────┬────────────┘
               │  MCP Tool Calls     │  MCP Tool Calls
               ▼                     ▼
┌──────────────────────────────────────────────────┐
│              cortex-mcp-server                   │
│  Technology: @modelcontextprotocol/sdk (Node.js) │
│  Transport:  stdio (Cursor/VS Code compatible)   │
│                                                  │
│  cortex_impact   ─── "What breaks if I change X?"│
│  cortex_query    ─── "Where is symbol Y used?"   │
│  cortex_plan     ─── "Is my plan safe?"          │
│  cortex_fragility── "How risky is this file?"    │
│  cortex_verify   ─── "Run only affected tests"  │
│                                                  │
│  ┌──────────────────────────────┐                │
│  │   Path Normalization Layer   │                │
│  │  Strips workspace prefixes   │                │
│  │  Resolves @/ aliases         │                │
│  └──────────────────────────────┘                │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │         cortex.db (Local SQLite)           │  │
│  │  PRAGMA journal_mode=WAL                   │  │
│  │  nodes ─ edges ─ change_log ─ fragility   │  │
│  │  scan_meta ─ tool_calls                    │  │
│  └────────────────────────────────────────────┘  │
│                       ▲                          │
│   Import Resolver ────┘ (specifier → file path)  │
│   Scanner ────────────┘ (ts-morph ingest)        │
│   GitOracle ──────────┘ (diff correlation)       │
└──────────────────────────────────────────────────┘
```

### MCP Server Technology Decisions

| Decision           | Choice                                      | Rationale                                                                                                                                                         |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SDK**            | `@modelcontextprotocol/sdk` (Node.js)       | Same runtime as Cortex. No new language dependency. Direct access to Scanner internals                                                                            |
| **Transport**      | `stdio`                                     | Required by Cursor. Also supported by Claude Code, Copilot agents. Most universal option                                                                          |
| **Concurrency**    | SQLite WAL mode (`PRAGMA journal_mode=WAL`) | Parallel tool calls (e.g., `cortex_impact` + `cortex_fragility` in one message) would throw `SQLITE_BUSY` without WAL. WAL allows concurrent readers + one writer |
| **New dependency** | `@modelcontextprotocol/sdk` only            | `better-sqlite3` is already in `package.json`. No other new native dependencies                                                                                   |

### ⚠️ stdio Safety Rule (Session 2 Implementation Constraint)

> **Bug Prevention**: In a stdio MCP server, `process.stdout` is the MCP protocol channel (JSON-RPC). If child processes (spawned by `cortex_verify` for `tsc` or test runners) inherit stdout, their output **corrupts the protocol stream** and the IDE drops the connection.
>
> **Rule**: Every `execSync` and `spawn` call inside the MCP server **must** use `{ stdio: 'pipe' }` or `{ encoding: 'utf-8' }` to capture output. Never allow child processes to inherit stdout. The existing `GitOracle` and `Scanner` both use `execSync` with `encoding: 'utf-8'` — this pattern is already proven in the codebase. Apply it universally.
>
> **Note**: `GitOracle.ship()` uses `git add .` which violates project rules (`AGENTS.md` requires specific file staging). When wiring up GitOracle in Session 2, ensure `cortex_verify` never triggers `ship()`. GitOracle is used only for `git diff` and `git rev-parse` — read-only operations.
>
> This works fine in manual testing (`node server.js`) and **breaks silently** when Cursor launches via stdio. Treat as a hard constraint, not a recommendation.

### Tool Definitions

| Tool                              | Input                                                     | Output                                                                                                                                                                               | Replaces                             |
| --------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `cortex_impact(files)`            | List of file paths the agent plans to modify              | Affected files (2-hop), relevant test files, fragility warnings                                                                                                                      | Manual grep + guesswork              |
| `cortex_query(symbol)`            | A bare symbol name (e.g., `useAuth`) or file-qualified ID | All consumers, importers, and dependents. If bare name matches multiple nodes, returns all matches for disambiguation                                                                | `grep_search` for imports            |
| `cortex_plan(description, files)` | Natural language intent + target files                    | **triage tier classification** based on structural factors and fragility, recommended verification commands, warnings. Note: `RiskScorer` dimension integration is currently absent. | Reading stale `AGENT_CONTEXT.md`     |
| `cortex_fragility(file)`          | Single file path                                          | Change count, failure count, fragility index (0.0–1.0), recent failure patterns, confidence level                                                                                    | Nothing (new capability)             |
| `cortex_verify(files)`            | List of changed files                                     | Runs project-wide `tsc --noEmit --incremental` + mapped tests. **Mandatory Input Sanitization needed to prevent command injection**. Returns pass/fail.                              | Full `npm run test` (5 min → 30 sec) |

---

## Storage: Local SQLite Schema

All data lives in `questerix-cortex/outputs/cortex.db`. No remote dependencies. Works offline. Sub-10ms queries.

> **Design Decision**: `cortex.db` is a **separate database** from the existing `search.db`. This is intentional — `search.db` is read-heavy FTS (full-text search for skeleton lookups), while `cortex.db` is write-heavy graph + change tracking. Separating them prevents write contention and allows independent schema evolution.

> **Concurrency**: The database **must** be opened with `PRAGMA journal_mode=WAL` to handle cases where the agent makes parallel tool calls. Additionally, the batch Scanner (via `npm run health`) and the MCP server may access `cortex.db` simultaneously — see "Concurrent Write Safety" below.

### Tables

**`nodes`** — Every file, function, hook, component, and type in the codebase.

```sql
CREATE TABLE nodes (
  id          TEXT PRIMARY KEY,   -- File-qualified: "features/auth/hooks/use-auth.ts#useAuth"
                                  -- File nodes use path only: "features/auth/hooks/use-auth.ts"
  type        TEXT NOT NULL,      -- 'file' | 'function' | 'hook' | 'component' | 'type'
  file_path   TEXT,               -- Canonical relative path (from admin-panel/src/)
  metadata    TEXT,               -- JSON: { exports: [], line_range: [start, end], doc: "..." }
  updated_at  TEXT                -- ISO timestamp of last scan that touched this node
);
```

> **ID Convention**: Symbol-node IDs are file-qualified as `<relative_path>#<symbolName>` to prevent collisions. Example: two files both exporting `useQuery` become `features/curriculum/hooks/use-questions.ts#useQuery` and `features/auth/hooks/use-auth.ts#useQuery`. File-node IDs use the path alone (already unique).

**`edges`** — Relationships between nodes.

```sql
CREATE TABLE edges (
  source_id       TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  relationship    TEXT NOT NULL,   -- 'imports' | 'exports' | 'tests' | 'routes_to' | 'renders'
  metadata        TEXT,            -- JSON: { line: 42, alias: "AuthContext" }
  UNIQUE(source_id, target_id, relationship)
);
```

> **Edge Direction Convention**: `source` = the actor, `target` = the acted-upon.
>
> - `imports`: source=importer, target=imported. _"A imports B"_ → `source=A, target=B, relationship='imports'`.
> - `tests`: source=test*file, target=tested_module. *"auth.spec.ts tests useAuth.ts"\_ → `source=auth.spec.ts, target=use-auth.ts`.
> - `renders`: source=parent_component, target=child_component.
>
> **Impact query direction**: _"What breaks if I change file B?"_ → Find all nodes where `target_id = B` (everything that depends on B). The recursive CTE walks **upstream** from the changed file.
>
> **Edge values use resolved file paths**, not raw import specifiers. See "Import Specifier Resolution" below.

**`change_log`** — Every file modification tracked per session.

```sql
CREATE TABLE change_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path       TEXT NOT NULL,
  timestamp       TEXT NOT NULL,
  session_id      TEXT,            -- UUID generated per MCP server lifecycle (see Session Management)
  tests_passed    INTEGER,
  tests_failed    INTEGER,
  failure_details TEXT             -- JSON: [{ test: "auth.spec.ts", error: "..." }]
);
```

**`fragility`** — Cached risk scores per file. Updated by `cortex_verify`.

```sql
CREATE TABLE fragility (
  file_path               TEXT PRIMARY KEY,
  change_count            INTEGER DEFAULT 0,
  failure_count           INTEGER DEFAULT 0,
  fragility_index         REAL DEFAULT 0.0,    -- Cache: recalculated from rolling window on each cortex_verify
  last_failure            TEXT,                 -- ISO timestamp
  common_failure_pattern  TEXT,                 -- JSON: most frequent error types
  confidence              TEXT DEFAULT 'LOW'    -- 'LOW' (<5 obs) | 'MEDIUM' (5-15) | 'HIGH' (>15)
);
```

> **Stored vs. Computed**: `fragility_index` is a **cache column**, recalculated by `cortex_verify` after each test run using the rolling window over `change_log`. `cortex_fragility` reads the cached value directly. The index can be slightly stale between `cortex_verify` calls — acceptable because fragility changes only when tests run.

**`scan_meta`** — Tracks the last scan state for incremental updates.

```sql
CREATE TABLE scan_meta (
  key             TEXT PRIMARY KEY,   -- 'last_scan_commit' | 'last_scan_timestamp'
  value           TEXT NOT NULL
);
```

**`tool_calls`** — Persistent log for compliance verification.

```sql
CREATE TABLE tool_calls (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT NOT NULL,
  session_id  TEXT NOT NULL,
  tool_name   TEXT NOT NULL,       -- 'cortex_impact' | 'cortex_plan' | 'cortex_verify' | etc.
  parameters  TEXT,                -- JSON: the input parameters
  result_tier TEXT                 -- For cortex_plan: 'TIER_A' | 'TIER_B' | 'TIER_C'
);
```

> This table enables the compliance check. The Reporter (during `npm run health`) queries `tool_calls` joined with `change_log` by `session_id` to verify protocol adherence. Without this persistent log, compliance data is lost when the MCP server restarts.

### Why SQLite, Not Supabase

| Criteria                        | SQLite                          | Supabase (Remote Postgres)            |
| ------------------------------- | ------------------------------- | ------------------------------------- |
| Query latency                   | **< 5ms**                       | 200-500ms (network)                   |
| Works offline                   | **Yes**                         | No                                    |
| Multi-developer conflict        | None (per-machine)              | "Whose graph is truth?"               |
| Consistency with existing infra | `search.db` already uses SQLite | New dependency                        |
| Recursive CTEs                  | **Supported**                   | Supported                             |
| Maintenance cost                | **Zero** (embedded)             | Connection pooling, auth, schema sync |

> **Scale context**: The codebase has **~184 source files** (139 source + 44 unit test + 1 env.d.ts) with ~343 export statements. At this scale, even an in-memory adjacency list would work. SQLite is chosen for persistence across sessions (fragility history, change_log, compliance logs) — not for query performance at scale.

---

## Import Specifier Resolution (Session 1 — Critical Path)

> **Core Problem**: The current Scanner stores **raw module specifiers** from import statements — not resolved file paths. The `SURFACE_MAP.json` dependencies look like:
>
> ```json
> "App.tsx": ["./components/ErrorBoundary", "@/lib/supabase", "../hooks/use-domains"]
> ```
>
> But the `edges` table needs resolved paths: `source=App.tsx, target=components/ErrorBoundary.tsx`. Without resolution, every downstream tool returns garbage.

### Current Blocker: `skipFileDependencyResolution: true`

The Scanner initializes ts-morph with `skipFileDependencyResolution: true` (in `run.ts:99`). This flag was set for performance (faster scan) but it prevents `getModuleSpecifierSourceFile()` from resolving imports to their target files — the API returns `undefined`.

### Resolution Strategy: Remove the Flag + ts-morph Native Resolution

**Decision**: Remove `skipFileDependencyResolution: true` from the ts-morph Project constructor. This enables ts-morph's built-in module resolution, which:

- Reads `tsconfig.json` `paths` config (handles `@/*` → `./src/*` alias)
- Resolves relative paths from the importing file's directory
- Probes extensions (`.ts`, `.tsx`, `/index.ts`, `/index.tsx`)
- Handles barrel exports (`index.ts` re-exports)

**Trade-off**:

|                        | With `skipFileDependencyResolution: true` | Without (our choice)                |
| ---------------------- | ----------------------------------------- | ----------------------------------- |
| Scan speed (184 files) | ~1-2 seconds                              | ~3-5 seconds                        |
| Import resolution      | ❌ Manual reimplementation needed         | ✅ Native ts-morph                  |
| Alias handling (`@/`)  | ❌ Must parse tsconfig manually           | ✅ Automatic via tsconfig           |
| Extension probing      | ❌ Must implement file system probes      | ✅ Automatic                        |
| Correctness            | Fragile custom logic                      | Battle-tested TypeScript resolution |

For 184 files, the 2-3 second speed penalty is irrelevant. Building custom resolution logic would take 4-6 hours and be fragile. The flag removal is ~1 line change.

**Implementation**:

1. Remove `skipFileDependencyResolution: true` from the `new Project()` call.
2. Pass `tsConfigFilePath` pointing to **`admin-panel/tsconfig.json`** — NOT the cortex tsconfig.

   ```
   const project = new Project({
     tsConfigFilePath: path.resolve(projectRoot, 'admin-panel', 'tsconfig.json'),
     // skipFileDependencyResolution removed — ts-morph resolves imports natively
   });
   ```

   **Why this is critical**: The cortex tsconfig (`questerix-cortex/tsconfig.json`) has `moduleResolution: "node"` and no `paths` aliases. The admin-panel tsconfig has `moduleResolution: "bundler"` and `"paths": { "@/*": ["./src/*"] }`. Using the wrong tsconfig silently produces a graph with near-zero edges because all `@/` imports resolve to `undefined`.

   **Auto-include behavior**: When `tsConfigFilePath` is passed, ts-morph auto-includes files from the tsconfig's `include` patterns (`"include": ["src"]`). This means the existing `project.addSourceFilesAtPaths(...)` call becomes redundant (duplicates are no-ops). The implementation should note this and can remove the manual `addSourceFilesAtPaths` call.

3. **Session 1 smoke test (first 15 minutes)**: Before building anything, create a throwaway test script that:
   - Creates a `Project` with the admin-panel tsconfig.
   - Picks 3 files with `@/` imports (e.g., `App.tsx`, any page component, any hook).
   - Calls `getModuleSpecifierSourceFile()` on their imports.
   - Confirms the returned source files are non-null and have the expected paths.

   This validates that ts-morph's `bundler` module resolution mode works correctly. If it doesn't, you find out in 15 minutes — not at hour 4. Discard the script after validation.

4. In `Scanner.scanFiles(paths)`, for each import declaration:
   ```
   const targetSourceFile = importDecl.getModuleSpecifierSourceFile();
   if (targetSourceFile) {
     const resolvedPath = normalizePath(targetSourceFile.getFilePath());
     // Create edge: source=currentFile, target=resolvedPath, relationship='imports'
   }
   ```
5. If `targetSourceFile` is `undefined` (external package like `react`, `@supabase/supabase-js`), skip the edge — external deps are not in our graph.

**Impact on Session 1 estimate**: +1.5 hours for resolution logic integration + testing. Session 1 total revised to ~4.5 hours.

### Incremental Scan and Legacy Bottlenecks

1. Creates or reuses a long-lived ts-morph `Project` (initialized with `tsConfigFilePath: admin-panel/tsconfig.json`).
2. **Current implementation bottleneck**: `writeGraph()` currently fetches all `this.project.getSourceFiles()` and passes them to `scanFiles()`.
3. For ~184 files, this means every full scan re-parses and re-resolves all imports (which can take 10+ seconds). `refreshFromFileSystem()` is not strictly incremental at this scale.
4. Returns nodes/edges for the processed files.
5. The full `scan()` method still exists but possesses a legacy flaw: it stores raw specifiers in `map.dependencies`. Only `scanFiles()` → `writeGraph()` currently produces accurately resolved edges.

---

## Concurrent Write Safety (Batch Scanner + MCP Server)

> **Core Problem**: When `npm run health` runs, the Scanner does a full scan and writes to `cortex.db`. The MCP server may simultaneously be reading from `cortex.db`.

### Strategy: Upsert + Per-File Edge Refresh + Stale Pruning

1. **Full scans** use `INSERT OR REPLACE INTO nodes ...` for each node. No `DELETE FROM nodes` step.
2. Every node touched during the scan gets its `updated_at` set to the scan's timestamp.
3. **Edge refresh on re-scan**: When a file is re-scanned (full or incremental), **delete all edges where `source_id` matches that file**, then re-insert current edges. This handles the case where a file drops an import — the old edge is removed.
4. **After** all inserts complete, **prune stale nodes**: `DELETE FROM nodes WHERE updated_at < ?` (current scan timestamp).
5. Cascade-delete orphaned edges: `DELETE FROM edges WHERE source_id NOT IN (SELECT id FROM nodes) OR target_id NOT IN (SELECT id FROM nodes)`.
6. Steps 4-5 run in a **single transaction** so no query sees a partially-pruned state.

> **v6 Fix (Edge Refresh)**: The v5 plan only specified upsert for nodes and cascade-delete for orphaned edges. But when a file's imports _change_ (not deleted, just modified), the old edges persist alongside new ones. The per-file edge delete-then-reinsert on re-scan prevents stale edges from accumulating.

---

## Path Normalization Layer

> **Core Problem**: The Scanner indexes paths relative to `admin-panel/src/`. Agents pass workspace-relative or absolute paths. A direct lookup returns zero results.

### Strategy

Every MCP tool normalizes incoming paths before querying the database:

1. Convert backslashes to forward slashes.
2. Strip absolute prefix up to and including the project root.
3. Strip known relative prefixes: `admin-panel/src/`, `src/`.
4. Resolve `@/` aliases: replace `@/` prefix with empty string (since Scanner paths are already relative to `src/`).
5. The result is the canonical relative path used in `nodes.file_path`.

**Example transformations**:
| Agent Input | Normalized |
| --- | --- |
| `C:\Users\mhali\...\admin-panel\src\features\auth\hooks\use-auth.ts` | `features/auth/hooks/use-auth.ts` |
| `admin-panel/src/features/auth/hooks/use-auth.ts` | `features/auth/hooks/use-auth.ts` |
| `@/features/auth/hooks/use-auth.ts` | `features/auth/hooks/use-auth.ts` |
| `features/auth/hooks/use-auth.ts` | `features/auth/hooks/use-auth.ts` (no-op) |
| `supabase/functions/ai-generate/index.ts` | ⚠️ Outside graph scope — see "Known Scope Boundaries" |

Implemented once in a shared `normalizePath()` utility, called at the entry point of every tool.

---

## Graph Freshness Strategy

> **Core Problem**: If the graph only updates during `npm run health`, then `cortex_impact` queries a stale graph mid-session.

### Chosen Strategy: Incremental Delta Scan on Every `cortex_impact` Call

**How it works**:

1. `scan_meta` table stores the last git commit hash that was scanned. Note: The `upsertScanMeta` call currently occurs outside the database transaction, leading to minor potential desyncs if the upsert hits a crash.
2. When `cortex_impact` is called, the server:
   a. Runs `git rev-parse HEAD` and compares to `scan_meta.last_scan_commit`.
   b. Runs `git diff --name-only --diff-filter=d <last_scan_commit>` to get **modified/added files**.
   c. Runs `git diff --name-only --diff-filter=D <last_scan_commit>` to get **deleted files**.

> **⚠️ Delta Scan Blind Spot**: This mechanism ONLY covers **committed changes**. Workspace edits made by an agent mid-session are invisible to the graph until a commit happens. Future revisions should evaluate `git diff HEAD` (working tree) to resolve this real-time execution gap.

> **Latency**: For a typical 3-file change mid-session, the delta adds **~1-2 seconds** on Windows with OneDrive sync.

**Server architecture implication**: The MCP server holds a reference to the Scanner instance (`getScanner()` singleton). This keeps 184 ASTs in memory indefinitely — a noted memory pressure tradeoff lacking LRU eviction.

---

## E2E Test Mapping Strategy

> **Core Problem**: Unit tests import their modules directly (`tests` edges). E2E tests don't — they navigate to URLs, which render components. There's no import edge from `auth.spec.ts` to `useAuth.ts`.

### Phase 1: Convention-Based vs Manifest-Based

While the initial plan estimated 40-50% coverage using filename stem matching, **the implementation has already superseded this.**

The Scanner natively relies on `smoke-coverage-manifest.json` handles robust E2E test-to-page mappings. This resolves the complexity of matching cross-feature (\*.smoke.spec.ts) files manually and negates the need for raw naming conventions.

### Phase 2: Route-Based Mapping (Deferred)

Parse the React Router config to map URL paths → page components → import subtrees. Deferred indefinitely given the manifest success.

---

## `cortex_query` Symbol Resolution

> **Core Problem**: Node IDs are file-qualified (`path/to/file.ts#useAuth`), but agents call `cortex_query("useAuth")` with bare names.

### Strategy: Suffix Match with Multi-Result Disambiguation

1. If the input contains `#`, treat as a file-qualified ID and do an exact lookup.
2. If the input has no `#`, perform a suffix match: `WHERE id LIKE '%#' || ?`.
3. If **one** match → return full dependency data for that node.
4. If **multiple** matches → return all matches with their file paths, letting the agent disambiguate. Response: `{ matches: [{ id: "path/a.ts#useQuery", file: "path/a.ts" }, { id: "path/b.ts#useQuery", file: "path/b.ts" }], note: "Multiple symbols named 'useQuery'. Specify the file-qualified ID." }`
5. If **zero** matches → check if input matches a file-node ID (no `#`). If so, return that file's edges.

---

## The Surgical Architect Protocol (Triage-Based)

### Entry Point: `cortex_plan` Is the Universal Gateway

`cortex_plan` is the entry point for all non-trivial changes. It runs the decision tree internally and returns the tier. Tier A means "no further tool calls needed." The classification is made _by the tool_, not by the agent guessing.

**Agent behavior**: "I want to change these files" → call `cortex_plan(description, files)` → receive tier + guidance → follow tier protocol.

### `cortex_plan` Scope Correction

> **Architectural Divergence**: The originally planned `RiskScorer` health-dimension integration (evaluating typing, coverage, trajectory) is **absent** from the handler in `server.ts`.
>
> Furthermore, boundary checks (e.g., verifying `shared/`, `lib/`, `hooks/` structures) are NOT performed by the implementation. The Tier engine purely leverages file counts, extension structures, and raw fragility limits.

### Tier Classification: The Decision Tree (Inside `cortex_plan`)

```
function determineTier(files, edges, fragility):

  // Tier C — Surgical (check FIRST)
  if files.length > 10:
    return TIER_C
  if ANY file has fragility_index > 0.5:
    return TIER_C

  // Tier B — Moderate (default)
  if files.length > 5:
    return TIER_B
  if ANY file has fragility_index > 0.3:
    return TIER_B

  // Tier A — Trivial (Auto-Approve)
  // The implementation natively defaults to Auto-approve if it bypasses B & C
  // No explicit file-extension matching is utilized.
  return TIER_A

STRUCTURAL_JSON_LIST = [
  'package.json',
  'tsconfig.json',
  'tsconfig.*.json',
  'vite.config.*',
  '*.config.json',
  '*.config.ts',
  '*.config.js'
]
```

### Tier A: Trivial (Auto-Approve)

**Classification**: The implementation falls-through to A when < 5 files are modified with `< 0.3` fragility.

### Tier B: Moderate (Auto-Plan)

**Protocol**:

1. Agent calls `cortex_plan(description, files)` → receives TIER_B + blast radius + RiskScorer assessment.
2. If risk is LOW → auto-proceed.
3. If risk is MEDIUM → generate `SURGICAL_PLAN.md`, proceed with caution.
4. After completion → `cortex_verify(files)` with targeted tests.

### Tier C: Surgical (Human Gate)

**Protocol**:

1. Agent calls `cortex_plan(description, files)` → receives TIER_C + full 2-hop blast radius + fragility scores + RiskScorer assessment.
2. Agent generates `SURGICAL_PLAN.md` with:
   - Every file to be modified and why.
   - Fragility scores for each file.
   - RiskScorer dimensions (typeSafety, coverage, etc.).
   - Specific test commands to verify.
   - Potential breaking changes in downstream dependents.
3. **STOP. Wait for human confirmation.**
4. Post-confirmation → execute edits → `cortex_verify(files)`.

### Compliance Enforcement (Persistent + Verifiable)

Every tool call is logged to the `tool_calls` table in `cortex.db` (timestamp, session_id, tool_name, parameters, result_tier). This data **persists across server restarts**.

Post-session, the Reporter (during `npm run health`) queries `tool_calls` joined with `change_log` by `session_id`:

- Was `cortex_plan` called before modifications for this session?
- Were the modified files a subset of what was impact-checked?
- Was `cortex_verify` called after modifications?
- If not → flag as **"Protocol Violation"** in the Health Report.

---

## The Feedback Loop: `cortex_verify` → `change_log` → `fragility`

### `cortex_verify` is both a Read AND Write operation:

1. **Read**: Queries the `edges` table to find the minimal **test** set for the changed files. Runs `tsc --noEmit --incremental` (project-wide, direct pass/fail, **`cwd: adminPath`**) + only the mapped tests.

> **Working directory**: The MCP server runs from the cortex directory (or wherever the IDE launches it). All `tsc` and test runner commands must use `execSync('npx tsc --noEmit --incremental', { cwd: adminPath, encoding: 'utf-8' })` where `adminPath` resolves to `admin-panel/`. Without explicit `cwd`, tsc picks up the wrong tsconfig (cortex's, not admin-panel's) — same class of issue as the `tsConfigFilePath` requirement for Scanner.

2. **Write**: After tests complete, writes a `change_log` entry for each modified file:
   - `session_id`: Current MCP server UUID.
   - `tests_passed` / `tests_failed`: Counts from the test run.
   - `failure_details`: JSON array of failing test names + error messages.

3. **Trigger**: Runs fragility attribution:
   - For each failed test, trace back through `edges` to find which modified file is a dependency.
   - Increment `fragility.failure_count` for attributed files.
   - Increment `fragility.change_count` for **all** modified files (regardless of pass/fail).
   - Recalculate `fragility_index` using the rolling window over `change_log` (last 20 changes for that file).
   - Update `fragility.confidence` based on total `change_count`.
4. **Log**: Write a `tool_calls` entry for compliance tracking.

### TypeScript Error Handling: Direct Pass/Fail

> **v8 Update**: As of 2026-02-25, the codebase has **0 pre-existing TypeScript errors** — the ~380 errors from stale `database.types.ts` were resolved in recent quality improvement sessions. The baseline strategy from v6-v7 is no longer needed.
>
> **Strategy: Direct pass/fail**. `cortex_verify` runs `tsc --noEmit --incremental` with `cwd: adminPath`. If exit code is non-zero, it fails and reports the errors. No baseline, no masking trade-offs.
>
> **Future-proofing**: If pre-existing errors accumulate again (e.g., from a large `database.types.ts` regeneration), reintroduce the baseline strategy documented in the v7 revision. The `scan_meta` table already supports a `tsc_error_baseline` key for this purpose. But for now, direct pass/fail is simpler and more correct.

> **Performance note**: `tsc --noEmit --incremental` is always project-wide — TypeScript doesn't support single-file checking in project mode. With `--incremental`, cached rechecks take ~3-5 seconds. The real time savings come from running **fewer tests** (targeted via graph), not from tsc. Total for a typical 3-file change: `tsc --incremental` (~5s) + targeted tests (~10-15s) = **~20-25 seconds** vs. full suite (~5 minutes).

---

## Fragility Engine: Learning from Failure

### Attribution Logic

When `cortex_verify` runs and a test fails:

1. The modified files are already known (passed as input).
2. The failing test is traced through `edges` to find which modified file is its dependency.
3. That file's `fragility.failure_count` increments.
4. `fragility_index` is recalculated from the **rolling window**.

### Fragility Decay (Rolling Window)

**Strategy**: Use a **rolling window of the last 20 changes** per file for fragility calculation.

- `fragility_index` = failures in last 20 `change_log` entries for this file / min(change_count, 20).
- Old observations naturally "fall off" the window.
- The rolling window is computed by `cortex_verify` when it recalculates the cached `fragility_index` column.
- This is a **Session 3 implementation detail**.

### Confidence Thresholds

| Observations (total) | Confidence | Agent Behavior                                                                         |
| -------------------- | ---------- | -------------------------------------------------------------------------------------- |
| < 5 changes          | LOW        | Score shown but not used for warnings                                                  |
| 5–15 changes         | MEDIUM     | Yellow warning: "This file has moderate fragility"                                     |
| > 15 changes         | HIGH       | Red warning if index > 0.3: "⚠️ 80% of recent changes to this file caused regressions" |

### Historian Remains Unchanged

> `cortex_verify` writes **directly** to `cortex.db` (`change_log` and `fragility` tables). The Historian module remains a thin wrapper around `HISTORY.json` for aggregate run data (`{ date, score, coverage, failures }`). It has no file-level tracking responsibilities and does not need any changes for v2.

### Integration Points

- `cortex_plan` reads cached `fragility_index` for tier classification and risk warnings.
- `AGENT_CONTEXT.md` (generated by Reporter) lists the top 5 most fragile files.
- `NEXT_TASK.md` deprioritizes tasks that touch high-fragility files unless explicitly requested.

---

## Known Scope Boundaries

> The following limitations are intentional for v2 and are documented here to prevent surprises.

### Graph Coverage: `admin-panel/src/` Only

The Scanner scans `admin-panel/src/`. The following directories are **outside the graph**:

- `supabase/` (migrations, edge functions)
- `questerix-cortex/` (Cortex internals)
- `scripts/` (deployment scripts)
- `tests/` (E2E tests — mapped via convention, but not scanned for internal dependencies)

**Impact**: `cortex_impact` for files outside `admin-panel/src/` returns an empty blast radius. The triage decision tree still catches high-risk files by extension (`.sql` → Tier C), so **safety is not compromised**. But graph-powered 2-hop analysis is only available for admin panel frontend code.

**Rationale**: The admin panel is where 80%+ of agent work happens. Extending the graph to Supabase functions and scripts is a v3 consideration.

### E2E Test Convention Coverage: ~40-50% (of 64 test files)

Convention-based filename matching maps approximately **26-32 of 64** E2E test files to page components. Cross-feature tests (e.g., `rbac-guards.e2e.spec.ts`), regression tests (e.g., `question-studio-save-regression.spec.ts`), and infrastructure tests (e.g., `latency-benchmark.e2e.spec.ts`) are not mapped. For Tier C changes, the full test suite is recommended as a fallback.

### New Test Files Require Full Scan

The incremental delta scan (via `git diff`) only re-scans modified files inside `admin-panel/src/`. If someone adds a **new E2E test file** (e.g., `tests/NewPage.spec.ts`), the convention-based `tests` edge won't be created until the **next full `npm run health` scan**. The incremental scan has no visibility into `tests/` directory changes. This means newly added tests may not be included in `cortex_verify`'s targeted runs until after the next health check. Since `npm run health` runs regularly, this gap is typically a few hours at most.

### Dashboard "Graph Explorer"

**Deferred**: Not in v2 scope. A visual dependency graph is a nice-to-have, not required for the core intelligence loop.

---

## Session ID Management

### Strategy: UUID per MCP Server Lifecycle

1. When the MCP server process starts, it generates a UUID v4 and stores it in memory.
2. Every `change_log` and `tool_calls` entry created during this process gets that UUID.
3. When the server restarts (new IDE session, new Cursor window), a new UUID is generated.
4. This means `session_id` maps 1:1 with "one agent work session."

---

## Graceful Degradation

### Fallback Behavior per Tool

| Scenario                                          | Behavior                                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `cortex.db` doesn't exist                         | Tool returns `{ warning: "Graph not initialized. Run 'npm run health' first.", data: null }`                                               |
| Graph exists but is empty (0 nodes)               | Tool returns `{ warning: "Graph is empty. Run 'npm run health' to populate.", data: null }`                                                |
| Database file is corrupted                        | Server catches SQLite error, deletes `cortex.db`, returns warning. Next health run rebuilds                                                |
| `cortex_impact` for file not in graph             | Returns `{ warning: "File not in graph — may be new, outside scope, or path mismatch. Full test suite recommended.", affected_files: [] }` |
| `cortex_fragility` for file with < 5 observations | Returns data with `confidence: 'LOW'` and note: "Insufficient data for reliable scoring"                                                   |
| Path normalization fails (unknown prefix)         | Log raw path for debugging, attempt best-effort match, return warning if no match                                                          |

**Design Principle**: Every tool returns a valid, parseable response in all states. No unhandled errors. Agents receive actionable guidance, never cryptic stack traces.

---

## Architectural Blind Spots & Missing Concerns

Based on a forensic reality-check of the deployed `server.ts` system, the following critical gaps exist:

| Missing Concern                          | Impact & Proposed Mitigation                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Schema Migration Strategy**            | The code utilizes `CREATE TABLE IF NOT EXISTS`. There is zero native schema migration logic. If `cortex.db` columns change, the backend silently fails. **Mitigation**: Instruct servers to explicitly delete `cortex.db` and rebuild via `npm run health` upon schema iterations. |
| **Concurrent IDE Instances**             | Two overlapping MCP servers opening `cortex.db` triggers concurrent `SQLITE_BUSY` contention, mildly offset by `busy_timeout=5000`. Unhandled multi-window support.                                                                                                                |
| **Input Sanitization (`cortex_verify`)** | The `execSync` utility directly executes paths resolved from agent input. Without heavy string sanitization, agents can trigger arbitrary shell command injection (`; rm -rf /`).                                                                                                  |
| **Silent Process Observability**         | The MCP server possesses no health tracking, metrics, or internal logging limits beyond stderr. Server hangs or timeouts are silently buried in the IDE.                                                                                                                           |

---

## Integration with Existing Cortex Modules

| Existing Module | Current Role                                  | v2 Extension                                                                                                                                                                     |
| --------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scanner**     | Extracts file/function metadata via ts-morph  | **New**: `scanFiles(paths)` method. **Change**: Remove `skipFileDependencyResolution: true`. Writes resolved `nodes` + `edges` to `cortex.db` via upsert + per-file edge refresh |
| **Historian**   | Tracks run-over-run history in `HISTORY.json` | **Unchanged**. `cortex_verify` writes directly to `cortex.db`                                                                                                                    |
| **GitOracle**   | Correlates git changes to sessions            | Used **read-only** for `git diff` and `git rev-parse`. Never triggers `ship()` from MCP server                                                                                   |
| **RiskScorer**  | Computes composite risk scores (6 dimensions) | Called by `cortex_plan` for risk assessment within tier. Decision tree handles tier classification. Not duplicative — complementary                                              |
| **Optimizer**   | Detects watcher gaps, zombies, large files    | **Unchanged** — continues solving "Agent Loading" root causes                                                                                                                    |
| **Reporter**    | Generates markdown reports                    | Adds compliance violations (from `tool_calls` table) + fragility top-5 to outputs                                                                                                |
| **Dashboard**   | Real-time UI for Cortex runs                  | **Deferred**: "Graph Explorer" not in v2 scope                                                                                                                                   |

---

## Implementation Status (Post-Execution)

The standalone phase execution roadmap has been **100% completed**. The system actively operates in production under Cortex v2 logic. The previous theoretical 5-session sprint estimates have been archived.

| Component Group               | Status   | Notes                                                                                                                                                    |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Storage & SQLite Schema**   | **LIVE** | 6-table core (`nodes`, `edges`, `change_log`, `fragility`, `scan_meta`, `tool_calls`) active in WAL mode.                                                |
| **MCP SDK Integration**       | **LIVE** | Fully operational `stdio` transport.                                                                                                                     |
| **Tool Execution**            | **LIVE** | `cortex_impact`, `cortex_query`, `cortex_plan`, `cortex_fragility`, and `cortex_verify` operating, though tier logic diverges from origin specification. |
| **Fragility Engine**          | **LIVE** | Tracing test failures through dependency edges + rolling decay updates caching successfully.                                                             |
| **Compliance & Verification** | **LIVE** | Active feedback loop via `tool_calls` validation logic.                                                                                                  |

---

## What We Decided NOT to Build (and Why)

| Rejected Idea                                   | Why                                                                                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Remote Supabase graph**                       | Network latency (500ms vs 5ms), offline breakage, "canonical truth" ambiguity                                                            |
| **Neo4j**                                       | Overkill for ~184 source files. SQLite CTEs handle 5-hop traversals in <10ms                                                             |
| **Surgical Sandbox** (`/tmp` workspace)         | Breaks TypeScript import resolution, path aliases, test infrastructure                                                                   |
| **Symbol-level edges** (v2)                     | Exponential edge count. Start file-level; add symbol-level for hooks/utilities in v3                                                     |
| **Full human gate for all changes**             | Kills velocity for trivial fixes. Triage tiers (A/B/C) balance safety with speed                                                         |
| **Dashboard Graph Explorer** (v2)               | Nice-to-have visualization, not required for core intelligence loop. Deferred                                                            |
| **Merging cortex.db into search.db**            | Different access patterns. Separation prevents contention                                                                                |
| **Agent self-classification into tiers**        | Chicken-and-egg: can't determine tier without graph data. `cortex_plan` classifies internally                                            |
| **Extending Historian for file-level tracking** | Historian is aggregate run-history. File-level tracking lives in `cortex.db` via `cortex_verify`                                         |
| **Per-file tsc**                                | TypeScript doesn't support single-file project-mode checking. Use `--incremental` caching                                                |
| **tsc error baseline** (v6-v7)                  | No longer needed — 0 pre-existing errors as of 2026-02-25. Baseline strategy preserved in v7 history as fallback if errors re-accumulate |
| **Graph coverage beyond admin-panel** (v2)      | 80%+ of agent work is frontend. Backend coverage is a v3 consideration                                                                   |
| **Custom import resolution logic**              | ts-morph handles resolution natively when `skipFileDependencyResolution` is removed. No need to reimplement                              |

---

## Revision History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1      | 2026-02-25 | Initial plan: 4 separate phases (Graph, Architect, Sandbox, Forensic)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| v2      | 2026-02-25 | Unified MCP architecture. Dropped Sandbox. Local SQLite. Triage tiers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| v3      | 2026-02-25 | Graph freshness (delta scan). E2E mapping. Session IDs. Graceful degradation. Dashboard deferred                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| v4      | 2026-02-25 | 7 fixes: git diff no HEAD, file-qualified IDs, cortex_plan as entry point, path normalization, cortex_verify feedback loop, rolling window decay, STRUCTURAL_JSON_LIST                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| v5      | 2026-02-25 | 12 fixes: stdio safety, deleted file handling, concurrent write safety, Scanner.scanFiles(), edge direction, cortex_query suffix matching, fragility_index as cache, Historian unchanged, tsc is project-wide, graph scope = admin-panel, scan_meta advancement, tool_calls table                                                                                                                                                                                                                                                                                                                                                                                               |
| v6      | 2026-02-25 | Codebase-validated: (1) Import specifier resolution strategy — remove skipFileDependencyResolution, use ts-morph native resolution, (2) ~136 files not ~500, (3) E2E convention mapping ~40-50% not 80%+, (4) delta scan latency ~1-2s on Windows/OneDrive not 300ms, (5) @/ alias in normalizePath(), (6) tsc error baseline for ~380 pre-existing errors, (7) per-file edge refresh on re-scan, (8) date correction 2025→2026, (9) GitOracle read-only from MCP server, (10) glob matching for STRUCTURAL_JSON_LIST, (11) RiskScorer integrated into cortex_plan as risk assessment (complementary to tier classification), (12) Session 1 estimate revised from ~3h to ~4.5h |
| v7      | 2026-02-25 | Delta review: (1) `tsConfigFilePath` must explicitly point to `admin-panel/tsconfig.json` — cortex tsconfig has no `@/*` paths, would silently produce empty graph. Added exact code + auto-include note + bundler resolution smoke test for first 15 min of Session 1, (2) tsc baseline masking weakness documented and accepted — net-negative count can hide new regressions, per-file error parsing deferred, (3) `cortex_verify` tsc + test runner must use `cwd: adminPath` — MCP server runs from cortex directory, (4) new E2E test files require full `npm run health` scan to be mapped — incremental scan has no visibility into `tests/` directory                  |
| v8      | 2026-02-25 | Codebase re-validation: (1) File count corrected from ~136 to **~184** (139 source + 44 unit test + 1 env.d.ts) — scan time estimates adjusted, (2) **tsc errors now 0** — the ~380 pre-existing errors were fixed in recent quality sessions. tsc baseline strategy removed entirely; `cortex_verify` uses direct pass/fail. Baseline approach preserved in v7 history as documented fallback, (3) Export count updated from ~489 to ~343 export statements, (4) E2E test count added: 64 test files in `admin-panel/tests/`, convention coverage ~26-32 files, (5) Session 3 estimate reduced from ~3h to ~2.5h (no baseline logic needed), total effort reduced to ~15h      |

---

## Success Criteria

When this is complete, the following should be true:

1. **Any agent** (Antigravity, Claude Code, Copilot) can call `cortex_plan` before modifying files and receive a tier classification + risk assessment.
2. **Targeted tests** run in < 60 seconds for a typical 3-file change (`tsc --incremental` ~5s + targeted tests ~15s vs. full suite ~5 minutes).
3. **Fragility warnings** appear for files with > 30% regression rate in the last 20 changes and > 5 total observations.
4. **Protocol compliance** is verifiable post-session via persistent `tool_calls` table (did the agent call `cortex_plan` before editing? Did it call `cortex_verify` after?).
5. **Zero new external dependencies** — everything runs on local SQLite (`better-sqlite3` already in package.json) + existing Node.js stack + `@modelcontextprotocol/sdk`.
6. **Graph is always fresh** — incremental delta scan uses resolved imports (not raw specifiers), handles deleted files, adds ~1-2s on Windows to any `cortex_impact` call.
7. **Day-zero safe** — every tool returns a valid, actionable response even before the first health run.
8. **Path-agnostic** — agents can pass absolute, workspace-relative, `@/`-prefixed, or src-relative paths; normalization handles all cases.
9. **stdio-safe** — no child process output corrupts the MCP protocol channel.
10. **Clean type checking** — `cortex_verify` uses direct tsc pass/fail (0 pre-existing errors). If errors re-accumulate, baseline strategy is documented as a fallback (see v7 revision history).

---

> **Status**: ✅ **Design Document Finalized**. All components are actively deployed in `questerix-cortex`. The architectural divergences and blind spots listed above (e.g., tier threshold drift, schema migration safety, execution injection vulnerabilities) represent the primary tech debt vectors tracking against future v3 revisions.
