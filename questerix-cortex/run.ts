import { agentops } from 'agentops';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import open from 'open';
import * as path from 'path';
import { Project } from 'ts-morph';
import { Analyst } from './src/analyst';
import { Consolidator } from './src/consolidator';
import { CortexDB } from './src/cortex-db';
import { Dashboard } from './src/dashboard';
import { DriftDetector, DriftResult } from './src/drift';
import { FragilityMetrics, FragilityScorer } from './src/fragility';
import { auditGovernance } from './src/governance';
import { Guard } from './src/guard';
import { Historian } from './src/historian';
import { OptimizeAuditor, OptimizeReport } from './src/optimizer';
import { Orchestrator } from './src/orchestrator';
import { Reporter } from './src/reporter';
import { RlsAuditor, RlsAuditResult } from './src/rls';
import { Scanner } from './src/scanner';
import { SkeletonGenerator } from './src/skeleton';
import { SkeletonSearch } from './src/skeleton/search';
import { CortexConfig } from './src/types';
import { normalizePath } from './src/utils/normalize-path';
import { ZombieHunter } from './src/utils/process-cleaner';
import { FeatureVisualizer } from './src/visualizer';

const configPath = path.join(__dirname, 'cortex.config.json');
const config: CortexConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// ── Suite registry ────────────────────────────────────────────────────────────
// `parallel: true` means suites in the same tier run concurrently.
// Leave it false for suites that can't share the same cwd safely (e.g. builds).
const allSuites: Array<{
  id: string; name: string; command: string;
  tier: 'smoke' | 'deep' | 'release' | 'deploy'; parallel: boolean;
}> = [
  // Smoke — fast sanity, safe to parallelise
  { id: 'unit',   name: 'Unit Tests (Lib)',    command: 'npx vitest run src/__tests__/lib/utils.test.ts', tier: 'smoke',   parallel: true  },
  { id: 'lint',   name: 'Lint Check',          command: 'npx eslint src/lib/utils.ts',                  tier: 'smoke',   parallel: true  },
  { id: 'e2e',    name: 'E2E Smoke (Desktop)', command: 'npx playwright test tests/auth-flow.e2e.spec.ts --project=desktop', tier: 'smoke', parallel: false },

  // Deep — heavier, but tsc + audit are independent
  { id: 'tsc',             name: 'TypeScript Strict',      command: 'npx tsc --noEmit',                         tier: 'deep',    parallel: true  },
  { id: 'audit',           name: 'Security Audit',         command: 'npm audit --audit-level=high',             tier: 'deep',    parallel: true  },

  { id: 'full-vitest',     name: 'Full Vitest + Coverage', command: 'npm run test -- --run --coverage',         tier: 'deep',    parallel: false },
  { id: 'full-playwright', name: 'Full Playwright Suite',  command: 'npx playwright test',                      tier: 'deep',    parallel: false },
  { id: 'latency',         name: 'Latency Benchmark',      command: 'npm run test:benchmark',                   tier: 'deep',    parallel: false },

  // Release — sequential only (write to dist/, share port)
  { id: 'build',   name: 'Production Build',  command: 'npm run build',                                     tier: 'release', parallel: false },
  { id: 'certify', name: 'Certify Phase 0',   command: 'powershell ..\\scripts\\certify-evidence.ps1',      tier: 'release', parallel: false },
  { id: 'hygiene', name: 'Code Hygiene Scan', command: 'powershell ..\\scripts\\code-hygiene-scan.ps1',     tier: 'release', parallel: false },
  { id: 'forensic',name: 'Forensic Audit',    command: 'powershell ..\\scripts\\maintenance\\forensic_audit.ps1', tier: 'release', parallel: false },

  // Deploy — sequential only, runs after release certification
  { id: 'deploy-admin', name: 'Deploy Admin Panel',   command: 'powershell ..\\scripts\\deploy\\deploy-all.ps1 -ConfigFile ..\\master-config.json -Target admin-panel', tier: 'deploy', parallel: false },
  { id: 'deploy-fns',   name: 'Deploy Edge Functions', command: 'cd .. && npx supabase functions deploy --project-ref bkfhorslctqieetzqdtd', tier: 'deploy',  parallel: false },
];

// Ship tier removed - git operations should be manual per AGENTS.md rules

function listFilesRecursively(dir: string, predicate: (filePath: string) => boolean): string[] {
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
  const cleaned = name.replace(/\.spec\.ts$/i, '');
  const parts = cleaned.split(/[-_ ]+/).filter(Boolean);
  const pascal = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  return pascal.toLowerCase();
}



function mapE2ETestsToPages(cortexDb: CortexDB, adminPath: string): void {
  const testDir = path.join(adminPath, 'tests');
  const pageDir = path.join(adminPath, 'src', 'features');
  const testFiles = listFilesRecursively(testDir, filePath => filePath.endsWith('.spec.ts'));
  const pageFiles = listFilesRecursively(
    pageDir,
    filePath => filePath.replace(/\\/g, '/').includes('/pages/') && filePath.endsWith('.tsx')
  );

  const pageMap = new Map<string, string>();
  for (const pageFile of pageFiles) {
    const baseName = path.basename(pageFile, '.tsx');
    pageMap.set(baseName.toLowerCase(), pageFile);
  }

  const db = cortexDb.getDb();
  const timestamp = new Date().toISOString();
  const insertNode = db.prepare(`
    INSERT OR REPLACE INTO nodes (id, type, file_path, metadata, updated_at)
    VALUES (@id, @type, @filePath, @metadata, @updatedAt)
  `);
  const insertEdge = db.prepare(`
    INSERT OR REPLACE INTO edges (source_id, target_id, relationship, metadata)
    VALUES (@sourceId, @targetId, @relationship, @metadata)
  `);
  const deleteEdgesForSource = db.prepare('DELETE FROM edges WHERE source_id = ?');

  for (const testFile of testFiles) {
    const testBase = path.basename(testFile, '.spec.ts');
    const testKey = toComparableName(testBase);
    const pageFile = pageMap.get(testKey);
    const testId = normalizePath(testFile);

    deleteEdgesForSource.run(testId);

    if (!pageFile) continue;

    const pageId = normalizePath(pageFile);

    insertNode.run({
      id: testId,
      type: 'file',
      filePath: testId,
      metadata: null,
      updatedAt: timestamp
    });
    insertNode.run({
      id: pageId,
      type: 'file',
      filePath: pageId,
      metadata: null,
      updatedAt: timestamp
    });
    insertEdge.run({
      sourceId: testId,
      targetId: pageId,
      relationship: 'tests',
      metadata: null
    });
  }
}

async function main() {
  // Check for CI mode (skip dashboard/browser)
  const args = process.argv.slice(2);
  const isCI = args.includes('--ci') || args.includes('--no-dashboard');
  const targetArg = args.find(a => !a.startsWith('--'));
  const flags = args.filter(a => a.startsWith('--'));

  // ── Early-exit targets (no dashboard / scanner needed) ────────────────────
  const earlyTarget = targetArg;

  if (earlyTarget === 'optimize') {
    console.log(chalk.cyan.bold('\n🚀 Questerix Cortex — Performance Optimization Audit'));
    const optimizer = new OptimizeAuditor(path.resolve(__dirname, '..'));
    const report = optimizer.audit();
    const md = optimizer.generateMarkdownReport(report);

    const outputsPath = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputsPath)) fs.mkdirSync(outputsPath, { recursive: true });
    const reportPath = path.join(outputsPath, 'OPTIMIZE_REPORT.md');
    fs.writeFileSync(reportPath, md, 'utf-8');

    const color = report.verdict === 'CLEAN' ? 'green' : 'red';
    console.log(chalk[color](`\n${report.summary}`));
    console.log(chalk.gray(`\n   Report written → ${reportPath}\n`));
    console.log(md);
    process.exit(0);
  }

  console.log(chalk.cyan.bold('\n🚀 Questerix Cortex — Initializing...'));

  // Pre-flight: Kill any existing zombies/port locks
  ZombieHunter.clean(config.dashboardPort);

  // Initialize AgentOps session if API key is present
  if (process.env.AGENTOPS_API_KEY) {
    try {
      await agentops.init({
        apiKey: process.env.AGENTOPS_API_KEY,
      });
    } catch (err) {
      console.warn(chalk.yellow('⚠️  Failed to initialize AgentOps:', err));
    }
  }

  const adminPath    = path.resolve(__dirname, config.adminPanelPath);
  const supabasePath = path.resolve(__dirname, config.supabasePath);
  const srcPath      = path.join(adminPath, 'src');

  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '..', 'admin-panel', 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true // Lazy loading: only add what we need
  });

  // Explicitly add core source files to reduce memory footprint
  project.addSourceFilesAtPaths([
    path.join(srcPath, 'features/**/*.{ts,tsx}'),
    path.join(srcPath, 'lib/**/*.{ts,tsx}'),
    path.join(srcPath, 'hooks/**/*.{ts,tsx}'),
    path.join(srcPath, 'services/**/*.{ts,tsx}')
  ]);

  // Handle graceful exits to release resources
  const cleanup = () => {
    console.log(chalk.gray('\n  👋 Shutting down Cortex...'));
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  const scanner = new Scanner(project, srcPath);
  const reporter = new Reporter(__dirname, config.outputs, path.resolve(__dirname, '..'));
  const analyst = new Analyst(project);
  const historian = new Historian(
    path.join(__dirname, config.outputs.history),
    config.thresholds.maxHistoryRuns
  );
  const driftDetector = new DriftDetector(adminPath, supabasePath);
  const rlsAuditor = new RlsAuditor(config.supabaseProjectRef);

  // CI mode: skip dashboard and browser
  let dashboard: Dashboard | undefined;
  let orchestrator: Orchestrator;

  if (!isCI) {
    dashboard = new Dashboard(config.dashboardPort);
    orchestrator = new Orchestrator(adminPath, (text, color, bold) => dashboard!.log(text, color, bold));
    await open(`http://localhost:${config.dashboardPort}`);
  } else {
    // In CI mode, use console logging instead of dashboard
    orchestrator = new Orchestrator(adminPath, (text, color, bold) => {
      const colorFn = color ? (chalk as any)[color] || chalk.gray : chalk.gray;
      console.log(bold ? colorFn.bold(text) : colorFn(text));
    });
  }

  // ── Core run function ─────────────────────────────────────────────────────
  const executeRun = async (target: string = 'all', flags: string[] = []) => {
    const targets = target.split(',').map(t => t.trim());
    const generateSkeletons = flags.includes('--generate-skeletons');
    const healDrift = flags.includes('--heal-drift');
    const syncKb = flags.includes('--sync-kb');
    const pruneBrain = flags.includes('--prune-brain');
    const consolidate = flags.includes('--consolidate');

    // ── Optimize target (standalone — exits early) ────────────────────────────
    if (targets.includes('optimize')) {
      console.log(chalk.cyan.bold('\n🚀 Running Performance Optimization Audit…'));
      dashboard?.log('\n🚀 Running Performance Optimization Audit…', 'cyan', true);
      const optimizer = new OptimizeAuditor(path.resolve(__dirname, '..'));
      const report = optimizer.audit();
      const md = optimizer.generateMarkdownReport(report);

      const outputsPath = path.resolve(__dirname, config.outputs ? path.dirname(config.outputs.surfaceMap ?? 'outputs/x') : 'outputs');
      if (!fs.existsSync(outputsPath)) fs.mkdirSync(outputsPath, { recursive: true });
      const reportPath = path.join(outputsPath, 'OPTIMIZE_REPORT.md');
      fs.writeFileSync(reportPath, md, 'utf-8');

      const color = report.verdict === 'CLEAN' ? 'green' : 'red';
      console.log(chalk[color](`\n${report.summary}`));
      dashboard?.log(`\n${report.summary}`, color);
      console.log(chalk.gray(`   Report saved → ${reportPath}`));
      dashboard?.log(`   Report saved → outputs/OPTIMIZE_REPORT.md`, 'gray');
      
      // Update dashboard state so results appear in the UI
      dashboard?.update({}, undefined, undefined, historian.getHistory(), undefined, undefined, undefined, report);
      return;
    }

    const runDrift = targets.includes('drift') || targets.includes('all') || targets.includes('full') || targets.includes('intel');
    const runRls   = targets.includes('rls')   || targets.includes('full') || targets.includes('intel');
    const runSkeleton = targets.includes('skeleton') || targets.includes('all') || targets.includes('full') || targets.includes('intel');
    const runGovernance = targets.includes('governance') || targets.includes('intel');
    const runOptimize = targets.includes('optimize') || targets.includes('all') || targets.includes('full') || targets.includes('intel');
    
    console.log(chalk.cyan.bold(`\n🔄 Run (${target}) started…`));
    dashboard?.log(`\n🔄 Run (${target}) started…`, 'cyan', true);

    // Clear previous results to prevent stale data
    orchestrator.clearResults();

    // Semantic scan
    const surfaceMap = scanner.scan();
    const outputsPath = path.resolve(__dirname, path.dirname(config.outputs.surfaceMap));
    if (!fs.existsSync(outputsPath)) fs.mkdirSync(outputsPath, { recursive: true });
    
    fs.writeFileSync(
      path.join(__dirname, config.outputs.surfaceMap),
      JSON.stringify(surfaceMap, null, 2)
    );

    const cortexDb = new CortexDB(path.join(__dirname, 'outputs', 'cortex.db'));
    try {
      await scanner.writeGraph(cortexDb);
      mapE2ETestsToPages(cortexDb, adminPath);
    } finally {
      cortexDb.close();
    }

    // ── Skeleton generation ──────────────────────────────────────────────────
    if (runSkeleton) {
      try {
        console.log(chalk.cyan('\n🦴 Generating codebase skeleton…'));
        dashboard?.log('\n🦴 Generating codebase skeleton…', 'cyan');
        const skeletonGen = new SkeletonGenerator(project, srcPath);
        const skeletonReport = skeletonGen.generate();
        skeletonGen.writeJson(skeletonReport, path.join(outputsPath, 'SKELETON.json'));
        skeletonGen.writeMarkdownFull(skeletonReport, path.join(outputsPath, 'SKELETON.md'));
        skeletonGen.writeMarkdownSummary(skeletonReport, path.join(outputsPath, 'SKELETON_SUMMARY.md'));
        skeletonGen.writeUtilityRegistry(skeletonReport, path.join(outputsPath, 'UTILITY_REGISTRY.md'));
        console.log(chalk.green(`   ✅ Skeleton: ${skeletonReport.totalFiles} files, ${skeletonReport.totalExports} exports`));
        dashboard?.log(`   ✅ Skeleton: ${skeletonReport.totalFiles} files, ${skeletonReport.totalExports} exports`, 'green');

        // ── Index for search ──────────────────────────────────────────────────
        const searchDbPath = path.join(outputsPath, 'search.db');
        const searcher = new SkeletonSearch(searchDbPath);
        searcher.index(skeletonReport);
        searcher.close();
        console.log(chalk.green('   ✅ Search index updated.'));
        dashboard?.log('   ✅ Search index updated.', 'green');

      } catch (skeletonErr: any) {
        console.warn(chalk.yellow('   ⚠️  Skeleton generation failed:', skeletonErr.message));
        dashboard?.log('   ⚠️  Skeleton generation failed', 'yellow');
      }
    }

    if (generateSkeletons) {
      console.log(chalk.yellow('\n🧪 Generating test skeletons for gaps…'));
      dashboard?.log('\n🧪 Generating test skeletons for gaps…', 'yellow');
      const skels = scanner.generateSkeletons(surfaceMap);
      if (skels.length > 0) {
        console.log(chalk.green(`   ✅ Generated ${skels.length} skeletons.`));
        dashboard?.log(`   ✅ Generated ${skels.length} skeletons.`, 'green');
      } else {
        console.log(chalk.gray('   ⏭️ No new gaps requiring skeletons.'));
        dashboard?.log('   ⏭️ No new gaps requiring skeletons.', 'gray');
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
      migrationGaps: analyst.lintMigrations(path.join(supabasePath, 'migrations')),
      typeSafetyGaps: analyst.lintTypeSafety(),
    };

    // ── Intelligence checks (fast, no test runner) ──────────────────────────
    let driftResult: DriftResult | undefined;
    let rlsResult: RlsAuditResult | undefined;
    let optimizeResult: OptimizeReport | undefined;

    if (runDrift) {
      console.log(chalk.cyan('\n🔍 Schema Drift Detection…'));
      dashboard?.log('\n🔍 Schema Drift Detection…', 'cyan');
      driftResult = driftDetector.detect();

      if (healDrift && driftResult.verdict === 'DRIFT DETECTED') {
        console.log(chalk.yellow('🩹 Healing schema drift…'));
        dashboard?.log('🩹 Healing schema drift…', 'yellow');
        const healed = driftDetector.heal();
        if (healed) {
          console.log(chalk.green('   ✅ Drift healed. Re-scanning…'));
          dashboard?.log('   ✅ Drift healed. Re-scanning…', 'green');
          driftResult = driftDetector.detect();
        }
      }

      const driftSummary = `   ${driftResult.verdict} — types: ${driftResult.typesTableCount} | ` +
        `missing: ${driftResult.missingFromTypes.length} | extra: ${driftResult.extraInTypes.length}`;
      console.log(chalk.cyan(driftSummary));
      dashboard?.log(driftSummary, 'cyan');
    }

    if (syncKb) {
      console.log(chalk.yellow('\n🧠 Syncing Knowledge Base (Project Oracle)…'));
      dashboard?.log('🧠 Syncing Knowledge Base (Project Oracle)…', 'yellow');
      try {
        const scriptPath = path.join(supabasePath, '..', 'scripts', 'maintenance', 'automate_knowledge.ps1');
        execSync(`powershell -NoProfile -File "${scriptPath}"`, { stdio: 'inherit' });
        console.log(chalk.green('   ✅ Knowledge sync complete.'));
        dashboard?.log('   ✅ Knowledge sync complete.', 'green');
      } catch (err) {
        console.error('   ❌ Knowledge sync failed:', err);
        dashboard?.log('   ❌ Knowledge sync failed.', 'red');
      }
    }

    if (pruneBrain) {
      console.log(chalk.yellow('\n🧹 Pruning Agent Memory (Hygiene)…'));
      dashboard?.log('🧹 Pruning Agent Memory (Hygiene)…', 'yellow');
      try {
        const scriptPath = path.join(supabasePath, '..', 'scripts', 'maintenance', 'agent-memory-cleanup.ps1');
        execSync(`powershell -NoProfile -File "${scriptPath}"`, { stdio: 'inherit' });
        console.log(chalk.green('   ✅ Memory pruning complete.'));
        dashboard?.log('   ✅ Memory pruning complete.', 'green');
      } catch (err) {
        console.error('   ❌ Memory pruning failed:', err);
        dashboard?.log('   ❌ Memory pruning failed.', 'red');
      }
    }

    if (consolidate) {
      console.log(chalk.yellow('\n📦 Consolidating fragmented artifacts…'));
      dashboard?.log('📦 Consolidating fragmented artifacts…', 'yellow');
      const brainPath = path.resolve(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain');
      const consolidator = new Consolidator(brainPath, path.resolve(__dirname, '..'));
      const cResult = consolidator.consolidate();
      if (cResult.merged.length > 0) {
        console.log(chalk.green(`   ✅ Merged ${cResult.merged.length} document set(s).`));
        dashboard?.log(`   ✅ Merged ${cResult.merged.length} document set(s).`, 'green');
      } else {
        console.log(chalk.gray('   ⏭️ No documents requiring consolidation.'));
        dashboard?.log('   ⏭️ No documents requiring consolidation.', 'gray');
      }
    }

    if (runRls) {
      console.log(chalk.cyan('\n🔒 RLS Audit…'));
      dashboard?.log('\n🔒 RLS Audit…', 'cyan');
      rlsResult = await rlsAuditor.audit();
      const rlsSummary = `   ${rlsResult.verdict} — critical: ${rlsResult.criticalCount}`;
      console.log(chalk.cyan(rlsSummary));
      dashboard?.log(rlsSummary, 'cyan');
    }

    let governanceResult: { deadRefs: Array<{ file: string; ref: string }>; scannedFiles: number } | undefined;
    if (runGovernance) {
      console.log(chalk.cyan('\n📜 Governance (dead refs)…'));
      dashboard?.log('\n📜 Governance…', 'cyan');
      governanceResult = auditGovernance(path.resolve(__dirname, '..'));
      const govSummary = `   Scanned ${governanceResult.scannedFiles} files, ${governanceResult.deadRefs.length} dead reference(s)`;
      console.log(chalk.cyan(govSummary));
      dashboard?.log(govSummary, 'cyan');

      // Run FeatureVisualizer once and reuse result
      let deps: any[] | undefined;
      let visualizer: FeatureVisualizer | undefined;
      try {
        visualizer = new FeatureVisualizer(srcPath);
        deps = visualizer.analyze();
      } catch (err: any) {
        console.warn(chalk.yellow('   ⚠️  Feature analysis failed:', err.message));
      }

      if (deps && visualizer) {
        // ── Feature Mapping ──
        console.log(chalk.cyan('\n🗺️  Mapping feature isolation…'));
        dashboard?.log('🗺️  Mapping feature isolation…', 'cyan');
        try {
          const featureMd = visualizer.generateMarkdownReport(deps);
          const fMapPath = path.join(__dirname, config.outputs.featureMap);
          fs.writeFileSync(fMapPath, featureMd, 'utf-8');
          console.log(chalk.green(`   ✅ Feature map: ${deps.length} cross-dependencies found → ${fMapPath}`));
          dashboard?.log(`   ✅ Feature map generated: ${deps.length} cross-dependencies`, 'green');
        } catch (err: any) {
          console.warn(chalk.yellow('   ⚠️  Feature mapping failed:', err.message));
          dashboard?.log('   ⚠️  Feature mapping failed', 'yellow');
        }

        // ── Fragility Analysis ──
        console.log(chalk.cyan('\n🏗️  Analyzing feature fragility…'));
        dashboard?.log('🏗️  Analyzing feature fragility…', 'cyan');
        try {
          const scorer = new FragilityScorer(srcPath);
          const metrics: FragilityMetrics[] = scorer.analyze(deps);
          const fragilityMd = scorer.generateMarkdownReport(metrics);
          const fMatrixPath = path.join(__dirname, config.outputs.fragilityMatrix);
          fs.writeFileSync(fMatrixPath, fragilityMd, 'utf-8');
          
          const fragileCount = metrics.filter((m: FragilityMetrics) => m.verdict === 'FRAGILE' || m.verdict === 'STIFF').length;
          console.log(chalk.green(`   ✅ Fragility matrix: ${fragileCount} high-risk features found → ${fMatrixPath}`));
          dashboard?.log(`   ✅ Fragility matrix generated: ${fragileCount} high-risk features`, fragileCount > 0 ? 'yellow' : 'green');
        } catch (err: any) {
          console.warn(chalk.yellow('   ⚠️  Fragility analysis failed:', err.message));
          dashboard?.log('   ⚠️  Fragility analysis failed', 'yellow');
        }

        // ── Architecture Guard ──
        console.log(chalk.cyan('\n🛡️  Enforcing architecture guard…'));
        dashboard?.log('🛡️  Enforcing architecture guard…', 'cyan');
        try {
          const guard = new Guard(config.guard.rules);
          const violations = guard.check(deps);
          const guardMd = guard.generateReport(violations);
          const gPath = path.join(__dirname, config.outputs.guardReport);
          fs.writeFileSync(gPath, guardMd, 'utf-8');

        if (violations.length > 0) {
          console.log(chalk.red(`   ❌ Guard breach: ${violations.length} violations detected → ${gPath}`));
          dashboard?.log(`   ❌ Guard breach: ${violations.length} violations`, 'red');
        } else {
          console.log(chalk.green(`   ✅ Guard: PASS → ${gPath}`));
          dashboard?.log('   ✅ Guard: PASS', 'green');
        }
      } catch (err: any) {
        console.warn(chalk.yellow('   ⚠️  Guard check failed:', err.message));
        dashboard?.log('   ⚠️  Guard check failed', 'yellow');
      }
    }
  } // Added missing closing brace here

    // ── Performance Optimization Audit ──────────────────────────────────────
    if (runOptimize && !targets.includes('optimize')) {
      console.log(chalk.cyan('\n🚀 Performance Optimization Audit…'));
      dashboard?.log('\n🚀 Performance Optimization Audit…', 'cyan');
      try {
        const optimizer = new OptimizeAuditor(path.resolve(__dirname, '..'));
        const optReport = optimizer.audit();
        const md = optimizer.generateMarkdownReport(optReport);
        optimizeResult = { ...optReport, markdown: md };
        const optColor = optReport.verdict === 'CLEAN' ? 'green' : 'red';
        console.log(chalk[optColor](`   ${optReport.summary}`));
        dashboard?.log(`   ${optReport.summary}`, optColor);
      } catch (err) {
        console.warn(chalk.yellow('⚠️  Optimizer failed:', err));
      }
    }

    let history = historian.getHistory();
    const pushUpdate = () =>
      dashboard?.update(orchestrator.getResults(), surfaceMap, analystResults, history, undefined, driftResult, rlsResult, optimizeResult);

    pushUpdate();

    // ── Suite execution ───────────────────────────────────────────────────────
    if (targets.some(t => !['drift', 'rls', 'intel'].includes(t))) {
      const suitesToRun = targets.includes('all')
        ? allSuites.filter(s => s.tier === 'smoke')
        : targets.includes('full')
          ? allSuites
          : allSuites.filter(s => targets.includes(s.id) || targets.includes(s.tier));

      // ── Pre-flight: skip suites whose target file doesn't exist ────────────
      const validatedSuites = suitesToRun.filter(suite => {
        // Extract the first argument that looks like a file path (contains '/')
        const fileArg = suite.command.split(' ').find(tok =>
          (tok.includes('/') || tok.includes('\\')) && !tok.startsWith('-')
        );
        if (!fileArg) return true; // No file arg — command is self-contained (e.g. eslint, tsc)
        const absPath = path.isAbsolute(fileArg) ? fileArg : path.join(adminPath, fileArg);
        if (!fs.existsSync(absPath)) {
          const msg = `⚠️  Skipping "${suite.name}" — target not found: ${fileArg}`;
          console.log(chalk.yellow(msg));
          dashboard?.log(msg, 'yellow');
          return false;
        }
        return true;
      });

      // Group by tier to run parallel-eligible suites together
      type Tier = 'smoke' | 'deep' | 'release' | 'deploy';
      const tierOrder: Tier[] = ['smoke', 'deep', 'release', 'deploy'];

      for (const tier of tierOrder) {
        const tierSuites = validatedSuites.filter(s => s.tier === tier);
        if (tierSuites.length === 0) continue;

        const parallelGroup = tierSuites.filter(s => s.parallel);
        const sequentialGroup = tierSuites.filter(s => !s.parallel);

        // Run parallel-safe suites concurrently, then sequential ones in order
        if (parallelGroup.length > 0) {
          await orchestrator.runSuitesConcurrent(parallelGroup, pushUpdate);
          analystResults.bundleSize = analyst.getBundleSize(adminPath);
          pushUpdate();
        }

        for (const suite of sequentialGroup) {
          pushUpdate();
          await orchestrator.runSuite(suite.name, suite.command);
          analystResults.bundleSize = analyst.getBundleSize(adminPath);
          pushUpdate();
        }
      }
    }

    // ── Post-run analysis ─────────────────────────────────────────────────────
    analystResults.deadCode = analyst.findDeadCode().slice(0, 10);
    analystResults.perfGaps = analyst.checkPerformanceInstrumentation();
    analystResults.migrationGaps = analyst.lintMigrations(path.join(supabasePath, 'migrations'));

    // Bundle size regression guard
    const bundleKB = analystResults.bundleSize;
    if (bundleKB && bundleKB > 9000) {
      const msg = `⚠️ Bundle size ${bundleKB} KB exceeds 9 MB threshold!`;
      console.log(chalk.red(msg));
      dashboard?.log(msg, 'red');
    }

    const results    = orchestrator.getResults();
    const allResults = Object.values(results);
    const passed     = allResults.filter(r => r.status === 'passed').length;
    const total      = allResults.length;

    const updatedHistory = historian.record({
      date:     new Date().toISOString(),
      score:    total > 0 ? Math.round((passed / total) * 100) : 0,
      coverage: 0,
      failures: total - passed,
    });

    // Smoke gate
    const smokeNames = ['unit tests (lib)', 'e2e smoke (desktop)', 'lint check'];
    const smokePass  = allResults
      .filter(r => smokeNames.includes(r.name.toLowerCase()))
      .every(r => r.status === 'passed');

    // Reports
    reporter.generate(results, surfaceMap, analystResults, driftResult, rlsResult, updatedHistory, governanceResult, optimizeResult);

    dashboard?.update(results, surfaceMap, analystResults, updatedHistory, smokePass, driftResult, rlsResult, optimizeResult);

    // Summary
    const driftLine = driftResult
      ? driftResult.verdict === 'CLEAN' ? chalk.green('✅ Drift: CLEAN')
        : chalk.red(`🔴 Drift: ${driftResult.verdict}`)
      : '';
    const rlsLine = rlsResult
      ? rlsResult.verdict === 'PASS' ? chalk.green('✅ RLS: PASS')
        : chalk.red(`🔴 RLS: ${rlsResult.verdict}`)
      : '';

    if (driftResult && driftLine) {
      console.log('\n' + driftLine);
      dashboard?.log('\n' + driftLine.replace(/\u001b\[\d+m/g, ''), driftResult.verdict === 'CLEAN' ? 'green' : 'red');
    }
    if (rlsResult && rlsLine) {
      console.log(rlsLine);
      dashboard?.log(rlsLine.replace(/\u001b\[\d+m/g, ''), rlsResult.verdict === 'PASS' ? 'green' : 'red');
    }
    console.log(chalk.green(`\n✅ Run complete. Reports in outputs/`));
    dashboard?.log(`\n✅ Run complete. Reports in outputs/`, 'green', true);
  };

  dashboard?.onTrigger(async (target: string) => {
    await executeRun(target);
  });

  // Auto-run only if an explicit target was passed as a CLI arg.
  // With no args, Cortex opens the dashboard and waits for a button click.
  // CI mode: skip dashboard and auto-run if target provided

  if (targetArg && isCI) {
    await executeRun(targetArg, flags);
    process.exit(0);
  }

  if (targetArg === 'skeleton:search') {
    const query = flags.find(f => !f.startsWith('--')) || args[args.indexOf('skeleton:search') + 1];
    if (!query) {
      console.error(chalk.red('❌ Missing search query. Usage: npm run health -- skeleton:search "query"'));
      return;
    }
    const outputsPath = path.resolve(__dirname, 'outputs');
    const searchDbPath = path.join(outputsPath, 'search.db');
    if (!fs.existsSync(searchDbPath)) {
      console.error(chalk.red('❌ Search index not found. Run a health check first.'));
      return;
    }
    const searcher = new SkeletonSearch(searchDbPath);
    const results = searcher.search(query);
    console.log(chalk.cyan(`\n🔍 Search results for "${query}":`));
    results.forEach(r => {
      console.log(chalk.white(`  • `) + chalk.bold(r.name) + chalk.gray(` (${r.kind}) in `) + chalk.blue(r.file));
      if (r.signature) console.log(chalk.gray(`    ${r.signature}`));
      if (r.doc) console.log(chalk.italic.gray(`    ${r.doc}`));
    });
    searcher.close();
    return;
  }

  if (targetArg) {
    await executeRun(targetArg, flags);
  } else {
    console.log(chalk.yellow('  ⏸  No target specified — dashboard open, waiting for trigger.'));
    dashboard?.log('⏸  Ready. Click a button to start a run.', 'yellow');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
