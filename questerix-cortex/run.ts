import { agentops } from "agentops";
import chalk from "chalk";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { Project } from "ts-morph";
import { Analyst } from "./src/analyst";
import { CortexDB } from "./src/cortex-db";

import { DashboardServer } from "./src/dashboard-server";
import { DeltaEngine } from "./src/delta";
import { DriftDetector, DriftResult } from "./src/drift";
import { FragilityMetrics, FragilityScorer } from "./src/fragility";
import { GitOracle } from "./src/git-oracle";
import { auditGovernance } from "./src/governance";
import { Guard } from "./src/guard";
import { OptimizeAuditor, OptimizeReport } from "./src/optimizer";
import { Orchestrator } from "./src/orchestrator";
import { Reporter } from "./src/reporter";
import { RiskScorer } from "./src/risk-scorer";
import { RlsAuditor, RlsAuditResult } from "./src/rls";
import { Scanner } from "./src/scanner";
import { SkeletonGenerator } from "./src/skeleton";
import { SkeletonSearch } from "./src/skeleton/search";
import { CortexConfig } from "./src/types";
import { normalizePath } from "./src/utils/normalize-path";
import { FeatureVisualizer } from "./src/visualizer";
import { ZombieHunter } from "./src/zombie-hunter";

const configPath = path.join(__dirname, "cortex.config.json");
const config: CortexConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// ── Suite registry ────────────────────────────────────────────────────────────
// `parallel: true` means suites in the same tier run concurrently.
// Leave it false for suites that can't share the same cwd safely (e.g. builds).
const allSuites: Array<{
  id: string;
  name: string;
  command: string;
  tier: "smoke" | "deep" | "release" | "deploy";
  parallel: boolean;
}> = [
  // Smoke — fast sanity, safe to parallelise
  // Phase 11: Selftest as first suite to verify MCP server health
  {
    id: "selftest",
    name: "MCP Server Selftest",
    command: "npx tsc --noEmit && cd ../questerix-cortex && npm run build && npm run cortex:selftest",
    tier: "smoke",
    parallel: false,
  },
  {
    id: "unit",
    name: "Unit Tests (Lib)",
    command: "npx vitest run src/__tests__/lib/utils.test.ts",
    tier: "smoke",
    parallel: true,
  },
  {
    id: "lint",
    name: "Lint Check",
    command: "npx eslint src/lib/utils.ts",
    tier: "smoke",
    parallel: true,
  },
  {
    id: "e2e",
    name: "E2E Smoke (Desktop)",
    command:
      "npx playwright test tests/auth-flow.e2e.spec.ts --project=desktop",
    tier: "smoke",
    parallel: false,
  },

  // Deep — heavier, but tsc + audit are independent
  {
    id: "tsc",
    name: "TypeScript Strict",
    command: "npx tsc --noEmit",
    tier: "deep",
    parallel: true,
  },
  {
    id: "audit",
    name: "Security Audit",
    command: "npm audit --audit-level=high",
    tier: "deep",
    parallel: true,
  },

  {
    id: "full-vitest",
    name: "Full Vitest + Coverage",
    command: "npm run test -- --run --coverage",
    tier: "deep",
    parallel: false,
  },
  {
    id: "full-playwright",
    name: "Full Playwright Suite",
    command: "npx playwright test",
    tier: "deep",
    parallel: false,
  },
  {
    id: "latency",
    name: "Latency Benchmark",
    command: "npm run test:benchmark",
    tier: "deep",
    parallel: false,
  },

  // Release — sequential only (write to dist/, share port)
  {
    id: "build",
    name: "Production Build",
    command: "npm run build",
    tier: "release",
    parallel: false,
  },
  {
    id: "certify",
    name: "Certify Phase 0",
    command: "powershell ..\\scripts\\certify-evidence.ps1",
    tier: "release",
    parallel: false,
  },
  {
    id: "hygiene",
    name: "Code Hygiene Scan",
    command: "powershell ..\\scripts\\code-hygiene-scan.ps1",
    tier: "release",
    parallel: false,
  },
  {
    id: "forensic",
    name: "Forensic Audit",
    command: "powershell ..\\scripts\\maintenance\\forensic_audit.ps1",
    tier: "release",
    parallel: false,
  },

  // Deploy — sequential only, runs after release certification
  {
    id: "deploy-admin",
    name: "Deploy Admin Panel",
    command:
      "powershell ..\\scripts\\deploy\\deploy-all.ps1 -ConfigFile ..\\master-config.json -Target admin-panel",
    tier: "deploy",
    parallel: false,
  },
  {
    id: "deploy-fns",
    name: "Deploy Edge Functions",
    command:
      "cd .. && npx supabase functions deploy --project-ref bkfhorslctqieetzqdtd",
    tier: "deploy",
    parallel: false,
  },
];

// Ship tier removed - git operations should be manual per AGENTS.md rules

function listFilesRecursively(
  dir: string,
  predicate: (filePath: string) => boolean,
): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursively(fullPath, predicate));
      continue;
    }
    if (entry.isFile() && predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function toComparableName(name: string): string {
  const cleaned = name.replace(/\.spec\.ts$/i, "");
  const parts = cleaned.split(/[-_ ]+/).filter(Boolean);
  const pascal = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return pascal.toLowerCase();
}

function mapE2ETestsToPages(cortexDbPath: string, adminPath: string): void {
  const testDir = path.join(adminPath, "tests");
  const pageDir = path.join(adminPath, "src", "features");
  const testFiles = listFilesRecursively(testDir, (filePath) =>
    filePath.endsWith(".spec.ts"),
  );
  const pageFiles = listFilesRecursively(
    pageDir,
    (filePath) =>
      filePath.replace(/\\/g, "/").includes("/pages/") &&
      filePath.endsWith(".tsx"),
  );

  const pageMap = new Map<string, string>();
  for (const pageFile of pageFiles) {
    const baseName = path.basename(pageFile, ".tsx");
    pageMap.set(baseName.toLowerCase(), pageFile);
  }

  const Database = require("better-sqlite3");
  const db = new Database(cortexDbPath);
  const timestamp = new Date().toISOString();
  const insertNode = db.prepare(`
    INSERT OR REPLACE INTO nodes (id, type, file_path, metadata, updated_at)
    VALUES (@id, @type, @filePath, @metadata, @updatedAt)
  `);
  const insertEdge = db.prepare(`
    INSERT OR REPLACE INTO edges (source_id, target_id, relationship, metadata)
    VALUES (@sourceId, @targetId, @relationship, @metadata)
  `);
  const deleteEdgesForSource = db.prepare(
    "DELETE FROM edges WHERE source_id = ?",
  );

  for (const testFile of testFiles) {
    const testBase = path.basename(testFile, ".spec.ts");
    const testKey = toComparableName(testBase);
    const pageFile = pageMap.get(testKey);
    const testId = normalizePath(testFile);

    deleteEdgesForSource.run(testId);

    if (!pageFile) continue;

    const pageId = normalizePath(pageFile);

    insertNode.run({
      id: testId,
      type: "file",
      filePath: testId,
      metadata: null,
      updatedAt: timestamp,
    });
    insertNode.run({
      id: pageId,
      type: "file",
      filePath: pageId,
      metadata: null,
      updatedAt: timestamp,
    });
    insertEdge.run({
      sourceId: testId,
      targetId: pageId,
      relationship: "tests",
      metadata: null,
    });
  }

  db.close();
}

async function main() {
  // Check for CI mode
  const args = process.argv.slice(2);
  const isCI = args.includes("--ci");
  const targetArg = args.find((a) => !a.startsWith("--"));
  const flags = args.filter((a) => a.startsWith("--"));

  // ── Early-exit targets (no scanner needed) ────────────────────
  const earlyTarget = targetArg;

  if (earlyTarget === "optimize") {
    console.log(
      chalk.cyan.bold("\n🚀 Questerix Cortex — Performance Optimization Audit"),
    );
    const optimizer = new OptimizeAuditor(path.resolve(__dirname, ".."));
    const report = optimizer.audit();
    const md = optimizer.generateMarkdownReport(report);

    const outputsPath = path.join(__dirname, "outputs");
    if (!fs.existsSync(outputsPath))
      fs.mkdirSync(outputsPath, { recursive: true });
    const reportPath = path.join(outputsPath, "OPTIMIZE_REPORT.md");
    fs.writeFileSync(reportPath, md, "utf-8");

    const color = report.verdict === "CLEAN" ? "green" : "red";
    console.log(chalk[color](`\n${report.summary}`));
    console.log(chalk.gray(`\n   Report written → ${reportPath}\n`));
    console.log(md);
    process.exit(0);
  }

  console.log(chalk.cyan.bold("\n🚀 Questerix Cortex — Initializing..."));

  // Initialize AgentOps session if API key is present
  if (process.env.AGENTOPS_API_KEY) {
    try {
      await agentops.init({
        apiKey: process.env.AGENTOPS_API_KEY,
      });
    } catch (err) {
      console.warn(chalk.yellow("⚠️  Failed to initialize AgentOps:", err));
    }
  }

  const adminPath = path.resolve(__dirname, config.adminPanelPath);
  const supabasePath = path.resolve(__dirname, config.supabasePath);
  const srcPath = path.join(adminPath, "src");

  const project = new Project({
    tsConfigFilePath: path.resolve(
      __dirname,
      "..",
      "admin-panel",
      "tsconfig.json",
    ),
    skipAddingFilesFromTsConfig: true, // Lazy loading: only add what we need
  });

  // Explicitly add core source files to reduce memory footprint
  project.addSourceFilesAtPaths([
    path.join(srcPath, "features/**/*.{ts,tsx}"),
    path.join(srcPath, "lib/**/*.{ts,tsx}"),
    path.join(srcPath, "hooks/**/*.{ts,tsx}"),
    path.join(srcPath, "services/**/*.{ts,tsx}"),
  ]);

  // Handle graceful exits to release resources
  const cleanup = () => {
    console.log(chalk.gray("\n  👋 Shutting down Cortex..."));
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  const scanner = new Scanner(project, srcPath);
  const reporter = new Reporter(
    __dirname,
    config.outputs,
    path.resolve(__dirname, ".."),
  );
  const analyst = new Analyst(project);

  const driftDetector = new DriftDetector(adminPath, supabasePath);
  const rlsAuditor = new RlsAuditor(config.supabaseProjectRef);

  let currentDashboard: DashboardServer | undefined;

  // Initialize orchestrator
  const orchestrator = new Orchestrator(adminPath, (text, color, bold) => {
    const colorFn = color ? (chalk as any)[color] || chalk.gray : chalk.gray;
    console.log(bold ? colorFn.bold(text) : colorFn(text));
    if (currentDashboard?.getIsRunning()) {
      currentDashboard.emitLog({ text, color, bold });
    }
  });

  // ── Core run function ─────────────────────────────────────────────────────
  const executeRun = async (target: string = "all", flags: string[] = []) => {
    const outputsPath = path.resolve(__dirname, "outputs");
    if (!fs.existsSync(outputsPath))
      fs.mkdirSync(outputsPath, { recursive: true });
    const cortexDb = new CortexDB(path.join(outputsPath, "cortex.db"));

    // Clean up any zombie processes on the dashboard port first
    ZombieHunter.clean(config.dashboardPort);

    // Start dashboard server
    const dashboardServer = new DashboardServer({
      port: config.dashboardPort,
      staticPath: path.join(__dirname, "dashboard", "dist"),
      onTriggerRun: (triggerTarget) => {
        console.log(
          chalk.cyan(`\n🎯 Dashboard triggered run: ${triggerTarget}`),
        );
        // Note: In a full implementation, this would trigger a new run
        // For now, we just log it as the current run is already in progress
      },
    });

    try {
      await dashboardServer.start();
      currentDashboard = dashboardServer;
    } catch (err: any) {
      console.warn(chalk.yellow(`   ⚠️  Dashboard server failed to start: ${err.message}`));
    }

    const broadcastUpdate = () => {
      if (dashboardServer.getIsRunning()) {
        const results = orchestrator.getResults();
        const allResults = Object.values(results);
        const completed = allResults.filter(
          (r) => r.status !== "running" && r.status !== "pending",
        ).length;
        const total = allResults.length;

        dashboardServer.emitUpdate({
          results: results as any,
          progress: {
            completed,
            total: total || 1,
            percentage: total ? Math.round((completed / total) * 100) : 0,
          },
          timestamp: new Date().toISOString(),
        });
      }
    };

    const targets = target.split(",").map((t) => t.trim());
    const generateSkeletons = flags.includes("--generate-skeletons");
    const healDrift = flags.includes("--heal-drift");
    const syncKb = flags.includes("--sync-kb");
    const pruneBrain = flags.includes("--prune-brain");

    // ── Optimize target (standalone — exits early) ────────────────────────────
    if (targets.includes("optimize")) {
      console.log(
        chalk.cyan.bold("\n🚀 Running Performance Optimization Audit…"),
      );
      const optimizer = new OptimizeAuditor(path.resolve(__dirname, ".."));
      const report = optimizer.audit();
      const md = optimizer.generateMarkdownReport(report);

      const reportPath = path.join(outputsPath, "OPTIMIZE_REPORT.md");
      fs.writeFileSync(reportPath, md, "utf-8");

      const color = report.verdict === "CLEAN" ? "green" : "red";
      console.log(chalk[color](`\n${report.summary}`));
      console.log(chalk.gray(`   Report saved → ${reportPath}`));

      return;
    }

    const runDrift =
      targets.includes("drift") ||
      targets.includes("all") ||
      targets.includes("full") ||
      targets.includes("intel");
    const runRls =
      targets.includes("rls") ||
      targets.includes("full") ||
      targets.includes("intel");
    const runSkeleton =
      targets.includes("skeleton") ||
      targets.includes("all") ||
      targets.includes("full") ||
      targets.includes("intel");
    const runGovernance =
      targets.includes("governance") || targets.includes("intel");
    const runOptimize =
      targets.includes("optimize") ||
      targets.includes("all") ||
      targets.includes("full") ||
      targets.includes("intel");

    console.log(chalk.cyan.bold(`\n🔄 Run (${target}) started…`));

    // Clear previous results to prevent stale data
    orchestrator.clearResults();
    broadcastUpdate();

    // Semantic scan
    const surfaceMap = scanner.scan();
    fs.writeFileSync(
      path.join(outputsPath, path.basename(config.outputs.surfaceMap)),
      JSON.stringify(surfaceMap, null, 2),
    );

    // ── Delta Engine: Compute delta between runs ────────────────────────────
    const deltaEngine = new DeltaEngine(path.resolve(__dirname, ".."));
    const deltaResult = deltaEngine.computeDelta(surfaceMap);
    console.log(
      chalk.cyan(
        `   📊 Delta: ${deltaResult.newGaps.length} new gaps, ${deltaResult.resolvedGaps.length} resolved`,
      ),
    );
    if (deltaResult.hotFiles.length > 0) {
      console.log(
        chalk.yellow(`   🔥 Hot files: ${deltaResult.hotFiles.slice(0, 5).join(", ")}`),
      );
    }

    // ── Git Oracle: Analyze git state for untested changes ──────────────────
    const gitOracle = new GitOracle(path.resolve(__dirname, ".."));
    const gitOracleResult = gitOracle.analyze(surfaceMap.gaps);
    if (gitOracleResult.untestedModifiedFiles.length > 0) {
      console.log(
        chalk.yellow(
          `   ⚠️  ${gitOracleResult.untestedModifiedFiles.length} recently modified files lack test coverage`,
        ),
      );
    }

    // ── Skeleton generation ──────────────────────────────────────────────────
    if (runSkeleton) {
      try {
        console.log(chalk.cyan("\n🦴 Generating codebase skeleton…"));
        const skeletonGen = new SkeletonGenerator(project, srcPath);
        const skeletonReport = skeletonGen.generate();
        skeletonGen.writeJson(
          skeletonReport,
          path.join(outputsPath, "SKELETON.json"),
        );
        skeletonGen.writeMarkdownFull(
          skeletonReport,
          path.join(outputsPath, "SKELETON.md"),
        );
        skeletonGen.writeMarkdownSummary(
          skeletonReport,
          path.join(outputsPath, "SKELETON_SUMMARY.md"),
        );
        skeletonGen.writeUtilityRegistry(
          skeletonReport,
          path.join(outputsPath, "UTILITY_REGISTRY.md"),
        );
        console.log(
          chalk.green(
            `   ✅ Skeleton: ${skeletonReport.totalFiles} files, ${skeletonReport.totalExports} exports`,
          ),
        );

        // ── Index for search ──────────────────────────────────────────────────
        const searchDbPath = path.join(outputsPath, "search.db");
        const searcher = new SkeletonSearch(searchDbPath);
        searcher.index(skeletonReport);
        searcher.close();
        console.log(chalk.green("   ✅ Search index updated."));

        // Phase 11: Call writeGraph to persist the codebase graph for Analyst/Fragility tools
        console.log(chalk.cyan("🦴 Persisting codebase graph…"));
        await scanner.writeGraph(cortexDb);
      } catch (skeletonErr: any) {
        console.warn(
          chalk.yellow(
            "   ⚠️  Skeleton generation failed:",
            skeletonErr.message,
          ),
        );
      }
    }

    if (generateSkeletons) {
      console.log(chalk.yellow("\n🧪 Generating test skeletons for gaps…"));
      const skels = scanner.generateSkeletons(surfaceMap);
      if (skels.length > 0) {
        console.log(chalk.green(`   ✅ Generated ${skels.length} skeletons.`));
      } else {
        console.log(chalk.gray("   ⏭️ No new gaps requiring skeletons."));
      }
    }

    // Refresh source files to ensure analyst sees filesystem changes
    for (const sf of project.getSourceFiles()) {
      sf.refreshFromFileSystemSync();
    }

    let analystResults: {
      deadCode: string[];
      bundleSize: number | null;
      perfGaps: string[];
      migrationGaps: string[];
      typeSafetyGaps: string[];
    } = {
      deadCode: [],
      bundleSize: analyst.getBundleSize(adminPath),
      perfGaps: analyst.checkPerformanceInstrumentation(),
      migrationGaps: analyst.lintMigrations(
        path.join(supabasePath, "migrations"),
      ),
      typeSafetyGaps: analyst.lintTypeSafety(),
    };

    // ── Intelligence checks (fast, no test runner) ──────────────────────────
    let driftResult: DriftResult | undefined;
    let rlsResult: RlsAuditResult | undefined;
    let optimizeResult: OptimizeReport | undefined;

    if (runDrift) {
      console.log(chalk.cyan("\n🔍 Schema Drift Detection…"));
      driftResult = driftDetector.detect();

      if (healDrift && driftResult.verdict === "DRIFT DETECTED") {
        console.log(chalk.yellow("🩹 Healing schema drift…"));
        const healed = driftDetector.heal();
        if (healed) {
          console.log(chalk.green("   ✅ Drift healed. Re-scanning…"));
          driftResult = driftDetector.detect();
        }
      }

      const driftSummary =
        `   ${driftResult.verdict} — types: ${driftResult.typesTableCount} | ` +
        `missing: ${driftResult.missingFromTypes.length} | extra: ${driftResult.extraInTypes.length}`;
      console.log(chalk.cyan(driftSummary));
      broadcastUpdate();
    }

    if (syncKb) {
      console.log(
        chalk.yellow("\n🧠 Syncing Knowledge Base (Project Oracle)…"),
      );
      try {
        const scriptPath = path.join(
          supabasePath,
          "..",
          "scripts",
          "maintenance",
          "automate_knowledge.ps1",
        );
        execSync(`powershell -NoProfile -File "${scriptPath}"`, {
          stdio: "inherit",
        });
        console.log(chalk.green("   ✅ Knowledge sync complete."));
      } catch (err) {
        console.error("   ❌ Knowledge sync failed:", err);
      }
    }

    if (pruneBrain) {
      console.log(chalk.yellow("\n🧹 Pruning Agent Memory (Hygiene)…"));
      try {
        const scriptPath = path.join(
          supabasePath,
          "..",
          "scripts",
          "maintenance",
          "agent-memory-cleanup.ps1",
        );
        execSync(`powershell -NoProfile -File "${scriptPath}"`, {
          stdio: "inherit",
        });
        console.log(chalk.green("   ✅ Memory pruning complete."));
      } catch (err) {
        console.error("   ❌ Memory pruning failed:", err);
      }
    }

    if (runRls) {
      console.log(chalk.cyan("\n🔒 RLS Audit…"));
      rlsResult = await rlsAuditor.audit();
      const rlsSummary = `   ${rlsResult.verdict} — critical: ${rlsResult.criticalCount}`;
      console.log(chalk.cyan(rlsSummary));
      broadcastUpdate();
    }

    let governanceResult:
      | { deadRefs: Array<{ file: string; ref: string }>; scannedFiles: number }
      | undefined;
    if (runGovernance) {
      console.log(chalk.cyan("\n📜 Governance (dead refs)…"));
      governanceResult = auditGovernance(path.resolve(__dirname, ".."));
      const govSummary = `   Scanned ${governanceResult.scannedFiles} files, ${governanceResult.deadRefs.length} dead reference(s)`;
      console.log(chalk.cyan(govSummary));

      // Run FeatureVisualizer once and reuse result
      let deps: any[] | undefined;
      let visualizer: FeatureVisualizer | undefined;
      try {
        visualizer = new FeatureVisualizer(srcPath);
        deps = visualizer.analyze();
      } catch (err: any) {
        console.warn(
          chalk.yellow("   ⚠️  Feature analysis failed:", err.message),
        );
      }

      if (deps && visualizer) {
        // ── Feature Mapping ──
        console.log(chalk.cyan("\n🗺️  Mapping feature isolation…"));
        try {
          const featureMd = visualizer.generateMarkdownReport(deps);
          const fMapPath = path.join(__dirname, config.outputs.featureMap);
          fs.writeFileSync(fMapPath, featureMd, "utf-8");
          console.log(
            chalk.green(
              `   ✅ Feature map: ${deps.length} cross-dependencies found → ${fMapPath}`,
            ),
          );
        } catch (err: any) {
          console.warn(
            chalk.yellow("   ⚠️  Feature mapping failed:", err.message),
          );
        }

        // ── Fragility Analysis ──
        console.log(chalk.cyan("\n🏗️  Analyzing feature fragility…"));
        try {
          const scorer = new FragilityScorer(srcPath);
          const metrics: FragilityMetrics[] = scorer.analyze(deps);
          const fragilityMd = scorer.generateMarkdownReport(metrics);
          const fMatrixPath = path.join(
            __dirname,
            config.outputs.fragilityMatrix,
          );
          fs.writeFileSync(fMatrixPath, fragilityMd, "utf-8");

          const fragileCount = metrics.filter(
            (m: FragilityMetrics) =>
              m.verdict === "FRAGILE" || m.verdict === "STIFF",
          ).length;
          console.log(
            chalk.green(
              `   ✅ Fragility matrix: ${fragileCount} high-risk features found → ${fMatrixPath}`,
            ),
          );
        } catch (err: any) {
          console.warn(
            chalk.yellow("   ⚠️  Fragility analysis failed:", err.message),
          );
        }

        // ── Architecture Guard ──
        console.log(chalk.cyan("\n🛡️  Enforcing architecture guard…"));
        try {
          const guard = new Guard(config.guard.rules);
          const violations = guard.check(deps);
          const guardMd = guard.generateReport(violations);
          const gPath = path.join(__dirname, config.outputs.guardReport);
          fs.writeFileSync(gPath, guardMd, "utf-8");

          if (violations.length > 0) {
            console.log(
              chalk.red(
                `   ❌ Guard breach: ${violations.length} violations detected → ${gPath}`,
              ),
            );
          } else {
            console.log(chalk.green(`   ✅ Guard: PASS → ${gPath}`));
          }
        } catch (err: any) {
          console.warn(chalk.yellow("   ⚠️  Guard check failed:", err.message));
        }
      }
    } // Added missing closing brace here

    // ── Performance Optimization Audit ──────────────────────────────────────
    if (runOptimize && !targets.includes("optimize")) {
      console.log(chalk.cyan("\n🚀 Performance Optimization Audit…"));
      try {
        const optimizer = new OptimizeAuditor(path.resolve(__dirname, ".."));
        const optReport = optimizer.audit();
        const md = optimizer.generateMarkdownReport(optReport);
        optimizeResult = { ...optReport, markdown: md };
        const optColor = optReport.verdict === "CLEAN" ? "green" : "red";
        console.log(chalk[optColor](`   ${optReport.summary}`));
      } catch (err) {
        console.warn(chalk.yellow("⚠️  Optimizer failed:", err));
      }
    }

    // ── Suite execution ───────────────────────────────────────────────────────
    if (targets.some((t) => !["drift", "rls", "intel"].includes(t))) {
      const suitesToRun = targets.includes("all")
        ? allSuites.filter((s) => s.tier === "smoke")
        : targets.includes("full")
          ? allSuites
          : allSuites.filter(
              (s) => targets.includes(s.id) || targets.includes(s.tier),
            );

      // ── Pre-flight: skip suites whose target file doesn't exist ────────────
      const validatedSuites = suitesToRun.filter((suite) => {
        // Extract the first argument that looks like a file path (contains '/')
        const fileArg = suite.command
          .split(" ")
          .find(
            (tok) =>
              (tok.includes("/") || tok.includes("\\")) && !tok.startsWith("-"),
          );
        if (!fileArg) return true; // No file arg — command is self-contained (e.g. eslint, tsc)
        const absPath = path.isAbsolute(fileArg)
          ? fileArg
          : path.join(adminPath, fileArg);
        if (!fs.existsSync(absPath)) {
          const msg = `⚠️  Skipping "${suite.name}" — target not found: ${fileArg}`;
          console.log(chalk.yellow(msg));
          return false;
        }
        return true;
      });

      // Group by tier to run parallel-eligible suites together
      type Tier = "smoke" | "deep" | "release" | "deploy";
      const tierOrder: Tier[] = ["smoke", "deep", "release", "deploy"];

      // Phase 8: Tier-gating + Circuit breaker
      let gateFailedAt: string | undefined;
      const defaultTimeouts = { smoke: 300, deep: 300, release: 600, deploy: 900 };
      const tierTimeouts = { ...defaultTimeouts, ...config.tierTimeouts };

      for (const tier of tierOrder) {
        // Skip if a previous tier failed (tier-gating)
        if (gateFailedAt) {
          console.log(
            chalk.yellow(
              `🔴 Tier gate: ${gateFailedAt} failed — skipping ${tier} tier`,
            ),
          );
          continue;
        }

        const tierSuites = validatedSuites.filter((s) => s.tier === tier);
        if (tierSuites.length === 0) continue;

        console.log(chalk.cyan(`\n📦 Running ${tier} tier (${tierSuites.length} suite(s))...`));

        const parallelGroup = tierSuites.filter((s) => s.parallel);
        const sequentialGroup = tierSuites.filter((s) => !s.parallel);

        // Phase 8: Use tier-specific timeout (convert seconds to ms)
        const tierTimeoutMs = tierTimeouts[tier] * 1000;

        // Run parallel-safe suites concurrently, then sequential ones in order
        if (parallelGroup.length > 0) {
          await orchestrator.runSuitesConcurrent(parallelGroup, broadcastUpdate);
          analystResults.bundleSize = analyst.getBundleSize(adminPath);
        }

        for (const suite of sequentialGroup) {
          await orchestrator.runSuite(
            suite.name,
            suite.command,
            tierTimeoutMs,
            broadcastUpdate,
          );
          analystResults.bundleSize = analyst.getBundleSize(adminPath);
        }

        // Phase 8: Check if any suite in this tier failed
        const tierResults = Object.values(orchestrator.getResults()).filter((r) =>
          tierSuites.some((s) => s.name === r.name),
        );
        const tierFailed = tierResults.some((r) => r.status === "failed");
        if (tierFailed) {
          gateFailedAt = tier;
          console.log(
            chalk.red(`🔴 Tier gate: ${tier} failed — subsequent tiers will be skipped`),
          );
        }
      }

      // Phase 8: Store gateFailedAt for reporting via orchestrator
      if (gateFailedAt) {
        orchestrator.setGateFailedAt(gateFailedAt);
      }
    }

    // ── Post-run analysis ─────────────────────────────────────────────────────
    // Use existing cortexDb for dead code detection
    let deadCodeResults: Array<{ symbol: string; file: string }> = [];
    try {
      deadCodeResults = analyst.findDeadCode(cortexDb.getDb(), 10);
    } catch {
      // Best effort - skip dead code detection if something fails
    }
    analystResults.deadCode = deadCodeResults.map((r) => `${r.file}#${r.symbol}`);
    analystResults.perfGaps = analyst.checkPerformanceInstrumentation();
    analystResults.migrationGaps = analyst.lintMigrations(
      path.join(supabasePath, "migrations"),
    );

    const results = orchestrator.getResults();
    const allResults = Object.values(results);

    // Phase 11: Check if selftest failed and emit P0 CRITICAL
    const selftestResult = results["MCP Server Selftest"];
    if (selftestResult && selftestResult.status === "failed") {
      const criticalMessage = "⛔ MCP Server is broken — all Cortex guidance is unreliable until fixed";
      console.log(chalk.red(`\n🔴 P0 CRITICAL: ${criticalMessage}`));
      
      // Emit to NEXT_TASK.md
      const nextTaskPath = path.join(__dirname, config.outputs.nextTask || "outputs/NEXT_TASK.md");
      const timestamp = new Date().toISOString();
      const p0Block = `\n---\n\n## 🚨 P0 CRITICAL — ${timestamp}\n\n${criticalMessage}\n\n**Selftest Status:** FAILED\n**Action Required:** Run \`npm run cortex:selftest\` manually to diagnose MCP server issues.\n\n---\n`;
      
      try {
        if (fs.existsSync(nextTaskPath)) {
          fs.appendFileSync(nextTaskPath, p0Block, "utf-8");
        } else {
          fs.writeFileSync(nextTaskPath, `# P0 Critical Issues\n${p0Block}`, "utf-8");
        }
        console.log(chalk.yellow(`   📝 P0 CRITICAL recorded in ${nextTaskPath}`));
      } catch (err) {
        console.warn(chalk.yellow(`   ⚠️  Could not write P0 CRITICAL to ${nextTaskPath}:`, err));
      }
    }

    // ── Risk Scorer: Calculate composite score ───────────────────────────────
    const riskScorer = new RiskScorer();
    const riskScore = riskScorer.calculateScore(
      results,
      driftResult,
      rlsResult,
      undefined, // forensicResult not yet implemented
      undefined, // previousGapCount - would need to load from history
      surfaceMap?.gaps?.length,
    );
    console.log(
      chalk.cyan(
        `   🎯 Risk Score: ${riskScore.composite}/100 (confidence: ${riskScore.confidence}%)`,
      ),
    );

    const passed = allResults.filter((r) => r.status === "passed").length;
    const total = allResults.length;

    // Smoke gate
    const smokeNames = [
      "unit tests (lib)",
      "e2e smoke (desktop)",
      "lint check",
    ];
    const smokePass = allResults
      .filter((r) => smokeNames.includes(r.name.toLowerCase()))
      .every((r) => r.status === "passed");

    // Reports
    reporter.generate(
      results,
      surfaceMap,
      analystResults,
      driftResult,
      rlsResult,
      [],
      governanceResult,
      optimizeResult,
      deltaResult,
      riskScore,
    );

    // Summary
    const driftLine = driftResult
      ? driftResult.verdict === "CLEAN"
        ? chalk.green("✅ Drift: CLEAN")
        : chalk.red(`🔴 Drift: ${driftResult.verdict}`)
      : "";
    const rlsLine = rlsResult
      ? rlsResult.verdict === "PASS"
        ? chalk.green("✅ RLS: PASS")
        : chalk.red(`🔴 RLS: ${rlsResult.verdict}`)
      : "";

    if (driftResult && driftLine) {
      console.log("\n" + driftLine);
    }
    if (rlsResult && rlsLine) {
      console.log(rlsLine);
    }
    console.log(chalk.green(`\n✅ Run complete. Reports in outputs/`));
    broadcastUpdate();
  };

  // Auto-run only if an explicit target was passed as a CLI arg.
  // CI mode: skip dashboard and auto-run if target provided

  if (targetArg && isCI) {
    await executeRun(targetArg, flags);
    process.exit(0);
  }

  if (targetArg === "skeleton:search") {
    const query =
      flags.find((f) => !f.startsWith("--")) ||
      args[args.indexOf("skeleton:search") + 1];
    if (!query) {
      console.error(
        chalk.red(
          '❌ Missing search query. Usage: npm run health -- skeleton:search "query"',
        ),
      );
      return;
    }
    const outputsPath = path.resolve(__dirname, "outputs");
    const searchDbPath = path.join(outputsPath, "search.db");
    if (!fs.existsSync(searchDbPath)) {
      console.error(
        chalk.red("❌ Search index not found. Run a health check first."),
      );
      return;
    }
    const searcher = new SkeletonSearch(searchDbPath);
    const results = searcher.search(query);
    console.log(chalk.cyan(`\n🔍 Search results for "${query}":`));
    results.forEach((r) => {
      console.log(
        chalk.white(`  • `) +
          chalk.bold(r.name) +
          chalk.gray(` (${r.kind}) in `) +
          chalk.blue(r.file),
      );
      if (r.signature) console.log(chalk.gray(`    ${r.signature}`));
      if (r.doc) console.log(chalk.italic.gray(`    ${r.doc}`));
    });
    searcher.close();
    return;
  }

  if (targetArg) {
    await executeRun(targetArg, flags);
  } else {
    console.log(
      chalk.yellow("  ⚙️  No target provided. Auto-running `intel`."),
    );
    await executeRun("intel", flags);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
