import * as fs from "fs";
import * as path from "path";

export interface FeatureDependency {
  from: string;
  to: string;
  files: string[];
}

/**
 * FeatureVisualizer: Analyzes and maps cross-feature dependencies.
 * Purpose: Ensure strict domain isolation and prevent "spaghetti" coupling.
 */
export class FeatureVisualizer {
  private srcPath: string;

  constructor(srcPath: string) {
    this.srcPath = srcPath;
  }

  /**
   * Scans the features directory for cross-feature imports.
   */
  public analyze(): FeatureDependency[] {
    const featuresPath = path.join(this.srcPath, "features");
    if (!fs.existsSync(featuresPath)) return [];

    const features = fs
      .readdirSync(featuresPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    const allDetectedFeatures: string[] = [...features];
    const detailedDeps: FeatureDependency[] = [];
    const fileSourceMap: Record<string, string[]> = {};
    const dependencies: Record<string, Set<string>> = {};

    for (const feature of features) {
      const featureDir = path.join(featuresPath, feature);
      const files = this.listFilesRecursively(
        featureDir,
        (f) => f.endsWith(".ts") || f.endsWith(".tsx"),
      );

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        // Even simpler regex: just look for /features/ followed by a name
        const importRegex = /\/features\/([^/'" ]+)/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
          const targetFeature = match[1];
          if (targetFeature !== feature && features.includes(targetFeature)) {
            const key = `${feature}->${targetFeature}`;
            if (!dependencies[feature]) dependencies[feature] = new Set();
            dependencies[feature].add(targetFeature);

            if (!fileSourceMap[key]) fileSourceMap[key] = [];
            const relPath = path
              .relative(this.srcPath, file)
              .replace(/\\/g, "/");
            if (!fileSourceMap[key].includes(relPath)) {
              fileSourceMap[key].push(relPath);
            }
          }
        }
      }
    }

    // Convert to structured result
    for (const [from, targets] of Object.entries(dependencies)) {
      for (const to of targets) {
        detailedDeps.push({
          from,
          to,
          files: fileSourceMap[`${from}->${to}`] || [],
        });
      }
    }

    return detailedDeps;
  }

  /**
   * Generates a Mermaid-enhanced Markdown report.
   */
  public generateMarkdownReport(deps: FeatureDependency[]): string {
    const featuresPath = path.join(this.srcPath, "features");
    const allFeatures = fs.existsSync(featuresPath)
      ? fs
          .readdirSync(featuresPath, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
      : [];

    let md = `# 🗺️ Feature Isolation Map\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n`;
    md += `> This map visualizes dependencies between \`src/features/*\`. \n`;
    md += `> **Standard:** Features should ideally be isolated or depend only on \`shared\` / \`lib\`. \n\n`;

    md += `## 📊 Dependency Graph\n\n`;
    md += `\`\`\`mermaid\ngraph TD\n`;

    // Nodes
    allFeatures.forEach((f) => {
      const hasOutgoing = deps.some((d) => d.from === f);
      const hasIncoming = deps.some((d) => d.to === f);
      const style = hasOutgoing ? ":::coupled" : ":::isolated";
      md += `  ${f}[${f}]${style}\n`;
    });

    // Edges
    deps.forEach((d) => {
      md += `  ${d.from} --> ${d.to}\n`;
    });

    md += `\n  classDef isolated fill:#f9f,stroke:#333,stroke-width:2px;\n`;
    md += `  classDef coupled fill:#ff9,stroke:#f66,stroke-width:2px;\n`;
    md += `\`\`\`\n\n`;

    md += `## 🕵️ Detailed Coupling Analysis\n\n`;
    if (deps.length === 0) {
      md += `✅ **Perfect Isolation!** No cross-feature dependencies detected.\n`;
    } else {
      md += `| Source Feature | Target (Imported) | Coupling Count | Sample Files |\n`;
      md += `|---|---|---|---|\n`;
      deps.forEach((d) => {
        const samples = d.files
          .slice(0, 2)
          .map((f) => `\`${path.basename(f)}\``)
          .join(", ");
        md += `| **${d.from}** | ${d.to} | ${d.files.length} | ${samples}${d.files.length > 2 ? "..." : ""} |\n`;
      });

      md += `\n\n### 🧬 Full File Trace\n\n`;
      deps.forEach((d) => {
        md += `#### 🔴 ${d.from} → ${d.to} (${d.files.length} links)\n`;
        d.files.forEach((f) => (md += `- \`${f}\`\n`));
        md += `\n`;
      });
    }

    return md;
  }

  private listFilesRecursively(
    dir: string,
    filter: (f: string) => boolean,
  ): string[] {
    let results: string[] = [];
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
