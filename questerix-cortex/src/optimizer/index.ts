import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface ZombieProcess {
  name: string;
  pid: number;
  cpuSeconds: number;
  memoryMB: number;
  reason: string;
}

export interface GitignoreGap {
  path: string;
  reason: string;
}

export interface WatcherGap {
  path: string;
  reason: string;
  severity: 'CRITICAL' | 'MEDIUM';
}

export interface LargeFile {
  path: string;
  sizeMB: number;
  reason: string;
}

export interface McpDeadServer {
  name: string;
  command: string;
  reason: string;
}

export interface OptimizeReport {
  timestamp: string;
  zombies: ZombieProcess[];
  gitignoreGaps: GitignoreGap[];
  watcherGaps: WatcherGap[];
  largeFiles: LargeFile[];
  mcpDeadServers: McpDeadServer[];
  shellIntegrationEnabled: boolean;
  verdict: 'CLEAN' | 'NEEDS_ATTENTION';
  summary: string;
}

// Processes that should never be running in this project (pure TS/React workspace)
const ZOMBIE_SUSPECTS = [
  { pattern: 'dart.exe', reason: 'Flutter/Dart SDK process — not used in this project (pure TS/React)' },
  { pattern: 'flutter.exe', reason: 'Flutter CLI — not used in this project' },
];

// Directories that if present on disk should always be in .gitignore and watcherExclude
const EXPECTED_IGNORED = [
  { rel: 'admin-panel/node_modules', label: 'Admin Panel node_modules' },
  { rel: 'questerix-cortex/node_modules', label: 'Cortex node_modules' },
  { rel: 'admin-panel/dist', label: 'Admin Panel dist' },
  { rel: 'questerix-cortex/dist', label: 'Cortex dist' },
  { rel: 'questerix-cortex/outputs', label: 'Cortex generated outputs' },
  { rel: 'admin-panel/coverage', label: 'Coverage output' },
  { rel: 'admin-panel/playwright-report', label: 'Playwright report' },
  { rel: 'admin-panel/test-results', label: 'Test results' },
  { rel: '.wrangler', label: 'Wrangler cache' },
  { rel: '.supabase', label: 'Supabase CLI state' },
  { rel: '__pycache__', label: 'Python cache' },
];

// MCP server commands that indicate dead/unused runtimes for this project
const DEAD_MCP_COMMANDS = [
  { command: 'dart', reason: 'Dart SDK not used — this is a pure TypeScript/React project' },
  { command: 'flutter', reason: 'Flutter not used — this is a pure TypeScript/React project' },
];

export class OptimizeAuditor {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  audit(): OptimizeReport {
    const zombies = this.detectZombies();
    const gitignoreGaps = this.detectGitignoreGaps();
    const watcherGaps = this.detectWatcherGaps();
    const largeFiles = this.detectLargeFiles();
    const mcpDeadServers = this.detectMcpDeadServers();
    const shellIntegrationEnabled = this.checkShellIntegration();

    const totalIssues = zombies.length + gitignoreGaps.length + watcherGaps.length + largeFiles.length + mcpDeadServers.length + (shellIntegrationEnabled ? 1 : 0);
    const verdict: 'CLEAN' | 'NEEDS_ATTENTION' = totalIssues === 0 ? 'CLEAN' : 'NEEDS_ATTENTION';

    const summary = totalIssues === 0
      ? '✅ Workspace is fully optimized. No performance issues detected.'
      : `⚠️ Found ${totalIssues} optimization issue(s). ` +
        (watcherGaps.some(g => g.severity === 'CRITICAL') || largeFiles.length > 0
          ? '🔴 CRITICAL: Potential "Agent Loading" deadlock detected.'
          : '🟡 Recommendation: Apply improvements for smoother IDE experience.');

    return {
      timestamp: new Date().toISOString(),
      zombies,
      gitignoreGaps,
      watcherGaps,
      largeFiles,
      mcpDeadServers,
      shellIntegrationEnabled,
      verdict,
      summary,
    };
  }

  private detectZombies(): ZombieProcess[] {
    const found: ZombieProcess[] = [];
    try {
      const raw = execSync(
        `powershell -NoProfile -Command "Get-Process | Select-Object Name, Id, CPU, WorkingSet | ConvertTo-Json"`,
        { stdio: ['pipe', 'pipe', 'ignore'] }
      ).toString();

      const processes: Array<{ Name: string; Id: number; CPU: number; WorkingSet: number }> = JSON.parse(raw);

      for (const proc of processes) {
        for (const suspect of ZOMBIE_SUSPECTS) {
          if (proc.Name.toLowerCase().includes(suspect.pattern.replace('.exe', ''))) {
            found.push({
              name: proc.Name,
              pid: proc.Id,
              cpuSeconds: Math.round((proc.CPU ?? 0) * 10) / 10,
              memoryMB: Math.round((proc.WorkingSet ?? 0) / 1024 / 1024),
              reason: suspect.reason,
            });
          }
        }
      }
    } catch {
      // Non-Windows or permission denied — skip
    }
    return found;
  }

  private detectGitignoreGaps(): GitignoreGap[] {
    const gaps: GitignoreGap[] = [];
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    if (!fs.existsSync(gitignorePath)) return gaps;

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

    for (const candidate of EXPECTED_IGNORED) {
      const fullPath = path.join(this.projectRoot, candidate.rel);
      if (!fs.existsSync(fullPath)) continue; // doesn't exist on disk — no issue

      // Check if anything in .gitignore would cover this path
      const relativized = candidate.rel.replace(/\\/g, '/');
      const basename = path.basename(candidate.rel);
      const covered = gitignoreContent.includes(relativized) ||
        gitignoreContent.includes(basename + '/') ||
        gitignoreContent.includes('**/' + basename) ||
        gitignoreContent.includes(basename);

      if (!covered) {
        gaps.push({ path: candidate.rel, reason: `${candidate.label} exists on disk but is not in .gitignore` });
      }
    }
    return gaps;
  }

  private detectWatcherGaps(): WatcherGap[] {
    const gaps: WatcherGap[] = [];
    const vscodeSettingsPath = path.join(this.projectRoot, '.vscode', 'settings.json');
    if (!fs.existsSync(vscodeSettingsPath)) {
      return [{ path: '.vscode/settings.json', reason: 'File missing — no watcher exclusions defined', severity: 'MEDIUM' }];
    }

    let settings: Record<string, unknown> = {};
    try {
      const raw = fs.readFileSync(vscodeSettingsPath, 'utf-8')
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      settings = JSON.parse(raw);
    } catch {
      return [{ path: '.vscode/settings.json', reason: 'Could not parse settings.json', severity: 'MEDIUM' }];
    }

    const exclude = (settings['files.exclude'] as Record<string, boolean>) ?? {};
    const watcherExclude = (settings['files.watcherExclude'] as Record<string, boolean>) ?? {};

    // Normalize a glob key for comparison — strip trailing /** or /*
    const normalize = (k: string) => k.replace(/\/\*\*$/, '').replace(/\/\*$/, '');

    const watcherNormalized = Object.keys(watcherExclude).map(normalize);

    // Every key in files.exclude should also appear (normalized) in files.watcherExclude
    for (const key of Object.keys(exclude)) {
      const norm = normalize(key);
      const covered = watcherNormalized.some(wk => wk === norm || wk.startsWith(norm));
      if (!covered) {
        gaps.push({ 
          path: key, 
          reason: `Missing from files.watcherExclude. IDE still watches this excluded folder.`,
          severity: key.includes('node_modules') ? 'CRITICAL' : 'MEDIUM'
        });
      }
    }

    // Explicit check for node_modules in watcherExclude
    const hasNodeEx = watcherNormalized.some(k => k.includes('node_modules'));
    if (!hasNodeEx) {
      gaps.push({
        path: '**/node_modules',
        reason: 'CRITICAL: node_modules must be in files.watcherExclude to prevent "Agent Loading" deadlocks.',
        severity: 'CRITICAL'
      });
    }

    return gaps;
  }

  private detectMcpDeadServers(): McpDeadServer[] {
    const found: McpDeadServer[] = [];
    const mcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');
    if (!fs.existsSync(mcpPath)) return found;

    let config: { mcpServers?: Record<string, { command?: string }> } = {};
    try {
      config = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
    } catch {
      return found;
    }

    const servers = config.mcpServers ?? {};
    for (const [name, server] of Object.entries(servers)) {
      if (!server.command) continue;
      for (const dead of DEAD_MCP_COMMANDS) {
        if (server.command.toLowerCase().includes(dead.command.toLowerCase())) {
          found.push({ name, command: server.command, reason: dead.reason });
        }
      }
    }
    return found;
  }

  private checkShellIntegration(): boolean {
    const vscodeSettingsPath = path.join(this.projectRoot, '.vscode', 'settings.json');
    if (!fs.existsSync(vscodeSettingsPath)) return true; // assume on if no settings

    try {
      const raw = fs.readFileSync(vscodeSettingsPath, 'utf-8')
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      const settings = JSON.parse(raw);
      return settings['terminal.integrated.shellIntegration.enabled'] !== false;
    } catch {
      return true;
    }
  }

  private detectLargeFiles(): LargeFile[] {
    const issues: LargeFile[] = [];
    const outputsPath = path.join(this.projectRoot, 'questerix-cortex', 'outputs');
    if (!fs.existsSync(outputsPath)) return issues;

    const files = fs.readdirSync(outputsPath);
    for (const file of files) {
      const fullPath = path.join(outputsPath, file);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) continue;
        const sizeMB = stats.size / (1024 * 1024);
        if (sizeMB > 1.5) {
          issues.push({
            path: `outputs/${file}`,
            sizeMB: parseFloat(sizeMB.toFixed(2)),
            reason: 'Oversized output file. Massive text files in outputs/ can cause "Agent Loading" hangs during indexing.'
          });
        }
      } catch {
        // skip inaccessible
      }
    }
    return issues;
  }

  generateMarkdownReport(report: OptimizeReport): string {
    const lines: string[] = [
      `# 🚀 Optimize Report`,
      `**Generated:** ${new Date(report.timestamp).toLocaleString()}`,
      `**Verdict:** ${report.verdict === 'CLEAN' ? '✅ CLEAN' : '⚠️ NEEDS ATTENTION'}`,
      ``,
      `> ${report.summary}`,
      ``,
    ];

    // Zombies
    lines.push(`## 🧟 Zombie Processes`);
    if (report.zombies.length === 0) {
      lines.push(`_None detected._`);
    } else {
      lines.push(`| Process | PID | CPU (s) | RAM (MB) | Reason |`);
      lines.push(`|---|---|---|---|---|`);
      for (const z of report.zombies) {
        lines.push(`| \`${z.name}\` | ${z.pid} | ${z.cpuSeconds} | ${z.memoryMB} | ${z.reason} |`);
      }
      lines.push(``);
      lines.push(`**Fix:** Run \`Stop-Process -Id <PID> -Force\` for each, or re-run \`/optimize\`.`);
    }
    lines.push(``);

    // Gitignore gaps
    lines.push(`## 📁 Gitignore Gaps`);
    if (report.gitignoreGaps.length === 0) {
      lines.push(`_All expected directories are covered._`);
    } else {
      for (const g of report.gitignoreGaps) {
        lines.push(`- \`${g.path}\` — ${g.reason}`);
      }
    }
    lines.push(``);

    // Watcher gaps
    lines.push(`## 👁 Watcher Gaps`);
    if (report.watcherGaps.length === 0) {
      lines.push(`_All excluded paths are also excluded from the file watcher._`);
    } else {
      for (const w of report.watcherGaps) {
        const severityStr = w.severity === 'CRITICAL' ? '🔴 **CRITICAL**' : '🟡 MEDIUM';
        lines.push(`- ${severityStr}: \`${w.path}\` — ${w.reason}`);
      }
    }
    lines.push(``);

    // Large files
    lines.push(`## 📦 Oversized Outputs`);
    if (report.largeFiles.length === 0) {
      lines.push(`_No oversized output files detected._`);
    } else {
      for (const f of report.largeFiles) {
        lines.push(`- 🔴 **CRITICAL**: \`${f.path}\` — ${f.sizeMB} MB. ${f.reason}`);
      }
    }
    lines.push(``);

    // MCP dead servers
    lines.push(`## 🔌 MCP Dead Servers`);
    if (report.mcpDeadServers.length === 0) {
      lines.push(`_All MCP servers appear to be relevant to this project._`);
    } else {
      for (const m of report.mcpDeadServers) {
        lines.push(`- **${m.name}** (\`${m.command}\`) — ${m.reason}`);
      }
      lines.push(``);
      lines.push(`**Fix:** Remove the listed entries from \`~/.cursor/mcp.json\`.`);
    }
    lines.push(``);

    // Shell integration
    lines.push(`## 🖥 Shell Integration`);
    if (report.shellIntegrationEnabled) {
      lines.push(`⚠️ \`terminal.integrated.shellIntegration.enabled\` is **ON** — this adds UI thread overhead.`);
      lines.push(`**Fix:** Set \`"terminal.integrated.shellIntegration.enabled": false\` in \`.vscode/settings.json\`.`);
    } else {
      lines.push(`✅ Shell integration is disabled.`);
    }

    return lines.join('\n');
  }
}
