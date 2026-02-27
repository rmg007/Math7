import * as fs from "fs";
import * as path from "path";
import { Project } from "ts-morph";
import { CortexDB } from "../cortex-db";
import { normalizePath } from "../utils/normalize-path";

export interface HookEntry {
  name: string;
  file: string;
  hasTest: boolean;
  functions: string[];
  exports: ExportEntry[];
}

export interface PageEntry {
  name: string;
  file: string;
  hasTest: boolean;
  routes: string[];
}

export interface UtilityEntry {
  name: string;
  file: string;
  category: string;
  exports: ExportEntry[];
}

export interface ExportEntry {
  name: string;
  kind: string; // 'function' | 'class' | 'type' | 'const' | 'variable'
  parameters?: string[];
}

export interface SurfaceMap {
  hooks: HookEntry[];
  pages: PageEntry[];
  utilities: UtilityEntry[];
  dependencies: Record<string, string[]>; // file -> list of hook/util imports
  gaps: string[];
  apiMap: Record<string, ExportEntry[]>; // relativePath -> export list
}

export interface GraphNode {
  id: string;
  type: "file" | "symbol";
  filePath?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  relationship: "imports" | "tests" | "renders";
  metadata?: Record<string, unknown>;
}

export interface GraphScanResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceFiles: string[];
}

export class Scanner {
  private project: Project;
  private srcPath: string;

  private projectRoot: string;

  constructor(project: Project, srcPath: string) {
    this.project = project;
    this.srcPath = srcPath;
    this.projectRoot = path.resolve(srcPath, "..");
  }

  private testFileCache: Set<string> | null = null;

  /**
   * Pre-loads all test filenames into a set for O(1) matching during the scan loop.
   */
  private prepareTestCache() {
    this.testFileCache = new Set();
    const testDirs = [
      path.join(this.projectRoot, "src", "__tests__"),
      path.join(this.projectRoot, "tests"),
    ];

    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) continue;
      this.collectFileNames(dir, this.testFileCache);
    }
  }

  private collectFileNames(dir: string, set: Set<string>) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          this.collectFileNames(path.join(dir, entry.name), set);
        } else {
          set.add(entry.name);
        }
      }
    } catch {
      /* skip unreadable */
    }
  }

  scan(): SurfaceMap {
    const map: SurfaceMap = {
      hooks: [],
      pages: [],
      utilities: [],
      dependencies: {},
      gaps: [],
      apiMap: {},
    };

    // Optimization: Pre-scan test directories once
    this.prepareTestCache();

    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      const relativePath = normalizePath(filePath);

      // Skip non-source files or test files themselves
      if (
        relativePath.includes("node_modules") ||
        relativePath.includes("__tests__") ||
        relativePath.includes(".test.") ||
        relativePath.includes(".spec.")
      )
        continue;

      const baseName = path.basename(filePath, path.extname(filePath));
      const dirName = path.dirname(filePath);

      // Tier 1: sibling __tests__/ folder
      const siblingTestTsx = path.join(
        dirName,
        "__tests__",
        `${baseName}.test.tsx`,
      );
      const siblingTestTs = path.join(
        dirName,
        "__tests__",
        `${baseName}.test.ts`,
      );

      // Tiers 2 & 3: Match from cache for speed
      const suffixes = [".test.tsx", ".test.ts", ".e2e.spec.ts", ".spec.ts"];
      const hasCachedTest = suffixes.some((s) =>
        this.testFileCache?.has(`${baseName}${s}`),
      );

      const hasTest =
        fs.existsSync(siblingTestTsx) ||
        fs.existsSync(siblingTestTs) ||
        hasCachedTest;

      // Build export entries using ts-morph
      const exportedDeclarations = sourceFile.getExportedDeclarations();
      const exportEntries: ExportEntry[] = [];

      for (const [name, decls] of exportedDeclarations) {
        for (const decl of decls) {
          const kind = decl.getKindName();
          const entry: ExportEntry = { name, kind };

          if (kind === "FunctionDeclaration" || kind === "ArrowFunction") {
            try {
              const params = (decl as any).getParameters?.() ?? [];
              entry.parameters = params.map((p: any) => p.getName?.() ?? "?");
            } catch {
              /* skip */
            }
          }

          exportEntries.push(entry);
          break;
        }
      }

      map.apiMap[relativePath] = exportEntries;

      if (
        relativePath.includes("/hooks/") ||
        relativePath.startsWith("hooks/")
      ) {
        const hookNames = Array.from(exportedDeclarations.keys());
        map.hooks.push({
          name: hookNames[0] || baseName,
          file: relativePath,
          hasTest,
          functions: hookNames,
          exports: exportEntries,
        });
        if (!hasTest) map.gaps.push(`Missing test for hook: ${relativePath}`);
      }

      if (
        relativePath.includes("/pages/") ||
        relativePath.startsWith("pages/")
      ) {
        map.pages.push({
          name: baseName,
          file: relativePath,
          hasTest,
          routes: [],
        });
        if (!hasTest)
          map.gaps.push(`Missing E2E/Unit test for page: ${relativePath}`);
      }

      const isUtility =
        relativePath.includes("/lib/") ||
        relativePath.includes("/utils/") ||
        relativePath.includes("/helpers/") ||
        relativePath.includes("/services/");

      if (isUtility && exportEntries.length > 0) {
        let category = "general";
        if (relativePath.includes("/lib/")) category = "lib";
        if (relativePath.includes("/utils/")) category = "utils";
        if (relativePath.includes("/helpers/")) category = "helpers";
        if (relativePath.includes("/services/")) category = "services";

        map.utilities.push({
          name: baseName,
          file: relativePath,
          category,
          exports: exportEntries,
        });
      }

      try {
        const imports = sourceFile.getImportDeclarations();
        const importedFrom: string[] = [];
        for (const imp of imports) {
          const mod = imp.getModuleSpecifierValue();
          if (mod.startsWith(".") || mod.startsWith("@/")) {
            importedFrom.push(mod);
          }
        }
        if (importedFrom.length > 0) {
          map.dependencies[relativePath] = importedFrom;
        }
      } catch {
        /* skip */
      }
    }

    return map;
  }

  async scanFiles(paths: string[]): Promise<GraphScanResult> {
    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    const sourceFiles: string[] = [];

    for (const filePath of paths) {
      let sourceFile = this.project.getSourceFile(filePath);
      // Only refresh if the file is likely changed
      if (sourceFile) {
        // Option here: check mtime before refresh to save IO
        await sourceFile.refreshFromFileSystem();
      } else {
        sourceFile = this.project.addSourceFileAtPath(filePath);
      }

      if (!sourceFile) continue;

      const normalizedFilePath = normalizePath(sourceFile.getFilePath());
      sourceFiles.push(normalizedFilePath);

      nodeMap.set(normalizedFilePath, {
        id: normalizedFilePath,
        type: "file",
        filePath: normalizedFilePath,
      });

      const exportedDeclarations = sourceFile.getExportedDeclarations();
      for (const [name, declarations] of exportedDeclarations) {
        const symbolId = `${normalizedFilePath}#${name}`;
        nodeMap.set(symbolId, {
          id: symbolId,
          type: "symbol",
          filePath: normalizedFilePath,
          metadata: { name, kind: declarations[0]?.getKindName?.() },
        });
      }

      const isTestFile =
        normalizedFilePath.includes(".test.") ||
        normalizedFilePath.includes(".spec.");

      for (const importDecl of sourceFile.getImportDeclarations()) {
        const specifier = importDecl.getModuleSpecifierValue();
        let targetSourceFile = importDecl.getModuleSpecifierSourceFile();

        // Fallback resolution for '@/aliases if ts-morph fails to resolve them
        if (!targetSourceFile && specifier.startsWith("@/")) {
          const relativePath = specifier.substring(2);
          const potentialPath = path.join(this.srcPath, relativePath);
          const extensions = [".ts", ".tsx", "/index.ts", "/index.tsx"];
          
          for (const ext of extensions) {
            const fullPath = potentialPath.endsWith(ext) ? potentialPath : potentialPath + ext;
            if (fs.existsSync(fullPath)) {
              targetSourceFile = this.project.getSourceFile(fullPath) || this.project.addSourceFileAtPath(fullPath);
              break;
            }
          }
        }

        if (!targetSourceFile) continue;

        const resolvedPath = normalizePath(targetSourceFile.getFilePath());
        edges.push({
          sourceId: normalizedFilePath,
          targetId: resolvedPath,
          relationship: isTestFile ? "tests" : "imports",
        });
      }
    }

    return { nodes: Array.from(nodeMap.values()), edges, sourceFiles };
  }

  async writeGraph(cortexDb: CortexDB): Promise<void> {
    const db = cortexDb.getDb();
    const scanTimestamp = new Date().toISOString();
    const filePaths = this.project
      .getSourceFiles()
      .map((sourceFile) => sourceFile.getFilePath());
    const { nodes, edges, sourceFiles } = await this.scanFiles(filePaths);

    const insertNode = db.prepare(`
      INSERT OR REPLACE INTO nodes (id, type, file_path, metadata, updated_at)
      VALUES (@id, @type, @filePath, @metadata, @updatedAt)
    `);
    const insertEdge = db.prepare(`
      INSERT OR REPLACE INTO edges (source_id, target_id, relationship, metadata)
      VALUES (@sourceId, @targetId, @relationship, @metadata)
    `);
    const deleteEdgesForSource = db.prepare(
      "DELETE FROM edges WHERE source_id = ?",
    );
    const deleteStaleNodes = db.prepare(
      "DELETE FROM nodes WHERE updated_at < ?",
    );
    const deleteOrphanEdges = db.prepare(
      "DELETE FROM edges WHERE source_id NOT IN (SELECT id FROM nodes) OR target_id NOT IN (SELECT id FROM nodes)",
    );

    for (const node of nodes) {
      insertNode.run({
        id: node.id,
        type: node.type,
        filePath: node.filePath ?? null,
        metadata: node.metadata ? JSON.stringify(node.metadata) : null,
        updatedAt: scanTimestamp,
      });
    }

    const uniqueSources = Array.from(new Set(sourceFiles));
    for (const sourceId of uniqueSources) {
      deleteEdgesForSource.run(sourceId);
    }

    for (const edge of edges) {
      insertEdge.run({
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        relationship: edge.relationship,
        metadata: edge.metadata ? JSON.stringify(edge.metadata) : null,
      });
    }

    const prune = db.transaction((timestamp: string) => {
      deleteStaleNodes.run(timestamp);
      deleteOrphanEdges.run();
    });
    prune(scanTimestamp);
  }

  generateSkeletons(map: SurfaceMap): string[] {
    const generated: string[] = [];

    for (const hook of map.hooks) {
      if (hook.hasTest) continue;

      const testDir = path.join(
        this.projectRoot,
        "src",
        "__tests__",
        path.dirname(hook.file),
      );
      const testFile = path.join(
        testDir,
        `${path.basename(hook.file, path.extname(hook.file))}.test.ts`,
      );

      if (fs.existsSync(testFile)) continue;
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

      let content = `import { renderHook } from '@testing-library/react';\n`;
      content += `import { describe, it, expect } from 'vitest';\n`;
      content += `import { ${hook.name} } from '@/${hook.file.replace(".ts", "")}';\n\n`;
      content += `describe('${hook.name}', () => {\n`;
      content += `  it('should initialize correctly', () => {\n`;
      content += `    const { result } = renderHook(() => ${hook.name}());\n`;
      content += `    expect(result.current).toBeDefined();\n`;
      content += `  });\n\n`;

      hook.exports.forEach((exp) => {
        if (
          exp.kind === "FunctionDeclaration" ||
          exp.kind === "ArrowFunction"
        ) {
          if (exp.name === hook.name) return;
          content += `  it('should handle ${exp.name} correctly', () => {\n`;
          content += `    // TODO: Implement test for ${exp.name}\n`;
          content += `  });\n\n`;
        }
      });

      content += `});\n`;
      fs.writeFileSync(testFile, content, "utf-8");
      generated.push(testFile);
    }

    for (const page of map.pages) {
      if (page.hasTest) continue;

      const testDir = path.join(this.projectRoot, "tests");
      const testFile = path.join(testDir, `${page.name}.spec.ts`);

      if (fs.existsSync(testFile)) continue;

      let content = `import { test, expect } from '@playwright/test';\n\n`;
      content += `test.describe('${page.name} Page', () => {\n`;
      content += `  test.beforeEach(async ({ page }) => {\n`;
      content += `    await page.goto('/${page.name.toLowerCase()}');\n`;
      content += `  });\n\n`;
      content += `  test('should render basic elements', async ({ page }) => {\n`;
      content += `    await expect(page.locator('h1')).toBeVisible();\n`;
      content += `  });\n\n`;
      content += `  test('should pass accessibility check', async ({ page }) => {\n`;
      content += `    // TODO: Add axe-core check\n`;
      content += `  });\n`;
      content += `});\n`;

      fs.writeFileSync(testFile, content, "utf-8");
    }

    return generated;
  }
}
