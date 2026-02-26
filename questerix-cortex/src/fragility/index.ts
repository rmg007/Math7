import * as fs from 'fs';
import * as path from 'path';
import { FeatureDependency } from '../visualizer';

export interface FragilityMetrics {
  featureName: string;
  inDegree: number;
  outDegree: number;
  fileCount: number;
  totalExports: number;
  fragilityScore: number;
  verdict: 'STABLE' | 'MODERATE' | 'STIFF' | 'FRAGILE';
}

/**
 * FragilityScorer: Ranks features by their structural risk.
 * Risk is a function of coupling (In+Out) and local complexity.
 */
export class FragilityScorer {
  private srcPath: string;

  constructor(srcPath: string) {
    this.srcPath = srcPath;
  }

  public analyze(deps: FeatureDependency[]): FragilityMetrics[] {
    const featuresPath = path.join(this.srcPath, 'features');
    if (!fs.existsSync(featuresPath)) return [];

    const features = fs.readdirSync(featuresPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const metrics: FragilityMetrics[] = features.map(f => {
      const inDegree = deps.filter(d => d.to === f).length;
      const outDegree = deps.filter(d => d.from === f).length;
      
      const featureDir = path.join(featuresPath, f);
      const files = this.listFilesRecursively(featureDir, (file) => file.endsWith('.ts') || file.endsWith('.tsx'));
      
      // Simple complexity heuristic: File count 
      const fileCount = files.length;
      
      // Rough export count (for further weighting)
      let totalExports = 0;
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const exportMatch = content.match(/export\s+(const|function|class|type|interface|enum|default)/g);
        if (exportMatch) totalExports += exportMatch.length;
      });

      // Fragility Score Algorithm:
      // (Coupling + Complexity Factor)
      // We weigh in-degree heavily because changing a high in-degree feature risks breaking many others.
      const fragilityScore = (inDegree * 3) + (outDegree * 2) + (fileCount * 0.5);

      let verdict: FragilityMetrics['verdict'] = 'STABLE';
      if (fragilityScore > 30) verdict = 'FRAGILE';
      else if (fragilityScore > 15) verdict = 'STIFF';
      else if (fragilityScore > 5) verdict = 'MODERATE';

      return {
        featureName: f,
        inDegree,
        outDegree,
        fileCount,
        totalExports,
        fragilityScore: Math.round(fragilityScore * 10) / 10,
        verdict
      };
    });

    return metrics.sort((a, b) => b.fragilityScore - a.fragilityScore);
  }

  public generateMarkdownReport(metrics: FragilityMetrics[]): string {
    let md = `# 🏗️ Feature Fragility Matrix\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n`;
    md += `> **Fragility Score** = \`(InDegree * 3) + (OutDegree * 2) + (Files * 0.5)\`\n`;
    md += `> Higher scores indicate features that are harder to change without side effects ("Stiffness").\n\n`;

    md += `## 📊 Ranking\n\n`;
    md += `| Feature | Score | Verdict | In/Out | Files | Exports |\n`;
    md += `|---|---|---|---|---|---|\n`;

    metrics.forEach(m => {
      const verdictEmoji = {
        'STABLE': '✅',
        'MODERATE': '🟡',
        'STIFF': '🟠',
        'FRAGILE': '🔴'
      }[m.verdict];
      
      md += `| **${m.featureName}** | ${m.fragilityScore} | ${verdictEmoji} ${m.verdict} | ${m.inDegree}/${m.outDegree} | ${m.fileCount} | ${m.totalExports} |\n`;
    });

    md += `\n\n## 🛠️ Maintenance Recommendations\n\n`;
    
    const fragile = metrics.filter(m => m.verdict === 'FRAGILE' || m.verdict === 'STIFF');
    if (fragile.length === 0) {
      md += `✅ All features are within healthy modularity limits. \n`;
    } else {
      fragile.forEach(f => {
        md += `### ⚠️ ${f.featureName} (${f.verdict})\n`;
        if (f.inDegree > 2) {
          md += `- **High In-Degree**: This feature is a "Core" dependency. Any API changes here require a full workspace audit. Consider extracting interfaces to a separate \`types\` folder.\n`;
        }
        if (f.outDegree > 2) {
          md += `- **High Out-Degree**: This feature is highly coupled to other domains. Try to delegate logic to shared hooks or utility functions.\n`;
        }
        if (f.fileCount > 20) {
          md += `- **Domain Bloat**: Feature directory is oversized. Consider splitting into sub-features or pruning dead code.\n`;
        }
        md += `\n`;
      });
    }

    return md;
  }

  private listFilesRecursively(dir: string, filter: (f: string) => boolean): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    for (let file of list) {
      file = path.resolve(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.listFilesRecursively(file, filter));
      } else if (filter(file)) {
        results.push(file);
      }
    }
    return results;
  }
}
