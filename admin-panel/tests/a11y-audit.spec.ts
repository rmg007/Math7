import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TEST_USERS } from './test-utils';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test.local') });

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#login-email', TEST_USERS.SUPER_ADMIN.email);
  await page.fill('#login-password', TEST_USERS.SUPER_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1500);
}

const pages = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Domains', path: '/domains' },
  { name: 'Questions', path: '/questions' },
  { name: 'Bulk Import', path: '/ai-import' },
];

test('Audit all pages', async ({ page }) => {
  await login(page);

  const report: string[] = ['# Accessibility Audit Report\n'];

  for (const p of pages) {
    await page.goto(p.path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    report.push(`## ${p.name} (${p.path})`);
    report.push(`Total violations: ${results.violations.length} | Critical/Serious: ${serious.length}\n`);

    for (const v of serious) {
      report.push(`### [${v.impact?.toUpperCase()}] ${v.id}`);
      report.push(`**${v.description}**`);
      report.push(`Help: ${v.helpUrl}\n`);
      report.push('Affected elements:');
      for (const node of v.nodes.slice(0, 5)) {
        report.push(`- \`${node.html.slice(0, 120)}\``);
        report.push(`  Fix: ${node.failureSummary}`);
      }
      report.push('');
    }
    report.push('---\n');
  }

  fs.writeFileSync(path.resolve(__dirname, '..', 'a11y-report.md'), report.join('\n'));
  console.log(report.join('\n'));
});
