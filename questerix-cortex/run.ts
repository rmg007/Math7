import chalk from 'chalk';
import * as fs from 'fs';
import open from 'open';
import * as path from 'path';
import { Analyst } from './src/analyst';
import { Dashboard } from './src/dashboard';
import { DriftDetector } from './src/drift';
import { Historian } from './src/historian';
import { Orchestrator } from './src/orchestrator';
import { Reporter } from './src/reporter';
import { RlsAuditor } from './src/rls';
import { Scanner } from './src/scanner';
import { CortexConfig } from './src/types';

const configPath = path.join(__dirname, 'cortex.config.json');
const config: CortexConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// ── Suite registry ────────────────────────────────────────────────────────────
// `parallel: true` means suites in the same tier run concurrently.
// Leave it false for suites that can't share the same cwd safely (e.g. builds).
const allSuites: Array<{
  id: string; name: string; command: string;
  tier: 'smoke' | 'deep' | 'release' | 'deploy' | 'ship'; parallel: boolean;
}> = [
  // Smoke — fast sanity, safe to parallelise
  { id: 'unit',   name: 'Unit Tests (Lib)',    command: 'npx vitest run src/__tests__/lib/utils.test.ts', tier: 'smoke',   parallel: true  },
  { id: 'lint',   name: 'Lint Check',          command: 'npx eslint src/lib/utils.ts',                  tier: 'smoke',   parallel: true  },
  { id: 'e2e',    name: 'E2E Smoke (Desktop)', command: 'npx playwright test tests/auth-flow.e2e.spec.ts --project=desktop', tier: 'smoke', parallel: false },
  { id: 'perf',   name: 'Performance Bench',   command: 'npx playwright test tests/performance.e2e.spec.ts', tier: 'smoke', parallel: false },

  // Deep — heavier, but tsc + audit are independent
  { id: 'tsc',             name: 'TypeScript Strict',      command: 'npx tsc --noEmit',                         tier: 'deep',    parallel: true  },
  { id: 'audit',           name: 'Dependency Audit',       command: 'npm audit --audit-level=high',             tier: 'deep',    parallel: true  },
  { id: 'full-vitest',     name: 'Full Vitest + Coverage', command: 'npm run test -- --run --coverage',         tier: 'deep',    parallel: false },
  { id: 'full-playwright', name: 'Full Playwright Suite',  command: 'npx playwright test',                      tier: 'deep',    parallel: false },

  // Release — sequential only (write to dist/, share port)
  { id: 'build',   name: 'Production Build',  command: 'npm run build',                                     tier: 'release', parallel: false },
  { id: 'certify', name: 'Certify Phase 0',   command: 'powershell ..\\scripts\\certify-evidence.ps1',      tier: 'release', parallel: false },
  { id: 'hygiene', name: 'Code Hygiene Scan', command: 'powershell ..\\scripts\\code-hygiene-scan.ps1',     tier: 'release', parallel: false },
  { id: 'forensic',name: 'Forensic Audit',    command: 'powershell ..\\scripts\\maintenance\\forensic_audit.ps1', tier: 'release', parallel: false },

  // Deploy — sequential only, runs after release certification
  { id: 'deploy-admin', name: 'Deploy Admin Panel',   command: 'powershell ..\\scripts\\deploy\\deploy-all.ps1 -ConfigFile ..\\master-config.json -Target admin-panel', tier: 'deploy', parallel: false },
  { id: 'deploy-fns',   name: 'Deploy Edge Functions', command: 'supabase functions deploy',                tier: 'deploy',  parallel: false },

  // Ship — final source control push, ONLY if all previous tiers pass
  { id: 'git-ship',     name: 'Git Ship (Push)',      command: 'powershell -Command "git add .; git commit -m \"feat: auto-ship via cortex\"; git push"', tier: 'ship', parallel: false },
];

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Questerix Cortex — Initializing...'));

  const adminPath    = path.resolve(__dirname, config.adminPanelPath);
  const supabasePath = path.resolve(__dirname, config.supabasePath);
  const srcPath      = path.join(adminPath, 'src');

  const scanner      = new Scanner(srcPath);
  const dashboard    = new Dashboard(config.dashboardPort);
  const orchestrator = new Orchestrator(adminPath, (text, color, bold) => dashboard.log(text, color, bold));
  const reporter     = new Reporter(__dirname, config.outputs, path.resolve(__dirname, '..'));
  const analyst      = new Analyst(srcPath);
  const historian    = new Historian(
    path.join(__dirname, config.outputs.history),
    config.thresholds.maxHistoryRuns
  );
  const driftDetector = new DriftDetector(adminPath, supabasePath);
  const rlsAuditor    = new RlsAuditor(config.supabaseProjectRef);

  await open(`http://localhost:${config.dashboardPort}`);

  // ── Core run function ─────────────────────────────────────────────────────
  const executeRun = async (target: string = 'all') => {
    const targets = target.split(',').map(t => t.trim());
    console.log(chalk.cyan.bold(`\n🔄 Run (${target}) started…`));
    dashboard.log(`\n🔄 Run (${target}) started…`, 'cyan', true);

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
    scanner.writeApiMap(surfaceMap, outputsPath);

    let analystResults: { 
      deadCode: string[]; 
      bundleSize: number | null; 
      perfGaps: string[];
      migrationGaps: string[];
    } = {
      deadCode: [],
      bundleSize: analyst.getBundleSize(adminPath),
      perfGaps: analyst.checkPerformanceInstrumentation(),
      migrationGaps: analyst.lintMigrations(path.join(supabasePath, 'migrations')),
    };

    // ── Intelligence checks (fast, no test runner) ──────────────────────────
    let driftResult: any = null;
    let rlsResult: any   = null;

    const runDrift = targets.includes('drift') || targets.includes('all') || targets.includes('full') || targets.includes('intel');
    const runRls   = targets.includes('rls')   || targets.includes('full') || targets.includes('intel');

    if (runDrift) {
      console.log(chalk.cyan('\n🔍 Schema Drift Detection…'));
      dashboard.log('\n🔍 Schema Drift Detection…', 'cyan');
      driftResult = driftDetector.detect();
      const driftSummary = `   ${driftResult.verdict} — types: ${driftResult.typesTableCount} | ` +
        `missing: ${driftResult.missingFromTypes.length} | extra: ${driftResult.extraInTypes.length}`;
      console.log(chalk.cyan(driftSummary));
      dashboard.log(driftSummary, 'cyan');
    }

    if (runRls) {
      console.log(chalk.cyan('\n🔒 RLS Audit…'));
      dashboard.log('\n🔒 RLS Audit…', 'cyan');
      rlsResult = await rlsAuditor.audit();
      const rlsSummary = `   ${rlsResult.verdict} — critical: ${rlsResult.criticalCount}`;
      console.log(chalk.cyan(rlsSummary));
      dashboard.log(rlsSummary, 'cyan');
    }

    let history = historian.getHistory();
    const pushUpdate = () =>
      dashboard.update(orchestrator.getResults(), surfaceMap, analystResults, history, undefined, driftResult, rlsResult);

    pushUpdate();

    // ── Suite execution ───────────────────────────────────────────────────────
    if (targets.some(t => !['drift', 'rls', 'intel'].includes(t))) {
      const suitesToRun = targets.includes('all')
        ? allSuites.filter(s => s.tier === 'smoke')
        : targets.includes('full')
          ? allSuites
          : allSuites.filter(s => targets.includes(s.id) || targets.includes(s.tier));

      // Group by tier to run parallel-eligible suites together
      type Tier = 'smoke' | 'deep' | 'release' | 'deploy' | 'ship';
      const tierOrder: Tier[] = ['smoke', 'deep', 'release', 'deploy', 'ship'];

      for (const tier of tierOrder) {
        const tierSuites = suitesToRun.filter(s => s.tier === tier);
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
    reporter.generate(results, surfaceMap, analystResults, driftResult, rlsResult, updatedHistory);

    dashboard.update(results, surfaceMap, analystResults, updatedHistory, smokePass, driftResult, rlsResult);

    // Summary
    const driftLine = driftResult
      ? driftResult.verdict === 'CLEAN' ? chalk.green('✅ Drift: CLEAN')
        : chalk.red(`🔴 Drift: ${driftResult.verdict}`)
      : '';
    const rlsLine = rlsResult
      ? rlsResult.verdict === 'PASS' ? chalk.green('✅ RLS: PASS')
        : chalk.red(`🔴 RLS: ${rlsResult.verdict}`)
      : '';

    if (driftLine) {
      console.log('\n' + driftLine);
      dashboard.log('\n' + driftLine.replace(/\u001b\[\d+m/g, ''), driftResult.verdict === 'CLEAN' ? 'green' : 'red');
    }
    if (rlsLine) {
      console.log(rlsLine);
      dashboard.log(rlsLine.replace(/\u001b\[\d+m/g, ''), rlsResult.verdict === 'PASS' ? 'green' : 'red');
    }
    console.log(chalk.green(`\n✅ Run complete. Reports in outputs/`));
    dashboard.log(`\n✅ Run complete. Reports in outputs/`, 'green', true);
  };

  dashboard.onTrigger(async (target: string) => {
    await executeRun(target);
  });

  // Initial run
  await executeRun();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
