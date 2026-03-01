import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import Database from "better-sqlite3";
import { Project } from "ts-morph";
import { Analyst } from "../analyst";

describe("Analyst.findDeadCode", () => {
  let tempDbPath: string;
  let db: Database.Database;
  let analyst: Analyst;
  let tempDir: string;

  beforeEach(() => {
    // Create temp directory for test database
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cortex-test-"));
    tempDbPath = path.join(tempDir, "test.db");
    db = new Database(tempDbPath);

    // Initialize schema
    db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
      CREATE INDEX IF NOT EXISTS idx_edges_relationship ON edges(relationship);
    `);

    // Create a minimal ts-morph project
    const project = new Project({
      useInMemoryFileSystem: true,
    });

    analyst = new Analyst(project);
  });

  afterEach(() => {
    db.close();
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  });

  it("should return unreferenced symbols (no incoming imports)", () => {
    // Seed DB: 3 symbol nodes, 2 with no incoming edges, 1 with an edge
    const insertNode = db.prepare(
      "INSERT INTO nodes (id, type, file_path) VALUES (?, ?, ?)"
    );
    const insertEdge = db.prepare(
      "INSERT INTO edges (source_id, target_id, relationship) VALUES (?, ?, ?)"
    );

    // Symbol 1: Dead code (no incoming imports)
    insertNode.run(
      "admin-panel/src/utils/unused.ts#unusedFunction",
      "symbol",
      "admin-panel/src/utils/unused.ts"
    );

    // Symbol 2: Dead code (no incoming imports)
    insertNode.run(
      "admin-panel/src/helpers/stale.ts#staleHelper",
      "symbol",
      "admin-panel/src/helpers/stale.ts"
    );

    // Symbol 3: Live code (has incoming import)
    insertNode.run(
      "admin-panel/src/services/api.ts#fetchData",
      "symbol",
      "admin-panel/src/services/api.ts"
    );

    // Another file imports the api.ts file (production scanner stores file-level edges)
    insertNode.run(
      "admin-panel/src/features/dashboard/hooks.ts",
      "file",
      "admin-panel/src/features/dashboard/hooks.ts"
    );
    insertEdge.run(
      "admin-panel/src/features/dashboard/hooks.ts",
      "admin-panel/src/services/api.ts",
      "imports"
    );

    const deadCode = analyst.findDeadCode(db);

    // Should return exactly the 2 unreferenced symbols
    expect(deadCode).toHaveLength(2);
    expect(deadCode.map((d) => d.symbol)).toContain("unusedFunction");
    expect(deadCode.map((d) => d.symbol)).toContain("staleHelper");
    expect(deadCode.map((d) => d.symbol)).not.toContain("fetchData");
  });

  it("should exclude entry-point files even if they have no incoming imports", () => {
    const insertNode = db.prepare(
      "INSERT INTO nodes (id, type, file_path) VALUES (?, ?, ?)"
    );

    // App.tsx entry point (should be excluded)
    insertNode.run(
      "admin-panel/src/App.tsx#App",
      "symbol",
      "admin-panel/src/App.tsx"
    );

    // main.tsx entry point (should be excluded)
    insertNode.run(
      "admin-panel/src/main.tsx#renderApp",
      "symbol",
      "admin-panel/src/main.tsx"
    );

    // index.ts barrel file (should be excluded)
    insertNode.run(
      "admin-panel/src/features/auth/index.ts#AuthExports",
      "symbol",
      "admin-panel/src/features/auth/index.ts"
    );

    // Page component (should be excluded)
    insertNode.run(
      "admin-panel/src/pages/Login.tsx#LoginPage",
      "symbol",
      "admin-panel/src/pages/Login.tsx"
    );

    // Regular dead code (should be included)
    insertNode.run(
      "admin-panel/src/utils/helpers.ts#deadHelper",
      "symbol",
      "admin-panel/src/utils/helpers.ts"
    );

    const deadCode = analyst.findDeadCode(db);

    // Should only return the non-entry-point dead code
    expect(deadCode).toHaveLength(1);
    expect(deadCode[0].symbol).toBe("deadHelper");
    expect(deadCode[0].file).toBe("admin-panel/src/utils/helpers.ts");
  });

  it("should cap results at the specified limit", () => {
    const insertNode = db.prepare(
      "INSERT INTO nodes (id, type, file_path) VALUES (?, ?, ?)"
    );

    // Insert 25 dead symbols
    for (let i = 0; i < 25; i++) {
      insertNode.run(
        `admin-panel/src/utils/file${i}.ts#func${i}`,
        "symbol",
        `admin-panel/src/utils/file${i}.ts`
      );
    }

    // Default limit is 20
    const deadCodeDefault = analyst.findDeadCode(db);
    expect(deadCodeDefault.length).toBeLessThanOrEqual(20);

    // Custom limit of 5
    const deadCodeLimited = analyst.findDeadCode(db, 5);
    expect(deadCodeLimited).toHaveLength(5);
  });

  it("should return empty array when all symbols are referenced", () => {
    const insertNode = db.prepare(
      "INSERT INTO nodes (id, type, file_path) VALUES (?, ?, ?)"
    );
    const insertEdge = db.prepare(
      "INSERT INTO edges (source_id, target_id, relationship) VALUES (?, ?, ?)"
    );

    // Create 2 symbols that are both referenced
    insertNode.run(
      "admin-panel/src/utils/helper.ts#helper1",
      "symbol",
      "admin-panel/src/utils/helper.ts"
    );
    insertNode.run(
      "admin-panel/src/utils/helper.ts#helper2",
      "symbol",
      "admin-panel/src/utils/helper.ts"
    );

    // File that imports helper.ts (production scanner stores file-level edges,
    // one edge per imported file regardless of how many symbols are used)
    insertNode.run(
      "admin-panel/src/features/page.tsx",
      "file",
      "admin-panel/src/features/page.tsx"
    );
    insertEdge.run(
      "admin-panel/src/features/page.tsx",
      "admin-panel/src/utils/helper.ts",
      "imports"
    );

    const deadCode = analyst.findDeadCode(db);
    expect(deadCode).toHaveLength(0);
  });

  it("should return empty array when graph is empty", () => {
    const deadCode = analyst.findDeadCode(db);
    expect(deadCode).toHaveLength(0);
  });

  it("should return symbols with file path and symbol name", () => {
    const insertNode = db.prepare(
      "INSERT INTO nodes (id, type, file_path) VALUES (?, ?, ?)"
    );

    insertNode.run(
      "admin-panel/src/utils/format.ts#formatDate",
      "symbol",
      "admin-panel/src/utils/format.ts"
    );

    const deadCode = analyst.findDeadCode(db);

    expect(deadCode).toHaveLength(1);
    expect(deadCode[0]).toEqual({
      symbol: "formatDate",
      file: "admin-panel/src/utils/format.ts",
    });
  });
});
