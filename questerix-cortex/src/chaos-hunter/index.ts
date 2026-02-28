import { spawn } from "child_process";
import { EventEmitter } from "events";

// ── Scenario types ─────────────────────────────────────────────────────────────

export type ChaosScenario = "latency" | "hard-fail" | "zombie";

export interface ChaosScenarioResult {
  scenario: ChaosScenario;
  label: string;
  passed: boolean;
  violations: ChaosViolation[];
  durationMs: number;
  detail?: string;
}

export interface ChaosViolation {
  /** The Playwright test title that failed */
  test: string;
  /** Type of failure observed */
  kind:
    | "blank-screen"
    | "unhandled-crash"
    | "missing-recovery-path"
    | "timeout"
    | "unexpected-failure";
  detail?: string;
}

export interface ChaosRunResult {
  startTime: string;
  endTime: string;
  durationMs: number;
  /** true iff ALL scenarios passed (zero violations) */
  passed: boolean;
  scenarios: ChaosScenarioResult[];
  totalViolations: number;
}

export interface ChaosRunOptions {
  /** Scenarios to run. Defaults to all three. */
  scenarios?: ChaosScenario[];
  /** Latency to inject in ms (default 5000) */
  latencyMs?: number;
  /** Supabase base URL to intercept (e.g. https://xyz.supabase.co) */
  supabaseUrl?: string;
}

// ── Chaos runner ───────────────────────────────────────────────────────────────

/**
 * ChaosHunter
 *
 * Runs the @chaos-tagged Playwright test suite under three controlled failure
 * scenarios:
 *
 *   1. Latency — 5,000ms delay on all /rest/v1/* API calls
 *   2. HardFail — Simulated 503 on specific Edge Function routes
 *   3. Zombie   — Simulated mid-request content-engine process death
 *
 * Each scenario is run as a separate Playwright invocation with the appropriate
 * environment variables injected. The playwright spec reads these env vars and
 * arms the relevant route intercepts via Playwright's network mocking API.
 *
 * Gate: zero ChaosViolations (blank screens / unhandled crashes) = PASS.
 */
export class ChaosHunter extends EventEmitter {
  private adminPanelPath: string;

  constructor(adminPanelPath: string) {
    super();
    this.adminPanelPath = adminPanelPath;
  }

  /** Run all (or selected) chaos scenarios. */
  async run(opts: ChaosRunOptions = {}): Promise<ChaosRunResult> {
    const scenarios = opts.scenarios ?? ["latency", "hard-fail", "zombie"];
    const latencyMs = opts.latencyMs ?? 5000;
    const supabaseUrl = opts.supabaseUrl ?? process.env.VITE_SUPABASE_URL ?? "";

    const startTime = new Date().toISOString();
    const startMs = Date.now();

    this.emit("progress", "🔥 ChaosHunter starting…", "cyan");
    this.emit(
      "progress",
      `   Scenarios: ${scenarios.join(", ")} | Latency: ${latencyMs}ms`,
      "gray"
    );

    const results: ChaosScenarioResult[] = [];

    for (const scenario of scenarios) {
      this.emit("progress", `\n▶ Running scenario: ${scenario}`, "cyan");

      const result = await this.runScenario(scenario, {
        latencyMs,
        supabaseUrl,
      });
      results.push(result);

      const icon = result.passed ? "✅" : "❌";
      const violationText = result.violations.length
        ? ` — ${result.violations.length} violation(s)`
        : "";
      this.emit(
        "progress",
        `${icon} [${scenario}] ${result.label}${violationText} (${(result.durationMs / 1000).toFixed(1)}s)`,
        result.passed ? "green" : "red"
      );

      if (!result.passed) {
        for (const v of result.violations) {
          this.emit("progress", `   ⚠️  ${v.kind}: ${v.test}`, "red");
          if (v.detail) {
            this.emit("progress", `      ${v.detail.slice(0, 120)}`, "gray");
          }
        }
      }

      this.emit("scenarioComplete", result);
    }

    const endMs = Date.now();
    const totalViolations = results.reduce(
      (sum, r) => sum + r.violations.length,
      0
    );
    const passed = totalViolations === 0;

    const finalResult: ChaosRunResult = {
      startTime,
      endTime: new Date().toISOString(),
      durationMs: endMs - startMs,
      passed,
      scenarios: results,
      totalViolations,
    };

    const summaryIcon = passed ? "✅" : "❌";
    this.emit(
      "progress",
      `\n${summaryIcon} ChaosHunter complete — ${totalViolations} violation(s) across ${scenarios.length} scenario(s)`,
      passed ? "green" : "red"
    );

    this.emit("complete", finalResult);
    return finalResult;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async runScenario(
    scenario: ChaosScenario,
    opts: { latencyMs: number; supabaseUrl: string }
  ): Promise<ChaosScenarioResult> {
    const scenarioMs = Date.now();

    const label = this.scenarioLabel(scenario);
    const env = this.buildEnv(scenario, opts);

    const { exitCode, rawOutput } = await this.runPlaywrightChaos(
      scenario,
      env
    );
    const violations = this.extractViolations(rawOutput, exitCode);

    return {
      scenario,
      label,
      passed: violations.length === 0,
      violations,
      durationMs: Date.now() - scenarioMs,
      detail: exitCode !== 0 ? `Exit code: ${exitCode}` : undefined,
    };
  }

  private scenarioLabel(scenario: ChaosScenario): string {
    switch (scenario) {
      case "latency":
        return "Latency Injection (5,000ms delay on Supabase REST calls)";
      case "hard-fail":
        return "Hard Failure (503 on Edge Functions)";
      case "zombie":
        return "Zombie (mid-request content-engine death)";
    }
  }

  private buildEnv(
    scenario: ChaosScenario,
    opts: { latencyMs: number; supabaseUrl: string }
  ): NodeJS.ProcessEnv {
    const base: NodeJS.ProcessEnv = {
      ...process.env,
      // Signal to the Playwright chaos spec which scenario is active
      CHAOS_SCENARIO: scenario,
      // Supabase URL to pattern-match for network interception
      CHAOS_SUPABASE_URL: opts.supabaseUrl,
    };

    if (scenario === "latency") {
      base.CHAOS_LATENCY_MS = String(opts.latencyMs);
    }

    return base;
  }

  /**
   * Run the @chaos-tagged Playwright suite with the given env injected.
   * Uses a dedicated `chaos` project in playwright.config.ts (if present),
   * falling back to `desktop`.
   */
  private runPlaywrightChaos(
    scenario: ChaosScenario,
    env: NodeJS.ProcessEnv
  ): Promise<{ exitCode: number; rawOutput: string }> {
    return new Promise((resolve) => {
      const args = [
        "playwright",
        "test",
        "--project=desktop",
        "--grep",
        "@chaos",
        "--reporter=json",
        // The active scenario is communicated via CHAOS_SCENARIO env var.
        // The spec uses test.skip() to run only the matching describe block.
      ];

      this.emit(
        "progress",
        `   npx ${args.join(" ")} [CHAOS_SCENARIO=${scenario}]`,
        "gray"
      );

      const child = spawn("npx", args, {
        cwd: this.adminPanelPath,
        shell: true,
        env,
      });

      let rawOutput = "";

      child.stdout.on("data", (data: Buffer) => {
        const text = data.toString();
        rawOutput += text;
        // Emit test-level progress lines
        for (const line of text.split("\n")) {
          const t = line.trim();
          if (t.startsWith("✓") || t.startsWith("✘") || t.startsWith("×")) {
            this.emit(
              "progress",
              `  ${t}`,
              t.startsWith("✓") ? "green" : "red"
            );
          }
        }
      });

      child.stderr.on("data", (data: Buffer) => {
        rawOutput += data.toString();
      });

      child.on("close", (code) => {
        resolve({ exitCode: code ?? 1, rawOutput });
      });

      child.on("error", (err) => {
        rawOutput += `\n[spawn error] ${err.message}`;
        resolve({ exitCode: 1, rawOutput });
      });
    });
  }

  /**
   * Parse the Playwright JSON reporter output for violations.
   * A violation = a failed test that contains "blank", "crash", "recovery",
   * or any unexpected test failure under the @chaos suite.
   */
  private extractViolations(
    rawOutput: string,
    exitCode: number
  ): ChaosViolation[] {
    const violations: ChaosViolation[] = [];

    // Try to parse JSON reporter output
    const jsonMatch = rawOutput.match(/(\{[\s\S]*"suites"[\s\S]*\})\s*$/);
    if (jsonMatch) {
      try {
        const report = JSON.parse(jsonMatch[1]);
        this.processSuiteForViolations(report.suites ?? [], violations);
        return violations;
      } catch {
        // Fall through to exit-code based detection
      }
    }

    // Fallback: if exit code is non-zero and we have no parsed data,
    // create a generic violation
    if (exitCode !== 0) {
      violations.push({
        test: "Playwright chaos suite exited with non-zero code",
        kind: "unexpected-failure",
        detail: `Exit code: ${exitCode}. Raw output (first 200 chars): ${rawOutput.slice(0, 200)}`,
      });
    }

    return violations;
  }

  private processSuiteForViolations(
    suites: any[],
    violations: ChaosViolation[]
  ): void {
    for (const suite of suites) {
      for (const spec of suite.specs ?? []) {
        if (!spec.ok) {
          const title: string = spec.title ?? "";
          const errorMsg: string =
            spec.tests?.[0]?.results?.[0]?.error?.message ?? "";

          violations.push({
            test: title,
            kind: this.classifyViolation(title, errorMsg),
            detail: errorMsg.slice(0, 200),
          });
        }
      }
      // Recurse
      this.processSuiteForViolations(suite.suites ?? [], violations);
    }
  }

  private classifyViolation(
    title: string,
    errorMsg: string
  ): ChaosViolation["kind"] {
    const combined = (title + " " + errorMsg).toLowerCase();
    if (combined.includes("blank") || combined.includes("empty")) {
      return "blank-screen";
    }
    if (combined.includes("crash") || combined.includes("uncaught")) {
      return "unhandled-crash";
    }
    if (combined.includes("recovery") || combined.includes("retry")) {
      return "missing-recovery-path";
    }
    if (combined.includes("timeout") || combined.includes("exceeded")) {
      return "timeout";
    }
    return "unexpected-failure";
  }
}
