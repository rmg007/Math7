import * as fs from 'fs';
import * as path from 'path';
import { TaskResult } from '../orchestrator';

export class Reporter {
  private outputs: any;
  private root: string;

  constructor(root: string, outputs: any) {
    this.root = root;
    this.outputs = outputs;
  }

  generate(results: Record<string, TaskResult>, surfaceMap?: any, analystResults?: any) {
    this.generateHealthReport(results, analystResults);
    this.generateAgentContext(results, surfaceMap, analystResults);
    this.generateNextTask(results, analystResults);
  }

  private generateHealthReport(results: Record<string, TaskResult>, analystResults?: any) {
    let md = '# 🩺 Questerix Health Report\n\n';
    md += `*Generated: ${new Date().toLocaleString()}*\n\n`;

    const allResults = Object.values(results);
    const passed = allResults.filter(r => r.status === 'passed').length;
    const total = allResults.length;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    md += `## Overall Health Score: ${score}/100\n\n`;

    md += '| Suite | Status | Duration | Details |\n';
    md += '| :--- | :--- | :--- | :--- |\n';

    for (const r of allResults) {
      const statusIcon = r.status === 'passed' ? '✅' : '❌';
      md += `| ${r.name} | ${statusIcon} ${r.status.toUpperCase()} | ${r.duration?.toFixed(1) || 0}s | logs |\n`;
    }

    if (analystResults?.deadCode?.length > 0) {
      md += '\n## 🕵️ Analyst Findings\n';
      md += `**Dead Code Detected**: ${analystResults.deadCode.length} unused exports.\n`;
    }

    md += '\n---\n\n## Failure Digest\n\n';
    const failures = allResults.filter(r => r.status === 'failed');
    if (failures.length === 0) {
      md += '✅ No failures detected. System stable.\n';
    } else {
      for (const f of failures) {
        md += `### ${f.name}\n\`\`\`text\n${f.output.slice(-500)}\n\`\`\`\n\n`;
      }
    }

    fs.writeFileSync(path.join(this.root, this.outputs.healthReport), md);
  }

  private generateAgentContext(results: Record<string, TaskResult>, surfaceMap?: any, analystResults?: any) {
    let md = '# 🧠 Agent Briefing — DO NOT DELETE\n\n';
    md += '> This file is for the AI agent to read at the start of a session.\n\n';

    md += `## 📊 APP SURFACE\n`;
    if (surfaceMap) {
      md += `- **Hooks**: ${surfaceMap.hooks.length} detected.\n`;
      md += `- **Pages**: ${surfaceMap.pages.length} detected.\n`;
    }

    const failures = Object.values(results).filter(r => r.status === 'failed');
    
    if (failures.length > 0) {
      md += '\n## 🚨 CURRENT FAILURES\n';
      for (const f of failures) {
        md += `- **${f.name}**: Failing.\n`;
      }
    } else {
      md += '\n## ✅ ALL GREEN\nAll core suites passed.\n';
    }

    if (analystResults?.deadCode?.length > 0) {
      md += `\n## ⚠️ MAINTENANCE\n- Dead code found in ${analystResults.deadCode.length} symbols.\n`;
    }

    // Limit size to 20KB
    if (md.length > 20000) md = md.slice(0, 19900) + '\n... [TRUNCATED]';

    fs.writeFileSync(path.join(this.root, this.outputs.agentContext), md);
  }

  private generateNextTask(results: Record<string, TaskResult>, analystResults?: any) {
    let md = '# 📋 NEXT TASK (P0 → P1 → P2)\n\n';
    md += '> Copy and paste this to the agent.\n\n';

    const failures = Object.values(results).filter(r => r.status === 'failed');
    
    // P0: Failures
    if (failures.length > 0) {
      md += '### 🛠️ P0: Fix Regressions\n';
      for (const f of failures) {
        md += `- [ ] Fix behavior in **${f.name}**.\n`;
      }
      md += '\n';
    }

    // P1: Critical Analyst Findings
    if (analystResults?.deadCode?.length > 0) {
      md += '### 🧹 P1: Cleanup\n';
      md += `- [ ] Remove or verify ${analystResults.deadCode.length} unused exports to lean the bundle.\n\n`;
    }

    // P2: Improvements
    if (failures.length === 0) {
      md += '### 🚀 P2: Proceed with Backlog\n- [ ] Codebase is stable. Ready for new features.\n';
    }

    fs.writeFileSync(path.join(this.root, this.outputs.nextTask), md);
  }
}
