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
          // Check for references
          const referencedSymbols = (decl as any).findReferences?.();
          if (referencedSymbols && referencedSymbols.length === 0) {
            deadCode.push(name);
          }
        }
      }
    }

    return deadCode;
  }
}
