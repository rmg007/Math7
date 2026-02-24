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

  constructor(adminPanelPath: string) {
    this.adminPanelPath = adminPanelPath;
  }

  async runSuite(name: string, command: string): Promise<TaskResult> {
    const start = Date.now();
    this.results[name] = { name, status: 'running', output: '' };
    
    console.log(chalk.blue(`\n🏃 Running ${name}...`));
    
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: this.adminPanelPath });
      const duration = (Date.now() - start) / 1000;
      
      this.results[name] = {
        name,
        status: 'passed',
        output: stdout + stderr,
        duration
      };
      
      console.log(chalk.green(`✅ ${name} passed (${duration.toFixed(1)}s)`));
      return this.results[name];
    } catch (error: any) {
      const duration = (Date.now() - start) / 1000;
      this.results[name] = {
        name,
        status: 'failed',
        output: error.stdout + error.stderr,
        duration
      };
      
      console.log(chalk.red(`❌ ${name} failed (${duration.toFixed(1)}s)`));
      return this.results[name];
    }
  }

  getResults() {
    return this.results;
  }
}
