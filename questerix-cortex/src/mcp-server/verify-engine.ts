import Database from "better-sqlite3";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { normalizePath } from "../utils/normalize-path";

const VERIFICATION_TIMEOUT_MS = 120000; // 120 seconds

interface TscBaseline {
  errorCount: number;
  timestamp: string;
}

function getTscBaselinePath(adminPath: string): string {
  return path.join(adminPath, ".cortex", "tsc-baseline.json");
}

function loadTscBaseline(adminPath: string): TscBaseline | null {
  const baselinePath = getTscBaselinePath(adminPath);
  if (!fs.existsSync(baselinePath)) return null;
  try {
    const content = fs.readFileSync(baselinePath, "utf-8");
    return JSON.parse(content) as TscBaseline;
  } catch {
    return null;
  }
}

function saveTscBaseline(adminPath: string, errorCount: number): void {
  const baselinePath = getTscBaselinePath(adminPath);
  const baselineDir = path.dirname(baselinePath);
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }
  const baseline: TscBaseline = {
    errorCount,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), "utf-8");
}

export interface TestFailureDetail {
  file: string;
  message?: string;
}

export interface VerificationResult {
  tsc: {
    passed: boolean;
    output: string;
    errorCount: number;
    baselineErrorCount?: number;
    unavailable?: boolean;
  };
  unitTests: { passed: number; failed: number; details: TestFailureDetail[] };
  e2eTests: { passed: number; failed: number; details: TestFailureDetail[] };
  changedFiles: string[];
  targetedTests: number;
}

function parseJsonOutput(output: string): unknown | null {
  const trimmed = output.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
  return null;
}

function runCommand(
  command: string,
  cwd: string,
  timeoutMs?: number,
): { passed: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd,
      encoding: "utf-8",
      stdio: "pipe",
      timeout: timeoutMs,
    });
    return { passed: true, output };
  } catch (err: any) {
    const stdout = err?.stdout ?? "";
    const stderr = err?.stderr ?? "";
    return { passed: false, output: `${stdout}${stderr}` };
  }
}

function isCommandMissing(error: unknown): boolean {
  const err = error as { message?: string; stdout?: string; stderr?: string };
  const combined = `${err?.message ?? ""}\n${err?.stdout ?? ""}\n${err?.stderr ?? ""}`;
  return /ENOENT|not recognized|command not found/i.test(combined);
}

function countTscErrors(output: string): number {
  const matches = output.match(/\berror TS\d+:/g);
  return matches ? matches.length : 0;
}

function summarizeVitest(output: string): {
  passed: number;
  failed: number;
  details: TestFailureDetail[];
} {
  const parsed = parseJsonOutput(output);
  const details: TestFailureDetail[] = [];
  let passed = 0;
  let failed = 0;

  if (parsed && typeof parsed === "object") {
    const data = parsed as any;
    if (Array.isArray(data.testResults)) {
      let counted = false;
      for (const suite of data.testResults) {
        const file = suite.name || suite.file || suite.filePath;
        if (!Array.isArray(suite.assertionResults)) continue;
        for (const assertion of suite.assertionResults) {
          if (assertion.status === "failed") {
            failed += 1;
            const message = Array.isArray(assertion.failureMessages)
              ? assertion.failureMessages.join("\n")
              : assertion.failureMessage;
            details.push({ file: file ?? "unknown", message });
            counted = true;
          } else if (assertion.status === "passed") {
            passed += 1;
            counted = true;
          }
        }
      }
      if (counted) return { passed, failed, details };
    }
    if (typeof data.numPassedTests === "number") passed = data.numPassedTests;
    if (typeof data.numFailedTests === "number") failed = data.numFailedTests;
  }

  return { passed, failed, details };
}

function walkPlaywrightSuites(
  suites: any[],
  details: TestFailureDetail[],
  counts: { passed: number; failed: number },
): void {
  for (const suite of suites) {
    if (Array.isArray(suite.tests)) {
      for (const test of suite.tests) {
        const results = Array.isArray(test.results) ? test.results : [];
        const hasFailure = results.some((r: any) => r.status === "failed");
        const file = test.location?.file || suite.file || "unknown";
        if (hasFailure) {
          counts.failed += 1;
          const message = results
            .map((r: any) => r.error?.message || r.error?.stack)
            .filter(Boolean)
            .join("\n");
          details.push({ file, message });
        } else {
          counts.passed += 1;
        }
      }
    }
    if (Array.isArray(suite.suites)) {
      walkPlaywrightSuites(suite.suites, details, counts);
    }
  }
}

function summarizePlaywright(output: string): {
  passed: number;
  failed: number;
  details: TestFailureDetail[];
} {
  const parsed = parseJsonOutput(output);
  const details: TestFailureDetail[] = [];
  let passed = 0;
  let failed = 0;

  if (parsed && typeof parsed === "object") {
    const data = parsed as any;
    if (Array.isArray(data.suites)) {
      const counts = { passed: 0, failed: 0 };
      walkPlaywrightSuites(data.suites, details, counts);
      passed = counts.passed;
      failed = counts.failed;
    } else if (data.stats) {
      if (typeof data.stats.expected === "number") passed = data.stats.expected;
      if (typeof data.stats.unexpected === "number")
        failed = data.stats.unexpected;
    }
  }

  return { passed, failed, details };
}

function resolveTestFiles(db: Database.Database, filePath: string): string[] {
  const query = db.prepare(
    `
      SELECT source_id FROM edges WHERE target_id = ? AND relationship = 'tests'
      UNION
      SELECT e2.source_id
      FROM edges e1
      JOIN edges e2 ON e1.source_id = e2.target_id
      WHERE e1.target_id = ? AND e1.relationship = 'imports' AND e2.relationship = 'tests'
    `,
  );
  const rows = query.all(filePath) as Array<{ source_id: string }>;
  return rows.map((row) => row.source_id);
}

function isE2ETest(testPath: string): boolean {
  return testPath.includes("tests/") && testPath.endsWith(".spec.ts");
}

function resolveAbsoluteTestPath(adminPath: string, testPath: string): string {
  return path.isAbsolute(testPath) ? testPath : path.join(adminPath, testPath);
}

export function runVerification(
  db: Database.Database,
  changedFiles: string[],
  adminPath: string,
  _sessionId: string,
): VerificationResult {
  const normalizedFiles = changedFiles.map((file) => normalizePath(file));

  let tscPassed = true;
  let tscOutput = "";
  let tscUnavailable = false;
  try {
    tscOutput = execSync("npx tsc --noEmit --incremental", {
      cwd: adminPath,
      encoding: "utf-8",
      stdio: "pipe",
      timeout: VERIFICATION_TIMEOUT_MS,
    });
  } catch (err: any) {
    tscPassed = false;
    tscUnavailable = isCommandMissing(err);
    tscOutput = `${err?.stdout ?? ""}${err?.stderr ?? ""}`;
  }

  const tscErrorCount = tscPassed ? 0 : countTscErrors(tscOutput);

  // TSC Baseline comparison: only fail if errors increased
  const baseline = loadTscBaseline(adminPath);
  const baselineErrorCount = baseline?.errorCount ?? 0;
  const tscRegressed = tscErrorCount > baselineErrorCount;

  // Save new baseline if this run had fewer errors
  if (tscErrorCount <= baselineErrorCount) {
    saveTscBaseline(adminPath, tscErrorCount);
  }

  // Use baseline-aware pass status: pass if no regression
  const tscPassedBaseline = !tscRegressed;

  const testFiles = new Set<string>();
  for (const file of normalizedFiles) {
    for (const testFile of resolveTestFiles(db, file)) {
      testFiles.add(testFile);
    }
  }

  const unitTests = Array.from(testFiles).filter((file) => !isE2ETest(file));
  const e2eTests = Array.from(testFiles).filter(isE2ETest);

  const unitSummary =
    unitTests.length === 0
      ? { passed: 0, failed: 0, details: [] as TestFailureDetail[] }
      : summarizeVitest(
          runCommand(
            `npx vitest run --reporter=json ${unitTests.map((t) => `"${resolveAbsoluteTestPath(adminPath, t)}"`).join(" ")}`,
            adminPath,
            VERIFICATION_TIMEOUT_MS,
          ).output,
        );

  const e2eSummary =
    e2eTests.length === 0
      ? { passed: 0, failed: 0, details: [] as TestFailureDetail[] }
      : summarizePlaywright(
          runCommand(
            `npx playwright test ${e2eTests.map((t) => `"${resolveAbsoluteTestPath(adminPath, t)}"`).join(" ")} --reporter=json`,
            adminPath,
            VERIFICATION_TIMEOUT_MS,
          ).output,
        );

  return {
    tsc: {
      passed: tscPassedBaseline,
      output: tscOutput,
      errorCount: tscErrorCount,
      baselineErrorCount,
      unavailable: tscUnavailable ? true : undefined,
    },
    unitTests: unitSummary,
    e2eTests: e2eSummary,
    changedFiles: normalizedFiles,
    targetedTests: testFiles.size,
  };
}
