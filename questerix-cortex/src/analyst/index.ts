import * as fs from 'fs';
import * as path from 'path';
import { Project } from 'ts-morph';

export class Analyst {
  private project: Project;

  constructor(srcPath: string) {
    this.project = new Project();
    this.project.addSourceFilesAtPaths(path.join(srcPath, '**/*.{ts,tsx}'));
  }

  findDeadCode() {
    const deadCode: string[] = [];
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const exports = sourceFile.getExportedDeclarations();
      
      for (const [name, declarations] of exports) {
        for (const decl of declarations) {
          // TODO: findReferences is very slow. Optimize later.
          // const referencedSymbols = (decl as any).findReferences?.();
          // if (referencedSymbols && referencedSymbols.length === 0) {
          //   deadCode.push(name);
          // }
        }
      }
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
      
      // Simple heuristic: if useQuery is used but performance.mark is missing
      if (fullText.includes('useQuery') && !fullText.includes('performance.mark')) {
        const filePath = sourceFile.getFilePath().replace(/\\/g, '/');
        const relativePath = filePath.split('/admin-panel/src/')[1] || filePath;
        uninstrumented.push(relativePath);
      }
    }

    return uninstrumented;
  }

  getBundleSize(adminPath: string) {
    const distPath = path.join(adminPath, 'dist');
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

    const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsPath, file), 'utf-8');
      
      // Heuristic 1: If CREATE TABLE exists but ENABLE ROW LEVEL SECURITY doesn't
      const tableMatches = [...content.matchAll(/CREATE\s+TABLE\s+(?:public\.)?(\w+)/gi)];
      for (const match of tableMatches) {
        const tableName = match[1];
        if (!content.toLowerCase().includes(`enable row level security`)) {
          violations.push(`${file}: Table '${tableName}' missing ENABLE ROW LEVEL SECURITY`);
        }
      }

      // Heuristic 2: Check for mandatory admin tables missing 'intentional' comments if no policy found
      const adminTables = ['known_issues', 'error_logs', 'source_documents', 'curriculum_meta'];
      for (const table of adminTables) {
        if (content.includes(table) && !content.toLowerCase().includes('policy')) {
          if (!content.includes('-- Operation intentionally omitted')) {
            violations.push(`${file}: Admin table '${table}' missing policies or mandatory omission comment`);
          }
        }
      }
    }

    return violations;
  }
}
