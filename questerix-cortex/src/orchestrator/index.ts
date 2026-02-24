import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TaskResult {
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  output: string;
  duration?: number;
}

export class Orchestrator {
  private results: Record<string, TaskResult> = {};
  private adminPanelPath: string;
  private log?: (text: string, color?: 'cyan' | 'green' | 'red' | 'gray', bold?: boolean) => void;

  constructor(adminPanelPath: string, log?: (text: string, color?: 'cyan' | 'green' | 'red' | 'gray', bold?: boolean) => void) {
    this.adminPanelPath = adminPanelPath;
    this.log = log;
  }

  /** Run a single suite sequentially. */
  async runSuite(name: string, command: string): Promise<TaskResult> {
    const start = Date.now();
    this.results[name] = { name, status: 'running', output: '' };

    console.log(chalk.blue(`\n🏃 Running ${name}...`));
    if (this.log) this.log(`\n🏃 Running ${name}...`, 'cyan');

    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: this.adminPanelPath,
        timeout: 900_000 // 15 minute timeout for long-running verification suites
      });
      const duration = (Date.now() - start) / 1000;
      this.results[name] = { name, status: 'passed', output: stdout + stderr, duration };
      console.log(chalk.green(`✅ ${name} passed (${duration.toFixed(1)}s)`));
      if (this.log) this.log(`✅ ${name} passed (${duration.toFixed(1)}s)`, 'green');
      return this.results[name];
    } catch (error: any) {
      const duration = (Date.now() - start) / 1000;
      this.results[name] = { name, status: 'failed', output: error.stdout + error.stderr, duration };
      console.log(chalk.red(`❌ ${name} failed (${duration.toFixed(1)}s)`));
      if (this.log) this.log(`❌ ${name} failed (${duration.toFixed(1)}s)`, 'red');
      return this.results[name];
    }
  }

  /**
   * Run multiple suites in parallel (Promise.all).
   * All are marked 'running' before execution begins so the dashboard
   * can show them as in-progress simultaneously.
   */
  async runSuitesConcurrent(
    suites: Array<{ name: string; command: string }>,
    onProgress?: () => void
  ): Promise<TaskResult[]> {
    // Mark all as running up-front so the dashboard updates immediately
    for (const s of suites) {
      this.results[s.name] = { name: s.name, status: 'running', output: '' };
    }
    if (onProgress) onProgress();

    const names = suites.map(s => s.name).join(', ');
    console.log(chalk.blue(`\n🏃 Running ${suites.length} suites in parallel: ${names}`));
    if (this.log) this.log(`\n🏃 Running ${suites.length} suites in parallel: ${names}`, 'cyan');

    const settled = await Promise.allSettled(
      suites.map(s => this.runSuite(s.name, s.command))
    );

    return settled.map(r => (r.status === 'fulfilled' ? r.value : r.reason));
  }

  getResults() {
    return this.results;
  }

  clearResults() {
    this.results = {};
  }
}
