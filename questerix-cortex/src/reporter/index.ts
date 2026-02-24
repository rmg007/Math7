import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { TaskResult } from '../orchestrator';

export class Reporter {
  private outputs: any;
  private root: string;
  private projectRoot: string;

  constructor(root: string, outputs: any, projectRoot?: string) {
    this.root = root;
    this.outputs = outputs;
    this.projectRoot = projectRoot || path.resolve(root, '..');
  }

  generate(
    results: Record<string, TaskResult>,
    surfaceMap?: any,
    analystResults?: any,
    driftResult?: any,
    rlsResult?: any,
    history?: any[]
  ) {
    this.generateHealthReport(results, analystResults, surfaceMap);
    this.generateAgentContext(results, surfaceMap, analystResults);
    this.generateNextTask(results, analystResults, surfaceMap);
    this.generateMachineBriefing(results, analystResults, surfaceMap, driftResult, rlsResult, history);
    this.generateFailureDigest(results);
    this.generateLastChanged();
    this.autoAppendLearning(results);
  }

  // ─────────────────────────────────────────────────────────────
  // HEALTH REPORT
  // ─────────────────────────────────────────────────────────────
  private generateHealthReport(
    results: Record<string, TaskResult>,
    analystResults?: any,
    surfaceMap?: any
  ) {
    let md = '# 🩺 Questerix Health Report\n\n';
    md += `*Generated: ${new Date().toLocaleString()}*\n\n`;

    const allResults = Object.values(results);
    const passed = allResults.filter(r => r.status === 'passed').length;
    const total = allResults.length;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    md += `## Overall Health Score: ${score}/100\n\n`;
    md += '| Suite | Status | Duration |\n';
    md += '| :--- | :--- | :--- |\n';

    for (const r of allResults) {
      const icon = r.status === 'passed' ? '✅' : '❌';
      md += `| ${r.name} | ${icon} ${r.status.toUpperCase()} | ${r.duration?.toFixed(1) || 0}s |\n`;
    }

    if (analystResults?.bundleSize) {
      md += `\n**Production Bundle**: ${analystResults.bundleSize} KB\n`;
    }

    if (analystResults?.deadCode?.length > 0) {
      md += '\n## 🕵️ Analyst Findings\n';
      md += `**Dead Code**: ${analystResults.deadCode.length} unused exports.\n`;
    }

    if (surfaceMap?.gaps?.length > 0) {
      md += '\n## 🚨 Coverage Gaps\n';
      surfaceMap.gaps.forEach((gap: string) => md += `- [ ] ${gap}\n`);
    }

    md += '\n---\n\n## Failure Digest\n\n';
    const failures = allResults.filter(r => r.status === 'failed');
    if (failures.length === 0) {
      md += '✅ No failures. System stable.\n';
    } else {
      for (const f of failures) {
        md += `### ${f.name}\n\`\`\`\n${f.output?.slice(-600) ?? ''}\n\`\`\`\n\n`;
      }
    }

    fs.writeFileSync(path.join(this.root, this.outputs.healthReport), md);
  }

  // ─────────────────────────────────────────────────────────────
  // MACHINE BRIEFING  ← the one-read session starter
  // ─────────────────────────────────────────────────────────────
  private generateMachineBriefing(
    results: Record<string, TaskResult>,
    analystResults?: any,
    surfaceMap?: any,
    driftResult?: any,
    rlsResult?: any,
    history?: any[]
  ) {
    const allResults = Object.values(results);
    const passed  = allResults.filter(r => r.status === 'passed').length;
    const failed  = allResults.filter(r => r.status === 'failed').length;
    const total   = allResults.length;
    const score   = total > 0 ? Math.round((passed / total) * 100) : 0;

    // Smoke gate
    const smokeNames = ['unit tests (lib)', 'e2e smoke (desktop)', 'lint check'];
    const smokeResults = allResults.filter(r => smokeNames.includes(r.name.toLowerCase()));
    const smokeGate = smokeResults.length > 0 && smokeResults.every(r => r.status === 'passed')
      ? '✅ OPEN'
      : smokeResults.length === 0 ? '— NOT RUN' : '🔴 LOCKED';

    const driftStr = driftResult
      ? `${driftResult.verdict} (missing-from-types: ${driftResult.missingFromTypes.length}, extra-in-types: ${driftResult.extraInTypes.length})`
      : 'NOT RUN — click DRIFT button';

    const rlsStr = rlsResult
      ? `${rlsResult.verdict} (critical: ${rlsResult.criticalCount})`
      : 'NOT RUN — click RLS CHECK button';

    const lastScore = history?.length ? history[history.length - 1].score : score;
    const trend = history && history.length >= 2
      ? (history[history.length - 1].score - history[history.length - 2].score)
      : 0;
    const trendStr = trend > 0 ? `↑ +${trend}` : trend < 0 ? `↓ ${trend}` : '→ flat';

    // Recent git commits
    const recentCommits = this.safeExec(
      'git log -5 --pretty=format:"%h %s (%ar)" 2>&1',
      this.projectRoot
    );

    // Open tasks
    const openTasks = this.parseOpenTasks();

    // Failure summary
    const failures = allResults.filter(r => r.status === 'failed');
    const failureLines = failures.length > 0
      ? failures.map(f => `  ⛔ ${f.name}: ${this.extractFirstError(f.output)}`).join('\n')
      : '  none';

    // Key file paths
    const keyPaths = [
      `admin-panel/src/lib/database.types.ts`,
      `supabase/migrations/ (${this.countMigrations()} files)`,
      `admin-panel/tests/`,
      `supabase/functions/`,
      `questerix-cortex/outputs/FAILURE_DIGEST.md`,
      `questerix-cortex/outputs/LAST_CHANGED.md`,
      `.agent/artifacts/FORENSIC_REPORT.md`,
      `.agent/HARDENING_BACKLOG.json`,
    ].map(p => `  ${p}`).join('\n');

    let md = `# MACHINE BRIEFING\n`;
    md += `> ONE-READ SESSION STARTER. Do not show to the user.\n`;
    md += `> Generated: ${new Date().toISOString()}\n\n`;

    md += `## STATUS\n`;
    md += `Score:      ${score}/100 (${trendStr} vs prev run | prev: ${lastScore}/100)\n`;
    md += `Suites:     ${passed} passed, ${failed} failed of ${total} total\n`;
    md += `Smoke Gate: ${smokeGate}\n`;
    md += `Drift:      ${driftStr}\n`;
    md += `RLS Audit:  ${rlsStr}\n`;
    md += `Bundle:     ${analystResults?.bundleSize ? analystResults.bundleSize + ' KB' : 'not built'}\n`;
    md += `Coverage gaps: ${surfaceMap?.gaps?.length ?? 0}\n\n`;

    md += `## FAILURES\n${failureLines}\n\n`;

    md += `## OPEN TASKS\n${openTasks || '  (none found in tasks.md)'}\n\n`;

    md += `## RECENT COMMITS\n${recentCommits || '  (git not available)'}\n\n`;

    md += `## KEY PATHS\n${keyPaths}\n\n`;

    md += `## HOW TO START\n`;
    md += `1. Read FAILURE_DIGEST.md if failures > 0\n`;
    md += `2. Read LAST_CHANGED.md to see what files shifted\n`;
    md += `3. Check NEXT_TASK.md for the highest-priority action\n`;
    md += `4. If RLS = NOT RUN, trigger it before any schema work\n`;
    md += `5. Check API_MAP.json before calling any hook method\n`;
    md += `6. Check UTILITY_REGISTRY.md before writing any new helper\n\n`;

    // CONVENTIONS — extracted from GEMINI.md
    md += `## CONVENTIONS (extracted from GEMINI.md)\n`;
    const conventions = this.extractConventions();
    md += conventions ? conventions + '\n' : '  (none found — check GEMINI.md)\n';
    md += '\n';

    // KNOWN GOTCHAS — last 3 from LEARNING_LOG
    md += `## KNOWN GOTCHAS\n`;
    const gotchas = this.extractRecentGotchas(3);
    md += gotchas || '  (none yet — LEARNING_LOG.md is empty)\n';

    fs.writeFileSync(path.join(this.root, this.outputs.machineBriefing), md);
  }

  // ─────────────────────────────────────────────────────────────
  // FAILURE DIGEST  ← exact errors, no re-running needed
  // ─────────────────────────────────────────────────────────────
  private generateFailureDigest(results: Record<string, TaskResult>) {
    const failures = Object.values(results).filter(r => r.status === 'failed');
    const ts = new Date().toLocaleString();

    let md = `# FAILURE DIGEST\n*${ts}*\n\n`;

    if (failures.length === 0) {
      md += '✅ No failures. All suites passed.\n';
      fs.writeFileSync(path.join(this.root, this.outputs.failureDigest), md);
      return;
    }

    md += `${failures.length} suite(s) failed. Exact errors below.\n\n`;

    for (const f of failures) {
      md += `---\n### ❌ ${f.name} (${f.duration?.toFixed(1) ?? 0}s)\n\n`;

      // Extract the most useful part of the output
      const output = f.output ?? '';

      // Pull out specific error lines
      const errorLines = output
        .split('\n')
        .filter(l =>
          /error|fail|expect|assert|cannot|undefined|null|timeout|ENOENT|SyntaxError/i.test(l) &&
          l.trim().length > 0
        )
        .slice(0, 20);

      if (errorLines.length > 0) {
        md += '**Key error lines:**\n```\n';
        md += errorLines.join('\n');
        md += '\n```\n\n';
      }

      // Full tail for context
      md += '**Full output (last 800 chars):**\n```\n';
      md += output.slice(-800);
      md += '\n```\n\n';
    }

    fs.writeFileSync(path.join(this.root, this.outputs.failureDigest), md);
  }

  // ─────────────────────────────────────────────────────────────
  // LAST CHANGED  ← git diff, no more manual git log
  // ─────────────────────────────────────────────────────────────
  private generateLastChanged() {
    const ts = new Date().toLocaleString();
    let md = `# LAST CHANGED\n*${ts}*\n\n`;

    // Last commit info
    const lastCommit = this.safeExec(
      'git log -1 --pretty=format:"%H%n%s%n%an%n%ar" 2>&1',
      this.projectRoot
    );

    // Files changed in last commit
    const changedFiles = this.safeExec(
      'git log -1 --name-status --pretty=format:"" 2>&1',
      this.projectRoot
    );

    // Uncommitted changes
    const uncommitted = this.safeExec(
      'git status --short 2>&1',
      this.projectRoot
    );

    if (lastCommit) {
      const [hash, subject, author, when] = lastCommit.split('\n');
      md += `## Last Commit\n`;
      md += `- **Hash**: \`${hash?.slice(0, 8) ?? 'unknown'}\`\n`;
      md += `- **Message**: ${subject ?? '—'}\n`;
      md += `- **Author**: ${author ?? '—'}\n`;
      md += `- **When**: ${when ?? '—'}\n\n`;
    }

    if (changedFiles?.trim()) {
      md += `## Files in Last Commit\n\`\`\`\n${changedFiles.trim()}\n\`\`\`\n\n`;
    }

    if (uncommitted?.trim()) {
      md += `## Uncommitted Changes\n\`\`\`\n${uncommitted.trim()}\n\`\`\`\n\n`;

      // Highlight test-adjacent files
      const affectedTests = uncommitted
        .split('\n')
        .filter(l => /test|spec|__tests__/i.test(l))
        .map(l => l.trim());

      if (affectedTests.length > 0) {
        md += `### Tests Potentially Affected\n`;
        affectedTests.forEach(t => md += `- ${t}\n`);
        md += '\n';
      }
    } else {
      md += `## Uncommitted Changes\nWorking tree is clean.\n\n`;
    }

    fs.writeFileSync(path.join(this.root, this.outputs.lastChanged), md);
  }

  // ─────────────────────────────────────────────────────────────
  // AGENT CONTEXT (preserved, slightly tightened)
  // ─────────────────────────────────────────────────────────────
  private generateAgentContext(
    results: Record<string, TaskResult>,
    surfaceMap?: any,
    analystResults?: any
  ) {
    let md = '# 🧠 Agent Briefing\n\n';
    md += '> For detailed machine context read MACHINE_BRIEFING.md first.\n\n';

    if (surfaceMap) {
      md += `## Surface\n- Hooks: ${surfaceMap.hooks.length}\n- Pages: ${surfaceMap.pages.length}\n`;
      if (surfaceMap.gaps?.length > 0) {
        md += `- Coverage gaps: ${surfaceMap.gaps.length}\n`;
        surfaceMap.gaps.slice(0, 5).forEach((g: string) => md += `  - ${g}\n`);
      }
    }

    const failures = Object.values(results).filter(r => r.status === 'failed');
    if (failures.length > 0) {
      md += '\n## 🚨 Failures\n';
      failures.forEach(f => md += `- **${f.name}**: failing — see FAILURE_DIGEST.md\n`);
    } else {
      md += '\n## ✅ All Green\n';
    }

    if (analystResults?.deadCode?.length > 0) {
      md += `\n## Maintenance\n- Dead code: ${analystResults.deadCode.length} symbols\n`;
    }

    if (md.length > 20000) md = md.slice(0, 19900) + '\n... [TRUNCATED]';
    fs.writeFileSync(path.join(this.root, this.outputs.agentContext), md);
  }

  // ─────────────────────────────────────────────────────────────
  // NEXT TASK
  // ─────────────────────────────────────────────────────────────
  private generateNextTask(
    results: Record<string, TaskResult>,
    analystResults?: any,
    surfaceMap?: any
  ) {
    let md = '# 📋 NEXT TASK (P0 → P1 → P2)\n\n';
    md += '> Copy and paste to agent.\n\n';

    const failures = Object.values(results).filter(r => r.status === 'failed');

    if (failures.length > 0) {
      md += '### 🛠️ P0: Fix Regressions\n';
      failures.forEach(f => md += `- [ ] Fix **${f.name}** — see FAILURE_DIGEST.md for exact errors\n`);
      md += '\n';
    }

    if (analystResults?.deadCode?.length > 0) {
      md += '### 🧹 P1: Cleanup\n';
      md += `- [ ] Remove/verify ${analystResults.deadCode.length} unused exports\n\n`;
    }

    if (surfaceMap?.gaps?.length > 0) {
      md += '### 🧪 P1: Fill Coverage Gaps\n';
      surfaceMap.gaps.slice(0, 3).forEach((g: string) => md += `- [ ] ${g}\n`);
      md += '\n';
    }

    if (failures.length === 0) {
      md += '### 🚀 P2: Proceed with Backlog\n- [ ] Codebase stable. Ready for next feature.\n';
    }

    // Anti-hallucination guardrails block
    const gotchas = this.extractRecentGotchas(3);
    if (gotchas) {
      md += '\n---\n## ⚠️ Anti-Hallucination Guardrails\n';
      md += '> Read before touching ANY code. These are proven project traps.\n\n';
      md += gotchas;
    }

    fs.writeFileSync(path.join(this.root, this.outputs.nextTask), md);
  }

  // ─────────────────────────────────────────────────────────────
  // AUTO LEARNING LOG — appends dated entries after any failure
  // ─────────────────────────────────────────────────────────────
  autoAppendLearning(results: Record<string, TaskResult>): void {
    const failures = Object.values(results).filter(r => r.status === 'failed');
    if (failures.length === 0) return;

    const logPath = path.join(this.projectRoot, 'docs', 'LEARNING_LOG.md');
    const docsDir = path.join(this.projectRoot, 'docs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    const ts = new Date().toISOString().slice(0, 10);
    let entry = `\n---\n\n## [${ts}] Cortex Auto-Entry\n\n`;

    for (const f of failures) {
      const firstError = this.extractFirstError(f.output);
      entry += `### Suite: ${f.name}\n`;
      entry += `**First Error**: \`${firstError}\`\n`;
      entry += `**Duration**: ${f.duration?.toFixed(1) ?? '?'}s\n`;
      entry += `**Root Cause**: *[Agent to fill in]*\n`;
      entry += `**Fix Applied**: *[Agent to fill in]*\n`;
      entry += `**Prevention Rule**: *[Agent to fill in]*\n\n`;
    }

    // Initialize file if it doesn't exist
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '# 📖 Questerix Learning Log\n\n> Auto-maintained by Cortex. Reviewed by the agent at session start.\n', 'utf-8');
    }

    fs.appendFileSync(logPath, entry, 'utf-8');
  }

  // ─────────────────────────────────────────────────────────────
  // CONVENTIONS — extract coding standards from GEMINI.md
  // ─────────────────────────────────────────────────────────────
  private extractConventions(): string {
    try {
      const geminiPath = path.join(this.projectRoot, 'GEMINI.md');
      if (!fs.existsSync(geminiPath)) return '';
      const content = fs.readFileSync(geminiPath, 'utf-8');
      // Extract the Coding Standards section
      const match = content.match(/##\s*Coding Standards([\s\S]*?)(?=\n##|$)/);
      if (!match) return '';
      return match[1]
        .split('\n')
        .filter(l => l.trim())
        .slice(0, 8)
        .map(l => '  ' + l.trim())
        .join('\n');
    } catch {
      return '';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RECENT GOTCHAS — last N entries from LEARNING_LOG
  // ─────────────────────────────────────────────────────────────
  private extractRecentGotchas(n: number): string {
    try {
      const logPath = path.join(this.projectRoot, 'docs', 'LEARNING_LOG.md');
      if (!fs.existsSync(logPath)) return '';
      const content = fs.readFileSync(logPath, 'utf-8');
      // Split on section headers, take last n
      const entries = content.split(/\n---\n/).filter(e => e.includes('Prevention Rule'));
      return entries
        .slice(-n)
        .map(e => {
          const ruleMatch = e.match(/Prevention Rule\*\*: (.+)/);
          const suiteMatch = e.match(/### Suite: (.+)/);
          if (ruleMatch && ruleMatch[1] !== '*[Agent to fill in]*') {
            return `- **${suiteMatch?.[1] ?? 'Unknown'}**: ${ruleMatch[1]}`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    } catch {
      return '';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  private safeExec(cmd: string, cwd: string): string {
    try {
      return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 5000 });
    } catch {
      return '';
    }
  }

  private extractFirstError(output: string): string {
    if (!output) return 'no output captured';
    const errorLine = output
      .split('\n')
      .find(l => /error|fail|expect|cannot|timeout/i.test(l) && l.trim());
    return (errorLine ?? output.split('\n')[0])?.trim().slice(0, 120) ?? 'unknown error';
  }

  private parseOpenTasks(): string {
    try {
      const tasksPath = path.join(this.projectRoot, 'tasks.md');
      if (!fs.existsSync(tasksPath)) return '';
      const content = fs.readFileSync(tasksPath, 'utf-8');
      return content
        .split('\n')
        .filter(l => /^\s*-\s*\[ \]/.test(l))
        .slice(0, 10)
        .map(l => '  ' + l.trim())
        .join('\n');
    } catch {
      return '';
    }
  }

  private countMigrations(): number {
    try {
      const migrationsPath = path.join(this.projectRoot, 'supabase', 'migrations');
      return fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).length;
    } catch {
      return 0;
    }
  }
}
