# Hand-Off Prompt for Claude

**Instructions for the User:**
Copy the text below and paste it to Claude (or use your Claude CLI to process this). Do NOT run any commands manually—Claude must use `ops_runner.py` for execution.

---

**Context for Claude:**
We are continuing work on the Questerix mono-repo (React Admin Panel + Supabase + Cortex Intelligence). All previous unused export cleanup tasks are completed, but we have a few failing smoke tests and optimization warnings that need to be addressed before the final push.

**Your Tasks:**

1. **Fix Failing Smoke Tests (`admin-panel/tests/read-only/`)**:
   - `curriculum-pages.smoke.spec.ts:117` -> `SkillsPage @smoke › New Skill link is visible @smoke` failed. It is looking for `page.getByRole('link', { name: /New Skill/i })` on the `/skills` page. The button is defined inside `admin-panel/src/features/curriculum/components/skill-list.tsx` but is seemingly not passing Playwright's visibility/role check (maybe due to the `AdminHeader` layout or the icon spacing).
   - `dashboard-page.smoke.spec.ts:118` -> `DashboardPage @smoke › charts section renders Activity AreaChart and Question Types PieChart @smoke` failed. It expects `page.getByText('Activity')` and `'Question Types'`. There may be multiple matches or structure changes inside `admin-panel/src/features/dashboard/pages/DashboardPage.tsx` preventing Playwright from finding these correctly.

2. **Fix Performance Auditor Warning (`questerix-cortex`)**:
   - Running `npm run health` inside `questerix-cortex` triggers the Optimize Auditor, which flags `dart` zombie processes (Flutter SDK processes not used in the React admin panel) and gives a `⚠️ NEEDS ATTENTION` verdict.
   - Clean up the environment by stopping any running `dart.exe` or `node.exe` zombie processes that might conflict, using PowerShell (`Stop-Process -Name dart -Force -ErrorAction SilentlyContinue`).

**Strict Constraints:**

- **Admin Panel Feature Freeze**: You may ONLY fix the tests by updating the locators or minor tweaks to ensure stability. DO NOT add new features to `admin-panel/`.
- **Turbo Mode & Automation**: The IDE blocks normal terminal execution. For ALL terminal commands, write an array of tasks to `tasks.json` and execute `python ops_runner.py tasks.json`.
- Remember to use the Research-First Protocol if Playwright locators behave unexpectedly.
