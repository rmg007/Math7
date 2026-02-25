# Session 1: Graph Foundation — Implementation Brief

> **For**: Cursor AI (implementer)
> **Reviewed by**: Antigravity (will audit your output)
> **Estimated effort**: ~4.5 hours
> **Branch**: `cortex-v2/session-1`

---

## Codebase Context (Read This First)

- **Project root**: `C:\Users\mhali\OneDrive\Desktop\Important Projects\Questerix`
- **Cortex directory**: `questerix-cortex/` — this is where your new code goes
- **Admin panel**: `admin-panel/` — you scan this, don't modify it
- **Scanner source**: `questerix-cortex/src/scanner/index.ts` — you'll modify this
- **Main entry**: `questerix-cortex/run.ts` — you'll wire Scanner changes here
- **Existing deps**: `better-sqlite3` (^12.6.2) and `ts-morph` (^25.0.1) are already in `package.json`
- **Node runtime**: CommonJS (`module: "CommonJS"` in cortex tsconfig)
- **File count**: ~184 `.ts/.tsx` files in `admin-panel/src/`
- **E2E tests**: 64 test files in `admin-panel/tests/`

### CRITICAL: Two tsconfigs exist — use the RIGHT one

| tsconfig                         | moduleResolution | paths                | Use for                              |
| -------------------------------- | ---------------- | -------------------- | ------------------------------------ |
| `admin-panel/tsconfig.json`      | `bundler`        | `"@/*": ["./src/*"]` | **ts-morph Project** (this one!)     |
| `questerix-cortex/tsconfig.json` | `node`           | none                 | Cortex build only. NEVER for Scanner |

Using the wrong tsconfig silently produces a graph with **zero edges** because `@/` imports resolve to `undefined`.

---

## Step 0: Smoke Test (First 15 Minutes)

**Purpose**: Validate that ts-morph's `bundler` module resolution works with the admin-panel tsconfig before building anything.

Create a throwaway script `questerix-cortex/smoke-test.ts`:

```typescript
import * as path from "path";
import { Project } from "ts-morph";

const projectRoot = path.resolve(__dirname, "..");
const tsConfigPath = path.resolve(projectRoot, "admin-panel", "tsconfig.json");

const project = new Project({
  tsConfigFilePath: tsConfigPath,
  // NO skipFileDependencyResolution — we want native resolution
});

const sourceFiles = project.getSourceFiles();
console.log(
  `✅ ts-morph loaded ${sourceFiles.length} files from admin-panel tsconfig`,
);

// Test 3 files with @/ imports
const testFiles = ["App.tsx", "use-auth.ts", "LoginPage.tsx"];
let passed = 0;

for (const sf of sourceFiles) {
  const basename = path.basename(sf.getFilePath());
  if (
    !testFiles.some((t) =>
      basename.includes(t.replace(".tsx", "").replace(".ts", "")),
    )
  )
    continue;

  const imports = sf.getImportDeclarations();
  for (const imp of imports) {
    const specifier = imp.getModuleSpecifierValue();
    if (
      !specifier.startsWith("@/") &&
      !specifier.startsWith("./") &&
      !specifier.startsWith("../")
    )
      continue;

    const resolved = imp.getModuleSpecifierSourceFile();
    if (resolved) {
      console.log(
        `  ✅ ${basename}: "${specifier}" → ${path.basename(resolved.getFilePath())}`,
      );
      passed++;
    } else {
      console.log(
        `  ❌ ${basename}: "${specifier}" → undefined (RESOLUTION FAILED)`,
      );
    }
  }
}

console.log(
  `\n${passed > 0 ? "✅ SMOKE TEST PASSED" : "❌ SMOKE TEST FAILED"} — ${passed} imports resolved`,
);
```

Run it: `npx ts-node questerix-cortex/smoke-test.ts`

**If it fails**: STOP. Do not proceed. The `bundler` moduleResolution may need a workaround. Report the exact error.

**If it passes**: Delete the script and proceed.

---

## Step 1: SQLite Schema — `cortex.db`

Create `questerix-cortex/src/cortex-db/index.ts`:

```typescript
import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";

export class CortexDB {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL"); // REQUIRED: concurrent read/write safety
    this.db.pragma("busy_timeout = 5000"); // Wait up to 5s if locked
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id          TEXT PRIMARY KEY,
        type        TEXT NOT NULL,
        file_path   TEXT,
        metadata    TEXT,
        updated_at  TEXT
      );

      CREATE TABLE IF NOT EXISTS edges (
        source_id       TEXT NOT NULL,
        target_id       TEXT NOT NULL,
        relationship    TEXT NOT NULL,
        metadata        TEXT,
        UNIQUE(source_id, target_id, relationship)
      );

      CREATE TABLE IF NOT EXISTS change_log (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path       TEXT NOT NULL,
        timestamp       TEXT NOT NULL,
        session_id      TEXT,
        tests_passed    INTEGER,
        tests_failed    INTEGER,
        failure_details TEXT
      );

      CREATE TABLE IF NOT EXISTS fragility (
        file_path               TEXT PRIMARY KEY,
        change_count            INTEGER DEFAULT 0,
        failure_count           INTEGER DEFAULT 0,
        fragility_index         REAL DEFAULT 0.0,
        last_failure            TEXT,
        common_failure_pattern  TEXT,
        confidence              TEXT DEFAULT 'LOW'
      );

      CREATE TABLE IF NOT EXISTS scan_meta (
        key     TEXT PRIMARY KEY,
        value   TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_calls (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp   TEXT NOT NULL,
        session_id  TEXT NOT NULL,
        tool_name   TEXT NOT NULL,
        parameters  TEXT,
        result_tier TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
      CREATE INDEX IF NOT EXISTS idx_edges_relationship ON edges(relationship);
      CREATE INDEX IF NOT EXISTS idx_changelog_filepath ON change_log(file_path);
      CREATE INDEX IF NOT EXISTS idx_changelog_session ON change_log(session_id);
      CREATE INDEX IF NOT EXISTS idx_toolcalls_session ON tool_calls(session_id);
    `);
  }

  /** Get the underlying database instance for direct queries */
  getDb(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
```

### FIXED decisions (do not deviate):

- **WAL mode** — required for concurrent access
- **`busy_timeout = 5000`** — prevents SQLITE_BUSY in normal usage
- **6 tables** — exactly as shown, with these exact column names and types
- **UNIQUE constraint** on edges — `(source_id, target_id, relationship)`
- **Indexes** on edges (source, target, relationship), change_log (file_path, session_id), tool_calls (session_id)

### FLEXIBLE decisions:

- Index names — use whatever convention you prefer
- Whether to add more indexes — your call, but the listed ones are required

---

## Step 2: `normalizePath()` Utility

Create `questerix-cortex/src/utils/normalize-path.ts`:

### FIXED behavior (must handle all these cases):

| Input                                                                | Output                                    |
| -------------------------------------------------------------------- | ----------------------------------------- |
| `C:\Users\mhali\...\admin-panel\src\features\auth\hooks\use-auth.ts` | `features/auth/hooks/use-auth.ts`         |
| `admin-panel/src/features/auth/hooks/use-auth.ts`                    | `features/auth/hooks/use-auth.ts`         |
| `src/features/auth/hooks/use-auth.ts`                                | `features/auth/hooks/use-auth.ts`         |
| `@/features/auth/hooks/use-auth.ts`                                  | `features/auth/hooks/use-auth.ts`         |
| `features/auth/hooks/use-auth.ts`                                    | `features/auth/hooks/use-auth.ts` (no-op) |

### Algorithm:

1. Convert backslashes to forward slashes
2. Strip absolute prefix up to and including project root
3. Strip known relative prefixes: `admin-panel/src/`, `src/`
4. Replace `@/` prefix with empty string
5. Return canonical relative path

---

## Step 3: Modify Scanner — Import Resolution + `scanFiles()`

### 3a: Remove `skipFileDependencyResolution` in `run.ts`

**File**: `questerix-cortex/run.ts`, line 99

Change:

```typescript
const project = new Project({ skipFileDependencyResolution: true });
```

To:

```typescript
const project = new Project({
  tsConfigFilePath: path.resolve(
    __dirname,
    "..",
    "admin-panel",
    "tsconfig.json",
  ),
});
```

**Note**: When `tsConfigFilePath` is passed, ts-morph auto-includes files from the tsconfig's `include` patterns (`"include": ["src"]`). The existing `project.addSourceFilesAtPaths(...)` call on line 100 becomes redundant (duplicates are no-ops) — you can remove it or leave it (no-op is harmless).

### 3b: Add `Scanner.scanFiles(paths)` method

Add to `questerix-cortex/src/scanner/index.ts`:

A new method that:

1. Takes an array of file paths
2. For each file: if already in the project, call `sourceFile.refreshFromFileSystem()`. If new, call `project.addSourceFileAtPath(path)`
3. Resolves imports via `importDecl.getModuleSpecifierSourceFile()`
4. Returns nodes and edges for those files only

### 3c: Add `Scanner.writeGraph(cortexDb)` method

A new method that writes Scanner output to `cortex.db`:

**Node ID convention** (FIXED):

- File nodes: `features/auth/hooks/use-auth.ts` (normalized path, no `#`)
- Symbol nodes: `features/auth/hooks/use-auth.ts#useAuth` (path + `#` + symbol name)

**Edge direction convention** (FIXED):

- `imports`: source=importer, target=imported. "A imports B" → `source=A, target=B`
- `tests`: source=test_file, target=tested_module
- `renders`: source=parent_component, target=child_component

**Write strategy** (FIXED):

1. `INSERT OR REPLACE INTO nodes ...` for each node (upsert)
2. Set `updated_at` to current ISO timestamp for each node touched
3. **Per-file edge refresh**: Before inserting edges for a file, `DELETE FROM edges WHERE source_id = ?` for that file, then insert current edges
4. After all inserts: prune stale nodes `DELETE FROM nodes WHERE updated_at < ?` (current scan timestamp)
5. Cascade-delete orphaned edges: `DELETE FROM edges WHERE source_id NOT IN (SELECT id FROM nodes) OR target_id NOT IN (SELECT id FROM nodes)`
6. Steps 4-5 in a **single transaction**

**Import resolution logic**:

```typescript
for (const importDecl of sourceFile.getImportDeclarations()) {
  const targetSourceFile = importDecl.getModuleSpecifierSourceFile();
  if (targetSourceFile) {
    const resolvedPath = normalizePath(targetSourceFile.getFilePath());
    // Create edge: source=currentFile, target=resolvedPath, relationship='imports'
  }
  // If undefined → external package (react, @supabase/supabase-js) → skip
}
```

---

## Step 4: Convention-Based E2E Test Mapping

After building the import graph, add `tests` edges by matching E2E test filenames to page components.

**Location**: E2E tests are in `admin-panel/tests/*.spec.ts`
**Pages**: Page components are in `admin-panel/src/features/*/pages/*.tsx`

**Matching logic**:

1. For each E2E test file, extract the stem (e.g., `LoginPage.spec.ts` → `LoginPage`)
2. Search page components for a matching name (case-insensitive, kebab-to-Pascal conversion)
3. If found, create edge: `source=tests/LoginPage.spec.ts, target=features/auth/pages/LoginPage.tsx, relationship='tests'`

**Expected coverage**: ~26-32 of 64 test files will match. This is fine — the rest don't have clean page-name correspondence.

---

## Step 5: Wire It All Together

In `run.ts` (or wherever the health check orchestration lives):

1. Create `CortexDB` instance pointing to `questerix-cortex/outputs/cortex.db`
2. After Scanner runs, call `scanner.writeGraph(cortexDb)`
3. Run E2E test mapping and write `tests` edges
4. Close the DB connection

---

## DO NOT List

- ❌ **Do NOT touch `admin-panel/` code** — scan only, never modify
- ❌ **Do NOT use cortex's tsconfig** for ts-morph Project — use `admin-panel/tsconfig.json`
- ❌ **Do NOT use `skipFileDependencyResolution: true`** — the whole point is removing this
- ❌ **Do NOT store raw import specifiers** in edges — resolve to file paths
- ❌ **Do NOT `DELETE FROM nodes` before inserting** — use upsert (`INSERT OR REPLACE`)
- ❌ **Do NOT create new npm dependencies** — `better-sqlite3` and `ts-morph` are already available
- ❌ **Do NOT add features to `admin-panel/`** — feature freeze (GEMINI.md rule)

---

## Acceptance Criteria (What the Reviewer Will Check)

1. [ ] `cortex.db` is created at `questerix-cortex/outputs/cortex.db` with WAL mode
2. [ ] All 6 tables exist with correct column names and types
3. [ ] All required indexes exist
4. [ ] `normalizePath()` handles all 5 input formats correctly
5. [ ] `skipFileDependencyResolution: true` is removed from `run.ts`
6. [ ] `tsConfigFilePath` points to `admin-panel/tsconfig.json`
7. [ ] Scanner resolves `@/` imports to actual file paths (not `undefined`)
8. [ ] Edges use resolved file paths, not raw specifiers
9. [ ] Node IDs follow the file-qualified convention (`path#symbol`)
10. [ ] Edge direction follows source=actor, target=acted-upon
11. [ ] Per-file edge refresh works (old edges deleted before new ones inserted)
12. [ ] Stale node pruning runs in a transaction with orphan edge cleanup
13. [ ] E2E test mapping creates `tests` edges for matching page components
14. [ ] `npm run health` still completes successfully after changes
15. [ ] No modifications to `admin-panel/` source files
