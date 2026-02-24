import * as path from 'path';
import { Project } from 'ts-morph';

export interface SurfaceMap {
  hooks: { name: string; file: string; functions: string[] }[];
  pages: { name: string; file: string; routes: string[] }[];
}

export class Scanner {
  private project: Project;
  private srcPath: string;

  constructor(srcPath: string) {
    this.project = new Project();
    this.srcPath = srcPath;
    this.project.addSourceFilesAtPaths(path.join(srcPath, '**/*.{ts,tsx}'));
  }

  scan(): SurfaceMap {
    const map: SurfaceMap = {
      hooks: [],
      pages: []
    };

    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      const relativePath = path.relative(this.srcPath, filePath);

      // Simple heuristic for hooks
      if (relativePath.includes('hooks/')) {
        const functions = sourceFile.getExportedDeclarations();
        const hookNames = Array.from(functions.keys());
        
        map.hooks.push({
          name: hookNames[0] || path.basename(filePath),
          file: relativePath,
          functions: hookNames
        });
      }

      // Simple heuristic for pages
      if (relativePath.includes('pages/')) {
        map.pages.push({
          name: path.basename(filePath),
          file: relativePath,
          routes: [] // Would need more logic to extract routes
        });
      }
    }

    return map;
  }
}
