#!/usr/bin/env node
/**
 * generate-test-report.js
 *
 * QA Health Dashboard Generator
 *
 * Reads JSON outputs from:
 *   - Vitest (admin-panel/coverage/coverage-summary.json)
 *   - Playwright (admin-panel/playwright-report/results.json)
 *
 * Generates:
 *   - docs/reports/TEST_COVERAGE.md — Markdown summary for humans + CI
 *
 * Usage:
 *   node scripts/generate-test-report.js
 *
 * CI Usage (in GitHub Actions after test jobs):
 *   node scripts/generate-test-report.js --ci
 *
 * The --ci flag causes the script to exit with code 1 if any configured
 * threshold is not met, so CI can fail the pipeline.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const CI_MODE = process.argv.includes('--ci');

// ---------------------------------------------------------------------------
// Thresholds (edit here to tighten coverage gates)
// ---------------------------------------------------------------------------
const THRESHOLDS = {
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function pct(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function badge(value, threshold) {
  if (value >= threshold + 10) return '🟢';
  if (value >= threshold) return '🟡';
  return '🔴';
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

// ---------------------------------------------------------------------------
// Parse Vitest coverage report
// ---------------------------------------------------------------------------
function parseVitestCoverage() {
  const coveragePath = join(ROOT, 'admin-panel', 'coverage', 'coverage-summary.json');
  const data = readJson(coveragePath);
  if (!data || !data.total) {
    return { available: false };
  }

  const { statements, branches, functions, lines } = data.total;
  return {
    available: true,
    statements: pct(statements.covered, statements.total),
    branches: pct(branches.covered, branches.total),
    functions: pct(functions.covered, functions.total),
    lines: pct(lines.covered, lines.total),
    raw: { statements, branches, functions, lines },
  };
}

// ---------------------------------------------------------------------------
// Parse Playwright results report (JSON reporter output)
// ---------------------------------------------------------------------------
function parsePlaywrightResults() {
  const reportPath = join(ROOT, 'admin-panel', 'playwright-report', 'results.json');
  const data = readJson(reportPath);

  if (!data) {
    return { available: false };
  }

  // Playwright JSON report format varies — handle both common structures
  const suites = data.suites ?? data.results ?? [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures = [];

  function walk(suite) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests ?? []) {
          const status = test.results?.[0]?.status ?? test.status;
          if (status === 'passed') passed++;
          else if (status === 'failed') {
            failed++;
            failures.push(`${spec.file ?? ''}::${spec.title}`);
          } else if (status === 'skipped' || status === 'pending') {
            skipped++;
          }
        }
      }
    }
    if (suite.suites) suite.suites.forEach(walk);
  }

  suites.forEach(walk);

  // Fallback: top-level stats if the suite walk found nothing
  if (passed === 0 && failed === 0) {
    passed = data.stats?.expected ?? 0;
    failed = data.stats?.unexpected ?? 0;
    skipped = data.stats?.skipped ?? 0;
  }

  return {
    available: true,
    passed,
    failed,
    skipped,
    total: passed + failed + skipped,
    failures: failures.slice(0, 10), // cap at 10
  };
}

// ---------------------------------------------------------------------------
// Generate Markdown report
// ---------------------------------------------------------------------------
function generateReport(vitest, playwright) {
  const lines = [];
  let failCount = 0;

  lines.push('# QA Health Dashboard');
  lines.push('');
  lines.push(`**Generated**: ${now()}`);
  lines.push('');

  // ── Unit Coverage ─────────────────────────────────────────────────────────
  lines.push('## Unit Test Coverage (Vitest)');
  lines.push('');

  if (!vitest.available) {
    lines.push('> ⚠️ Coverage report not found. Run `npm run test:ci` in `admin-panel/` first.');
  } else {
    const metrics = ['statements', 'branches', 'functions', 'lines'];
    lines.push('| Metric | Coverage | Threshold | Status |');
    lines.push('|--------|----------|-----------|--------|');
    for (const m of metrics) {
      const val = vitest[m];
      const thr = THRESHOLDS[m];
      const icon = badge(val, thr);
      if (val < thr) failCount++;
      lines.push(`| ${m.charAt(0).toUpperCase() + m.slice(1)} | ${val}% | ${thr}% | ${icon} |`);
    }
  }

  lines.push('');

  // ── E2E Results ───────────────────────────────────────────────────────────
  lines.push('## E2E Test Results (Playwright)');
  lines.push('');

  if (!playwright.available) {
    lines.push('> ⚠️ Playwright results not found. Run `npx playwright test` first.');
  } else {
    const { passed, failed: e2eFailed, skipped, total, failures } = playwright;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const statusIcon = e2eFailed === 0 ? '✅' : '❌';

    lines.push(`${statusIcon} **${passed}/${total} tests passing** (${skipped} skipped)`);
    lines.push('');
    lines.push(`| Result | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| ✅ Passed | ${passed} |`);
    lines.push(`| ❌ Failed | ${e2eFailed} |`);
    lines.push(`| ⏭️ Skipped | ${skipped} |`);
    lines.push(`| Pass Rate | ${passRate}% |`);

    if (e2eFailed > 0) {
      failCount++;
      lines.push('');
      lines.push('### Failed Tests');
      lines.push('');
      for (const f of failures) {
        lines.push(`- ❌ \`${f}\``);
      }
      if (playwright.failures.length === 10) {
        lines.push('- _(more failures not shown — check playwright-report/index.html)_');
      }
    }
  }

  lines.push('');

  // ── Summary ───────────────────────────────────────────────────────────────
  lines.push('## Summary');
  lines.push('');
  if (failCount === 0) {
    lines.push('> 🟢 **All thresholds met.** Healthy for deployment.');
  } else {
    lines.push(`> 🔴 **${failCount} threshold(s) not met.** Address before deploying.`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('_Auto-generated by `scripts/generate-test-report.js`. Do not edit manually._');

  return { markdown: lines.join('\n'), failCount };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const vitestData = parseVitestCoverage();
const playwrightData = parsePlaywrightResults();
const { markdown, failCount } = generateReport(vitestData, playwrightData);

// Ensure output directory exists
const outputDir = join(ROOT, 'docs', 'reports');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const outputPath = join(outputDir, 'TEST_COVERAGE.md');
writeFileSync(outputPath, markdown, 'utf8');
console.log(`✅ QA report written to docs/reports/TEST_COVERAGE.md`);

if (CI_MODE && failCount > 0) {
  console.error(`❌ ${failCount} coverage threshold(s) not met. Failing CI.`);
  process.exit(1);
}
