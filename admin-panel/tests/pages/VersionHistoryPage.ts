import { Page, expect } from '@playwright/test';

export class VersionHistoryPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/versions');
    await expect(this.page).toHaveURL(/\/versions/);
    // Wait for the table row to appear or the "no history" state
    await this.page.locator('tr, .text-gray-500:has-text("No version history")').first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getLatestVersionNumber() {
    const versionBadge = this.page.locator('tr').first().locator('td').first().locator('.text-purple-700');
    try {
      await versionBadge.waitFor({ state: 'visible', timeout: 5_000 });
      const text = await versionBadge.innerText();
      return parseInt(text.replace('v', ''), 10);
    } catch (e) {
      console.warn('No version found in history table.');
      return 0;
    }
  }

  async getLatestSnapshotCounts() {
    const row = this.page.locator('tbody tr').first();
    const domains = await row.locator('td').nth(2).innerText();
    const skills = await row.locator('td').nth(3).innerText();
    const questions = await row.locator('td').nth(4).innerText();
    
    return {
      domains: parseInt(domains, 10),
      skills: parseInt(skills, 10),
      questions: parseInt(questions, 10),
    };
  }
}
