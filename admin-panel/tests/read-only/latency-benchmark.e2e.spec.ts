import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { login, TEST_USERS } from '../test-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Latency Benchmark (Cortex Telemetry) @logic', () => {
  test('Analyze P50/P95 load times for core modules @logic', async ({ page }) => {
    // 1. Login as Super Admin to access all modules
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

    const metrics: Array<{ name: string; duration: number }> = [];

    const collectMetrics = async (name: string) => {
      // Get measures from browser performance API
      const measures = await page.evaluate((markName) => {
        return performance.getEntriesByName(markName).map((m) => ({
          name: m.name,
          duration: m.duration,
        }));
      }, name);
      metrics.push(...measures);
    };

    // 2. Benchmark /apps
    console.log('Benchmarking /apps...');
    await page.goto('/apps');
    await expect(page.getByTestId('admin-header-title')).toContainText(/Applications/i);
    // Wait for the query to finish (marks are created in useApps)
    await page.waitForTimeout(2000);
    await collectMetrics('useApps');

    // 3. Benchmark /domains
    console.log('Benchmarking /domains...');
    await page.goto('/domains');
    await expect(page.getByTestId('admin-header-title')).toContainText(/Domains/i);
    await page.waitForTimeout(2000);
    await collectMetrics('usePaginatedDomains:1');
    await collectMetrics('useDomains');

    // 4. Benchmark /questions
    console.log('Benchmarking /questions...');
    await page.goto('/questions');
    await expect(page.getByTestId('admin-header-title')).toContainText(/Question Bank/i);
    await page.waitForTimeout(2000);
    await collectMetrics('usePaginatedQuestions:1:all');

    // 5. Generate Report
    console.log('\n--- Latency Benchmark Results ---');
    console.table(metrics);

    // Save results to a file for Cortex integration
    const resultsPath = path.resolve(
      __dirname,
      '../../questerix-cortex/outputs/LATENCY_METRICS.json'
    );
    fs.writeFileSync(resultsPath, JSON.stringify(metrics, null, 2));

    console.log(`\nResults saved to ${resultsPath}`);
  });
});