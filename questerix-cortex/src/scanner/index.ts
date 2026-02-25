import * as fs from 'fs';
import * as path from 'path';
import { Project } from 'ts-morph';

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

export class Scanner {
  private project: Project;
  private srcPath: string;

  private projectRoot: string;

  constructor(project: Project, srcPath: string) {
    this.project = project;
    this.srcPath = srcPath;
    this.projectRoot = path.resolve(srcPath, '..');
  }

  scan(): SurfaceMap {
    const map: SurfaceMap = {
      hooks: [],
      pages: [],
      utilities: [],
      dependencies: {},
      gaps: [],
      apiMap: {}
    };

    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      const normalizedPath = filePath.replace(/\\/g, '/');
      const normalizedSrcPath = this.srcPath.replace(/\\/g, '/');
      const relativePath = normalizedPath.replace(normalizedSrcPath, '').replace(/^\//, '');

      // Skip non-source files or test files themselves
      if (
        relativePath.includes('node_modules') ||
        relativePath.includes('__tests__') ||
        relativePath.includes('.test.')
      ) continue;

      const baseName = path.basename(filePath, path.extname(filePath));
      const dirName = path.dirname(filePath);

      // Tier 1: sibling __tests__/ folder (legacy / co-located tests)
      const siblingTestTsx = path.join(dirName, '__tests__', `${baseName}.test.tsx`);
      const siblingTestTs  = path.join(dirName, '__tests__', `${baseName}.test.ts`);

      // Tier 2: centralised src/__tests__/**/<baseName>.test.{tsx,ts} (Vitest)
      const centralTestDir = path.join(this.projectRoot, 'src', '__tests__');
      const hasCentralTest = this.fileExistsInDirTree(centralTestDir, baseName, ['.test.tsx', '.test.ts']);

      // Tier 3: Playwright tests/**/*<baseName>*.spec.ts
      const playwrightDir = path.join(this.projectRoot, 'tests');
      const hasE2ETest = this.fileExistsInDirTree(playwrightDir, baseName, ['.e2e.spec.ts', '.spec.ts']);

      const hasTest =
        fs.existsSync(siblingTestTsx) ||
        fs.existsSync(siblingTestTs) ||
        hasCentralTest ||
        hasE2ETest;

      // Build export entries using ts-morph
      const exportedDeclarations = sourceFile.getExportedDeclarations();
      const exportEntries: ExportEntry[] = [];

      for (const [name, decls] of exportedDeclarations) {
        for (const decl of decls) {
          const kind = decl.getKindName();
          const entry: ExportEntry = { name, kind };

          // For functions, capture parameter names
          if (kind === 'FunctionDeclaration' || kind === 'ArrowFunction') {
            try {
              const params = (decl as any).getParameters?.() ?? [];
              entry.parameters = params.map((p: any) => p.getName?.() ?? '?');
            } catch { /* skip param extraction on error */ }
          }

          exportEntries.push(entry);
          break; // only first declaration per name
        }
      }

      // Track in API map
      map.apiMap[relativePath] = exportEntries;

      // ── Hooks ─────────────────────────────────────────────────
      if (relativePath.includes('/hooks/') || relativePath.startsWith('hooks/')) {
        const hookNames = Array.from(exportedDeclarations.keys());
        map.hooks.push({
          name: hookNames[0] || baseName,
          file: relativePath,
          hasTest,
          functions: hookNames,
          exports: exportEntries
        });

        if (!hasTest) map.gaps.push(`Missing test for hook: ${relativePath}`);
      }

      // ── Pages ─────────────────────────────────────────────────
      if (relativePath.includes('/pages/') || relativePath.startsWith('pages/')) {
        map.pages.push({
          name: baseName,
          file: relativePath,
          hasTest,
          routes: []
        });

        if (!hasTest) map.gaps.push(`Missing E2E/Unit test for page: ${relativePath}`);
      }

      // ── Utilities ─────────────────────────────────────────────
      const isUtility =
        relativePath.includes('/lib/') ||
        relativePath.includes('/utils/') ||
        relativePath.includes('/helpers/') ||
        relativePath.includes('/services/');

      if (isUtility && exportEntries.length > 0) {
        // Categorize by directory
        let category = 'general';
        if (relativePath.includes('/lib/')) category = 'lib';
        if (relativePath.includes('/utils/')) category = 'utils';
        if (relativePath.includes('/helpers/')) category = 'helpers';
        if (relativePath.includes('/services/')) category = 'services';

        map.utilities.push({
          name: baseName,
          file: relativePath,
          category,
          exports: exportEntries
        });
      }

      // ── Dependency Map ─────────────────────────────────────────
      try {
        const imports = sourceFile.getImportDeclarations();
        const importedFrom: string[] = [];
        for (const imp of imports) {
          const mod = imp.getModuleSpecifierValue();
          // Only track internal imports
          if (mod.startsWith('.') || mod.startsWith('@/')) {
            importedFrom.push(mod);
          }
        }
        if (importedFrom.length > 0) {
          map.dependencies[relativePath] = importedFrom;
        }
      } catch { /* skip on error */ }
    }

    return map;
  }

  /**
   * Recursively searches `dir` for any file whose name equals `baseName + suffix`
   * for any suffix in the `suffixes` list. Returns true if found.
   */
  private fileExistsInDirTree(dir: string, baseName: string, suffixes: string[]): boolean {
    if (!fs.existsSync(dir)) return false;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (this.fileExistsInDirTree(fullPath, baseName, suffixes)) return true;
        } else if (entry.isFile()) {
          for (const suffix of suffixes) {
            if (entry.name === `${baseName}${suffix}`) return true;
          }
        }
      }
    } catch { /* skip unreadable dirs */ }
    return false;
  }


  generateSkeletons(map: SurfaceMap): string[] {
    const generated: string[] = [];

    // ── Hooks (Vitest) ──────────────────────────────────────────
    for (const hook of map.hooks) {
      if (hook.hasTest) continue;

      const testDir = path.join(this.projectRoot, 'src', '__tests__', path.dirname(hook.file));
      const testFile = path.join(testDir, `${path.basename(hook.file, path.extname(hook.file))}.test.ts`);

      if (fs.existsSync(testFile)) continue;

      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

      let content = `import { renderHook } from '@testing-library/react';\n`;
      content += `import { describe, it, expect } from 'vitest';\n`;
      content += `import { ${hook.name} } from '@/${hook.file.replace('.ts', '')}';\n\n`;
      content += `describe('${hook.name}', () => {\n`;
      content += `  it('should initialize correctly', () => {\n`;
      content += `    const { result } = renderHook(() => ${hook.name}());\n`;
      content += `    expect(result.current).toBeDefined();\n`;
      content += `  });\n\n`;

      hook.exports.forEach(exp => {
        if (exp.kind === 'FunctionDeclaration' || exp.kind === 'ArrowFunction') {
          if (exp.name === hook.name) return;
          content += `  it('should handle ${exp.name} correctly', () => {\n`;
          content += `    // TODO: Implement test for ${exp.name}\n`;
          content += `  });\n\n`;
        }
      });

      content += `});\n`;

      fs.writeFileSync(testFile, content, 'utf-8');
      generated.push(testFile);
    }

    // ── Pages (Playwright) ──────────────────────────────────────
    for (const page of map.pages) {
      if (page.hasTest) continue;

      const testDir = path.join(this.projectRoot, 'tests');
      const testFile = path.join(testDir, `${page.name}.spec.ts`);

      if (fs.existsSync(testFile)) continue;

      let content = `import { test, expect } from '@playwright/test';\n\n`;
      content += `test.describe('${page.name} Page', () => {\n`;
      content += `  test.beforeEach(async ({ page }) => {\n`;
      content += `    // TODO: Update with actual route\n`;
      content += `    await page.goto('/${page.name.toLowerCase()}');\n`;
      content += `  });\n\n`;
      content += `  test('should render basic elements', async ({ page }) => {\n`;
      content += `    await expect(page.locator('h1')).toBeVisible();\n`;
      content += `  });\n\n`;
      content += `  test('should pass accessibility check', async ({ page }) => {\n`;
      content += `    // TODO: Add axe-core check\n`;
      content += `  });\n`;
      content += `});\n`;

      fs.writeFileSync(testFile, content, 'utf-8');
      generated.push(testFile);
    }

    return generated;
  }
}
