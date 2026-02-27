import chalk from "chalk";
import { spawn } from "child_process";

export interface TaskResult {
  name: string;
  status: "passed" | "failed" | "running" | "pending";
  output: string;
  duration?: number;
  timedOut?: boolean;
}

export class Orchestrator {
  private results: Record<string, TaskResult> = {};
  private adminPanelPath: string;
  private log?: (
    text: string,
    color?: "cyan" | "green" | "red" | "gray",
    bold?: boolean,
  ) => void;
  private gateFailedAt?: string;

  constructor(
    adminPanelPath: string,
    log?: (
      text: string,
      color?: "cyan" | "green" | "red" | "gray",
      bold?: boolean,
    ) => void,
  ) {
    this.adminPanelPath = adminPanelPath;
    this.log = log;
  }

  /** Run a single suite sequentially with optional timeout. */
  async runSuite(
    name: string,
    command: string,
    timeoutMs?: number,
    onProgress?: () => void,
  ): Promise<TaskResult> {
    const start = Date.now();
    this.results[name] = { name, status: "running", output: "" };
    if (onProgress) onProgress();

    console.log(chalk.blue(`\n🏃 Running ${name}...`));
    if (this.log) this.log(`\n🏃 Running ${name}...`, "cyan");

    return new Promise((resolve) => {
      const child = spawn(command, {
        cwd: this.adminPanelPath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "1" },
      });

      let output = "";

      const processStream = (data: any) => {
        const text = data.toString();
        output += text;
        
        const lines = text.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && this.shouldEmitLine(trimmed)) {
            if (this.log) this.log(`[${name}] ${trimmed}`, "gray");
            if (onProgress) onProgress();
          }
        }
      };

      child.stdout.on("data", processStream);
      child.stderr.on("data", processStream);

      const timeout = setTimeout(() => {
        child.kill();
        const duration = (Date.now() - start) / 1000;
        this.results[name] = {
          name,
          status: "failed",
          output: output + "\n[TIMEOUT]",
          duration,
          timedOut: true,
        };
        if (onProgress) onProgress();
        resolve(this.results[name]);
      }, timeoutMs ?? 900_000);

      child.on("close", (code) => {
        clearTimeout(timeout);
        const duration = (Date.now() - start) / 1000;
        const status = code === 0 ? "passed" : "failed";
        this.results[name] = {
          name,
          status,
          output,
          duration,
          timedOut: false,
        };
        if (status === "passed") {
          console.log(chalk.green(`✅ ${name} passed (${duration.toFixed(1)}s)`));
          if (this.log)
            this.log(`✅ ${name} passed (${duration.toFixed(1)}s)`, "green");
        } else {
          console.log(chalk.red(`❌ ${name} failed (${duration.toFixed(1)}s)`));
          if (this.log)
            this.log(`❌ ${name} failed (${duration.toFixed(1)}s)`, "red");
        }
        if (onProgress) onProgress();
        resolve(this.results[name]);
      });
    });
  }

  private shouldEmitLine(line: string): boolean {
    const lower = line.toLowerCase();
    // Progress indicators for Playwright/Vitest
    if (lower.includes("passed") || lower.includes("failed") || lower.includes("skipped") || lower.includes("running")) return true;
    if (line.match(/\[\d+\/\d+\]/)) return true; // [1/500]
    if (line.match(/\d+%\s+done/i)) return true; 
    if (line.includes("tests") && line.match(/\d+/)) return true;
    if (line.startsWith("ok") || line.startsWith("fail")) return true;
    return false;
  }

  /**
   * Run multiple suites in parallel (Promise.all).
   */
  async runSuitesConcurrent(
    suites: Array<{ name: string; command: string }>,
    onProgress?: () => void,
  ): Promise<TaskResult[]> {
    for (const s of suites) {
      this.results[s.name] = { name: s.name, status: "running", output: "" };
    }
    if (onProgress) onProgress();

    const names = suites.map((s) => s.name).join(", ");
    console.log(
      chalk.blue(`\n🏃 Running ${suites.length} suites in parallel: ${names}`),
    );
    if (this.log)
      this.log(
        `\n🏃 Running ${suites.length} suites in parallel: ${names}`,
        "cyan",
      );

    const settled = await Promise.allSettled(
      suites.map((s) => this.runSuite(s.name, s.command, undefined, onProgress)),
    );

    return settled.map((r) => (r.status === "fulfilled" ? r.value : r.reason));
  }

  getResults() {
    return this.results;
  }

  clearResults() {
    this.results = {};
    this.gateFailedAt = undefined;
  }

  setGateFailedAt(tier: string) {
    this.gateFailedAt = tier;
  }

  getGateFailedAt(): string | undefined {
    return this.gateFailedAt;
  }
}
