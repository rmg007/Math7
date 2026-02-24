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
}
