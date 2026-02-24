# 🩺 Questerix Health Report

*Generated: 2/24/2026, 3:58:26 PM*

## Overall Health Score: 75/100

| Suite | Status | Duration |
| :--- | :--- | :--- |
| Unit Tests (Lib) | ✅ PASSED | 6.0s |
| Lint Check | ✅ PASSED | 3.9s |
| E2E Smoke (Desktop) | ✅ PASSED | 29.6s |
| Performance Bench | ❌ FAILED | 5.7s |

**Production Bundle**: 7427 KB

## ⚡ Performance Audit
**Uninstrumented hooks**: 16 missing `performance.mark`
- [ ] `features/curriculum/hooks/use-dashboard.ts`
- [ ] `features/curriculum/hooks/use-domains.ts`
- [ ] `features/curriculum/hooks/use-publish.ts`
- [ ] `features/curriculum/hooks/use-questions.ts`
- [ ] `features/curriculum/hooks/use-skills.ts`
- [ ] `features/curriculum/pages/version-history-page.tsx`
- [ ] `features/dashboard/pages/DashboardPage.tsx`
- [ ] `features/mentorship/hooks/use-groups.ts`
- [ ] `features/mentorship/pages/AssignmentCreatePage.tsx`
- [ ] `features/mentorship/pages/GroupDetailPage.tsx`
*... and 6 more*

## 🚨 Coverage Gaps
- [ ] Missing test for hook: hooks/use-debounce.ts
- [ ] Missing test for hook: hooks/use-unsaved-changes-guard.ts
- [ ] Missing test for hook: hooks/use-url-state.ts
- [ ] Missing E2E/Unit test for page: features/ai-assistant/pages/GenerationPage.tsx
- [ ] Missing E2E/Unit test for page: features/ai-assistant/pages/GovernancePage.tsx
- [ ] Missing E2E/Unit test for page: features/ai-assistant/pages/SessionsPage.tsx
- [ ] Missing E2E/Unit test for page: features/ai-content/pages/BulkImportPage.tsx
- [ ] Missing E2E/Unit test for page: features/auth/pages/AccountSettingsPage.tsx
- [ ] Missing E2E/Unit test for page: features/auth/pages/AuthConfirmPage.tsx
- [ ] Missing E2E/Unit test for page: features/auth/pages/InvitationCodesPage.tsx
- [ ] Missing E2E/Unit test for page: features/auth/pages/LoginPage.tsx
- [ ] Missing E2E/Unit test for page: features/auth/pages/UserManagementPage.tsx
- [ ] Missing test for hook: features/curriculum/hooks/use-dashboard.ts
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/ai-generator-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/dashboard-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/domain-create-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/domain-edit-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/domains-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/publish-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/question-create-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/question-edit-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/question-studio-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/questions-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/skill-create-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/skill-edit-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/skills-page.tsx
- [ ] Missing E2E/Unit test for page: features/curriculum/pages/version-history-page.tsx
- [ ] Missing E2E/Unit test for page: features/dashboard/pages/DashboardPage.tsx
- [ ] Missing test for hook: features/mentorship/hooks/use-groups.ts
- [ ] Missing E2E/Unit test for page: features/mentorship/pages/AssignmentCreatePage.tsx
- [ ] Missing E2E/Unit test for page: features/mentorship/pages/GroupCreatePage.tsx
- [ ] Missing E2E/Unit test for page: features/mentorship/pages/GroupDetailPage.tsx
- [ ] Missing E2E/Unit test for page: features/mentorship/pages/GroupsPage.tsx
- [ ] Missing test for hook: features/monitoring/hooks/use-known-issues-mutations.ts
- [ ] Missing test for hook: features/monitoring/hooks/use-known-issues.ts
- [ ] Missing E2E/Unit test for page: features/monitoring/pages/ErrorLogsPage.tsx
- [ ] Missing E2E/Unit test for page: features/monitoring/pages/KnownIssuesPage.tsx
- [ ] Missing E2E/Unit test for page: features/platform/pages/AppsPage.tsx
- [ ] Missing E2E/Unit test for page: features/platform/pages/LandingsPage.tsx
- [ ] Missing E2E/Unit test for page: features/platform/pages/SubjectsPage.tsx

---

## Failure Digest

### Performance Bench
```
[dotenv@17.2.3] injecting env (10) from .env.test.local -- tip: ✅ audit secrets and track compliance: https://dotenvx.com/ops
[dotenv@17.2.3] injecting env (0) from .env.test -- tip: 📡 add observability to secrets: https://dotenvx.com/ops
Error: No tests found.
Make sure that arguments are regular expressions matching test files.
You may need to escape symbols like "$" or "*" and quote the arguments.


```

