import type Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { Project } from "ts-morph";

// Known entry points that should be excluded from dead code detection
const ENTRY_POINT_PATTERNS = [
  /App\.[tj]sx?$/,
  /main\.[tj]sx?$/,
  /index\.[tj]sx?$/,
  /\/pages\//,
  /route\.[tj]sx?$/,
  /\.config\.[tj]s$/,
  /vite\.config/,
  /vitest\.config/,
];

/**
 * Checks if a file path matches known entry point patterns
 */
function isEntryPoint(filePath: string): boolean {
  return ENTRY_POINT_PATTERNS.some((pattern) => pattern.test(filePath));
}

export class Analyst {
  private project: Project;

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * Finds dead code by querying the graph DB for symbol nodes whose parent file
   * has zero incoming import edges.
   *
   * The graph stores import edges at **file** level (source_id = importer file,
   * target_id = imported file).  Symbol node IDs have the form `file#Symbol`,
   * so a direct join on `n.id = e.target_id` would never match.  The corrected
   * query extracts the file path portion of each symbol's ID and joins on that.
   *
   * Excludes known entry points (pages, App, main, route files) and caps
   * results at 20.
   */
  findDeadCode(db: Database.Database, limit: number = 20): Array<{ symbol: string; file: string }> {
    // Join on the file portion of the symbol ID (everything before '#')
    const query = db.prepare(`
      SELECT n.id, n.file_path
      FROM nodes n
      LEFT JOIN edges e ON
        (CASE WHEN INSTR(n.id, '#') > 0
              THEN SUBSTR(n.id, 1, INSTR(n.id, '#') - 1)
              ELSE n.id END) = e.target_id
        AND e.relationship = 'imports'
      WHERE n.type = 'symbol'
      GROUP BY n.id
      HAVING COUNT(e.source_id) = 0
      ORDER BY n.file_path
      LIMIT ?
    `);

    const rows = query.all(limit) as Array<{ id: string; file_path: string }>;

    // Filter out entry points and format results
    const deadCode: Array<{ symbol: string; file: string }> = [];

    for (const row of rows) {
      const filePath = row.file_path || row.id.split("#")[0];

      // Skip entry point files
      if (isEntryPoint(filePath)) {
        continue;
      }

      // Extract symbol name from id (format: filePath#symbolName)
      const symbolName = row.id.includes("#") ? row.id.split("#").pop() || row.id : row.id;

      deadCode.push({
        symbol: symbolName,
        file: filePath,
      });
    }

    return deadCode;
  }

  /**
   * Scans for useQuery hooks that lack performance.mark instrumentation.
   * Encourages a 'Performance First' culture by flagging un-instrumented data fetching.
   */
  checkPerformanceInstrumentation(): string[] {
    const uninstrumented: string[] = [];
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const fullText = sourceFile.getFullText();

      // Heuristic: if useQuery is used but performance.mark is missing
      // Use word boundary to avoid matching useQueryClient
      if (
        /\buseQuery\b/.test(fullText) &&
        !fullText.includes("performance.mark")
      ) {
        const filePath = sourceFile.getFilePath().replace(/\\/g, "/");
        const relativePath = filePath.split("/admin-panel/src/")[1] || filePath;
        uninstrumented.push(relativePath);
      }
    }

    return uninstrumented;
  }

  getBundleSize(adminPath: string) {
    const distPath = path.join(adminPath, "dist");
    if (!fs.existsSync(distPath)) return null;

    let totalSize = 0;
    const walk = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) walk(filePath);
        else totalSize += stats.size;
      }
    };

    walk(distPath);
    return Math.round(totalSize / 1024); // KB
  }

  /**
   * Scans Supabase migrations for RLS governance violations.
   * Required by GEMINI.md: CREATE TABLE must be followed by ENABLE RLS.
   */
  lintMigrations(migrationsPath: string): string[] {
    const violations: string[] = [];
    if (!fs.existsSync(migrationsPath)) return violations;

    const files = fs
      .readdirSync(migrationsPath)
      .filter((f) => f.endsWith(".sql"));

    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsPath, file), "utf-8");

      // Heuristic 1: If CREATE TABLE exists but ENABLE ROW LEVEL SECURITY doesn't
      const tableMatches = [
        ...content.matchAll(/CREATE\s+TABLE\s+(?:public\.)?(\w+)/gi),
      ];
      for (const match of tableMatches) {
        const tableName = match[1];
        if (!content.toLowerCase().includes(`enable row level security`)) {
          violations.push(
            `${file}: Table '${tableName}' missing ENABLE ROW LEVEL SECURITY`,
          );
        }
      }

      // Heuristic 2: Check for mandatory admin tables missing 'intentional' comments if no policy found
      const adminTables = [
        "known_issues",
        "error_logs",
        "source_documents",
        "curriculum_meta",
      ];
      for (const table of adminTables) {
        if (
          content.includes(table) &&
          !content.toLowerCase().includes("policy")
        ) {
          if (!content.includes("-- Operation intentionally omitted")) {
            violations.push(
              `${file}: Admin table '${table}' missing policies or mandatory omission comment`,
            );
          }
        }
      }
    }

    return violations;
  }

  /**
   * Scans for 'as any' or 'as unknown' casts in production code (features/pages).
   * Prevents 'Bypass Toxicity' where developers skip type checking for API payloads.
   */
  lintTypeSafety(): string[] {
    const violations: string[] = [];
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath().replace(/\\/g, "/");

      // Skip tests, nodes, and lib (lib often needs casts for low-level generics)
      if (
        filePath.includes("__tests__") ||
        filePath.includes("node_modules") ||
        filePath.includes("/lib/")
      ) {
        continue;
      }

      // Target features and pages only where business logic lives
      if (!filePath.includes("/features/") && !filePath.includes("/pages/")) {
        continue;
      }

      const fullText = sourceFile.getFullText();
      const relativePath = filePath.split("/admin-panel/src/")[1] || filePath;

      // Check for 'as any' or 'as unknown as any' or 'as unknown as T'
      // We allow 'as const' and 'as T' for safe casting, but 'any' is a red flag.
      if (fullText.includes("as any") || fullText.includes("as unknown")) {
        // Find line numbers for better reporting
        const lines = fullText.split("\n");
        lines.forEach((line, i) => {
          if (line.includes("as any") || line.includes("as unknown")) {
            violations.push(
              `${relativePath}:${i + 1}: Unsafe cast found ('as any' or 'as unknown')`,
            );
          }
        });
      }
    }

    return violations;
  }
}
