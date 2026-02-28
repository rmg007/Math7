import { spawn } from "child_process";
import { EventEmitter } from "events";

export interface SmokeCheckResult {
  category: "Infrastructure" | "Authentication" | "Multi-Tenancy" | "Supabase Connectivity" | "Admin Data Render";
  name: string;
  passed: boolean;
  detail?: string;
  durationMs?: number;
}

export interface VerifyDeployResult {
  targetUrl: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  checks: SmokeCheckResult[];
  rawOutput?: string;
  error?: string;
}

export interface VerifyDeployHistory {
  id: string;
  targetUrl: string;
  timestamp: string;
  passed: boolean;
  passedChecks: number;
  totalChecks: number;
  durationMs: number;
}

export type VerifyDeployEventMap = {
  checkUpdate: [check: SmokeCheckResult];
  progress: [message: string, color?: "cyan" | "green" | "red" | "gray"];
  complete: [result: VerifyDeployResult];
  error: [message: string];
};

/**
 * VerifyDeployRunner
 * Runs the @smoke-tagged Playwright suite against a configurable target URL.
 * Emits streaming events so the dashboard can display live results.
 */
export class VerifyDeployRunner extends EventEmitter {
  private adminPanelPath: string;

  constructor(adminPanelPath: string) {
    super();
    this.adminPanelPath = adminPanelPath;
  }

  /**
   * Run the @smoke suite against the given target URL.
   * Streams events as checks complete.
   */
  async run(targetUrl: string): Promise<VerifyDeployResult> {
    const startTime = new Date().toISOString();
    const startMs = Date.now();

    this.emit("progress", `🚀 Starting Verify Deploy → ${targetUrl}`, "cyan");

    // Normalise trailing slash
    const baseURL = targetUrl.replace(/\/$/, "");

    const checks: SmokeCheckResult[] = [];

    try {
      // Run Playwright with @smoke grep, overriding the baseURL
      const result = await this.runPlaywrightSmoke(baseURL, checks);

      const endMs = Date.now();
      const endTime = new Date().toISOString();
      const durationMs = endMs - startMs;
      const passedChecks = checks.filter((c) => c.passed).length;
      const totalChecks = checks.length;
      const passed = result.exitCode === 0;

      const finalResult: VerifyDeployResult = {
        targetUrl: baseURL,
        startTime,
        endTime,
        durationMs,
        passed,
        totalChecks,
        passedChecks,
        checks,
        rawOutput: result.rawOutput,
      };

      if (passed) {
        this.emit("progress", `✅ All ${passedChecks}/${totalChecks} smoke checks passed (${(durationMs / 1000).toFixed(1)}s)`, "green");
      } else {
        this.emit("progress", `❌ ${totalChecks - passedChecks}/${totalChecks} smoke checks FAILED (${(durationMs / 1000).toFixed(1)}s)`, "red");
      }

      this.emit("complete", finalResult);
      return finalResult;
    } catch (err: any) {
      const endMs = Date.now();
      const durationMs = endMs - startMs;
      const errorMsg = err?.message ?? String(err);

      const failResult: VerifyDeployResult = {
        targetUrl: baseURL,
        startTime,
        endTime: new Date().toISOString(),
        durationMs,
        passed: false,
        totalChecks: checks.length,
        passedChecks: checks.filter((c) => c.passed).length,
        checks,
        error: errorMsg,
      };

      this.emit("progress", `❌ Verify Deploy crashed: ${errorMsg}`, "red");
      this.emit("complete", failResult);
      return failResult;
    }
  }

  private runPlaywrightSmoke(
    baseURL: string,
    checks: SmokeCheckResult[]
  ): Promise<{ exitCode: number; rawOutput: string }> {
    return new Promise((resolve) => {
      // Run only @smoke-tagged tests, with the baseURL overridden to the target
      const playwrightArgs = [
        "playwright",
        "test",
        "--project=desktop",
        "--grep",
        "@smoke",
        "--reporter=json",
      ];

      this.emit("progress", `  Running: npx ${playwrightArgs.join(" ")}`, "gray");

      const child = spawn("npx", playwrightArgs, {
        cwd: this.adminPanelPath,
        shell: true,
        env: {
          ...process.env,
          // PLAYWRIGHT_TEST_BASE_URL is the official Playwright env override for baseURL
          PLAYWRIGHT_TEST_BASE_URL: baseURL,
        },
      });

      let rawOutput = "";

      const handleData = (data: Buffer) => {
        const text = data.toString();
        rawOutput += text;

        // Parse streaming JSON reporter lines for live check updates
        const lines = text.split("\n");
        for (const line of lines) {
          this.tryParsePlaywrightJsonLine(line.trim(), checks);
        }
      };

      child.stdout.on("data", handleData);
      child.stderr.on("data", (data: Buffer) => {
        const text = data.toString();
        rawOutput += text;
        // Emit relevant stderr lines as progress
        const trimmed = text.trim();
        if (trimmed && !trimmed.startsWith("[playwright]")) {
          this.emit("progress", `  ${trimmed}`, "gray");
        }
      });

      child.on("close", (code) => {
        // Parse the final JSON output (Playwright JSON reporter writes to stdout)
        this.parseFinalPlaywrightJson(rawOutput, checks);
        resolve({ exitCode: code ?? 1, rawOutput });
      });

      child.on("error", (err) => {
        rawOutput += `\n[spawn error] ${err.message}`;
        resolve({ exitCode: 1, rawOutput });
      });
    });
  }

  private tryParsePlaywrightJsonLine(line: string, checks: SmokeCheckResult[]): void {
    // Playwright list reporter lines look like "  ✓  test name (1.2s)"
    // We emit progress for these
    if (line.startsWith("✓") || line.startsWith("✘") || line.startsWith("×")) {
      this.emit("progress", `  ${line}`, line.startsWith("✓") ? "green" : "red");
    }
  }

  private parseFinalPlaywrightJson(rawOutput: string, checks: SmokeCheckResult[]): void {
    // Extract the JSON object that Playwright's JSON reporter emits
    // It's typically the last large JSON block in stdout
    const jsonMatch = rawOutput.match(/(\{[\s\S]*"suites"[\s\S]*\})\s*$/);
    if (!jsonMatch) return;

    try {
      const report = JSON.parse(jsonMatch[1]);
      const suites: any[] = report.suites ?? [];

      for (const suite of suites) {
        this.processSuite(suite, checks);
      }
    } catch {
      // Silent fallback — checks stay empty, result falls back to exit code
    }
  }

  private processSuite(suite: any, checks: SmokeCheckResult[]): void {
    const title: string = suite.title ?? "";

    for (const spec of suite.specs ?? []) {
      const specTitle: string = spec.title ?? "";
      const category = this.detectCategory(title + " " + specTitle);
      const durationMs = spec.tests?.[0]?.results?.[0]?.duration ?? 0;
      const passed = spec.ok === true;
      const errorMsg = spec.tests?.[0]?.results?.[0]?.error?.message;

      const check: SmokeCheckResult = {
        category,
        name: specTitle || title,
        passed,
        detail: errorMsg,
        durationMs,
      };

      checks.push(check);
      this.emit("checkUpdate", check);
      this.emit(
        "progress",
        `  ${passed ? "✅" : "❌"} [${category}] ${check.name}`,
        passed ? "green" : "red"
      );
    }

    // Recurse into sub-suites
    for (const sub of suite.suites ?? []) {
      this.processSuite(sub, checks);
    }
  }

  private detectCategory(text: string): SmokeCheckResult["category"] {
    const lower = text.toLowerCase();
    if (lower.includes("infrastructure") || lower.includes("header") || lower.includes("asset") || lower.includes("200") || lower.includes("csp")) {
      return "Infrastructure";
    }
    if (lower.includes("auth") || lower.includes("login") || lower.includes("logout") || lower.includes("redirect") || lower.includes("unauthenticated")) {
      return "Authentication";
    }
    if (lower.includes("tenant") || lower.includes("subdomain") || lower.includes("branding") || lower.includes("app")) {
      return "Multi-Tenancy";
    }
    if (lower.includes("supabase") || lower.includes("rest") || lower.includes("edge function") || lower.includes("connectivity") || lower.includes("api")) {
      return "Supabase Connectivity";
    }
    if (lower.includes("admin") || lower.includes("platform") || lower.includes("subject") || lower.includes("render") || lower.includes("data")) {
      return "Admin Data Render";
    }
    return "Infrastructure";
  }
}
