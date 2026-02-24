import chalk from 'chalk';
import * as fs from 'fs';
import open from 'open';
import * as path from 'path';
import { Analyst } from './src/analyst';
import { Dashboard } from './src/dashboard';
import { Historian } from './src/historian';
import { Orchestrator } from './src/orchestrator';
import { Reporter } from './src/reporter';
import { Scanner } from './src/scanner';

interface CortexConfig {
  adminPanelPath: string;
  outputs: any;
  thresholds: any;
  dashboardPort: number;
}

const configPath = path.join(__dirname, 'cortex.config.json');
const config: CortexConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Questerix Cortex — Initializing...'));
  
  const adminPath = path.resolve(__dirname, config.adminPanelPath);
  const srcPath = path.join(adminPath, 'src');

  // 1. Semantic Scan
  console.log(chalk.gray('🔍 Scanning app surface...'));
  const scanner = new Scanner(srcPath);
  const surfaceMap = scanner.scan();
  fs.writeFileSync(path.join(__dirname, config.outputs.surfaceMap), JSON.stringify(surfaceMap, null, 2));

  // 2. Start Dashboard
  const dashboard = new Dashboard(config.dashboardPort);
  await open(`http://localhost:${config.dashboardPort}`);

  // 3. Init Modules
  const orchestrator = new Orchestrator(adminPath);
  const reporter = new Reporter(__dirname, config.outputs);
  const analyst = new Analyst(srcPath);
  const historian = new Historian(path.join(__dirname, config.outputs.history), config.thresholds.maxHistoryRuns);

  // 4. Define Suites
  const suites = [
    { name: 'Unit Tests (Lib)', command: 'npx vitest run src/__tests__/lib/utils.test.ts' },
    { name: 'E2E Smoke (Desktop)', command: 'npx playwright test tests/auth-flow.e2e.spec.ts --project=desktop' },
    { name: 'Lint Check', command: 'npx eslint src/lib/utils.ts' }
  ];

  // 5. Run Suites
  for (const suite of suites) {
    dashboard.update(orchestrator.getResults());
    await orchestrator.runSuite(suite.name, suite.command);
    dashboard.update(orchestrator.getResults());
  }

  // 6. Analysis
  console.log(chalk.gray('🧪 Running Analyst...'));
  const deadCode = analyst.findDeadCode().slice(0, 10); // Limit for speed in demo
  const analystResults = { deadCode };

  // 7. Finalize & Record
  console.log(chalk.cyan.bold('\n🏁 Run Complete. Generating reports...'));
  
  const results = orchestrator.getResults();
  reporter.generate(results, surfaceMap, analystResults);
  
  const allResults = Object.values(results);
  const passed = allResults.filter(r => r.status === 'passed').length;
  historian.record({
    date: new Date().toISOString(),
    score: Math.round((passed / allResults.length) * 100),
    coverage: 0, // Future: parse coverage from vitest
    failures: allResults.length - passed
  });

  console.log(chalk.green(`\n✅ AGENT_CONTEXT.md updated.`));
  console.log(chalk.green(`✅ NEXT_TASK.md updated.`));
  console.log(chalk.green(`✅ HEALTH_REPORT.md updated.`));

  setTimeout(() => {
    console.log(chalk.gray('\nCortex background tasks finished. Exiting.'));
    process.exit(0);
  }, 5000);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
