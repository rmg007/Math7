import * as fs from 'fs';
import * as path from 'path';

export interface ConsolidationResult {
  merged: string[];
  archived: string[];
  deleted: string[];
}

/**
 * Consolidator — manages the hygiene and structural integrity of the 'brain' artifacts.
 * It merges fragmented session plans and archives finalized walkthroughs.
 */
export class Consolidator {
  private brainPath: string;
  private projectRoot: string;

  constructor(brainPath: string, projectRoot: string) {
    this.brainPath = brainPath;
    this.projectRoot = projectRoot;
  }

  /**
   * Scans sessions in the brain directory and performs consolidation.
   */
  consolidate(): ConsolidationResult {
    const result: ConsolidationResult = { merged: [], archived: [], deleted: [] };
    if (!fs.existsSync(this.brainPath)) return result;

    const sessions = fs.readdirSync(this.brainPath).filter(f => 
      fs.statSync(path.join(this.brainPath, f)).isDirectory()
    );

    for (const session of sessions) {
      const sessionPath = path.join(this.brainPath, session);
      const files = fs.readdirSync(sessionPath);

      // 1. Consolidate Implementation Plans
      const plans = files.filter(f => f.startsWith('implementation_plan') && f.endsWith('.md'));
      if (plans.length > 1) {
        this.mergeFiles(sessionPath, plans, 'CONSOLIDATED_PLAN.md');
        result.merged.push(`${session}/CONSOLIDATED_PLAN.md`);
      }

      // 2. Consolidate Walkthroughs
      const walkthroughs = files.filter(f => f.startsWith('walkthrough') && f.endsWith('.md'));
      if (walkthroughs.length > 1) {
        this.mergeFiles(sessionPath, walkthroughs, 'CONSOLIDATED_WALKTHROUGH.md');
        result.merged.push(`${session}/CONSOLIDATED_WALKTHROUGH.md`);
      }

      // 3. Optional: Move 'final' looking documents to project docs/
      // This is high-risk, so we only do it if explicitly requested or if we're sure.
      // For now, we just flag them.
    }

    return result;
  }

  private mergeFiles(dir: string, files: string[], targetName: string) {
    let combined = `# Consolidated Artifacts (${new Date().toLocaleDateString()})\n\n`;
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      combined += `## Source: ${file}\n\n${content}\n\n---\n\n`;
    }
    fs.writeFileSync(path.join(dir, targetName), combined, 'utf-8');
    
    // Cleanup originals
    for (const file of files) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}
