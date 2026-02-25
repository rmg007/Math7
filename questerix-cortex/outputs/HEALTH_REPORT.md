# 🩺 Questerix Health Report

*Generated: 2/25/2026, 7:50:39 AM*

## Overall Health Score: 100/100

| Suite | Status | Duration |
| :--- | :--- | :--- |
| Unit Tests (Lib) | ✅ PASSED | 18.6s |
| Lint Check | ✅ PASSED | 4.9s |
| E2E Smoke (Desktop) | ✅ PASSED | 68.7s |

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

## 🧪 Type Safety Audit
**Unsafe Casts**: 34 detected (as any/unknown)
- [ ] `features/ai-assistant/pages/GovernancePage.tsx:64: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/auth/pages/LoginPage.tsx:196: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/domain-list.tsx:704: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/question-form.tsx:126: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/question-form.tsx:149: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/question-form.tsx:151: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/question-form.tsx:153: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/question-form.tsx:155: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/question-form.tsx:157: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/question-form.tsx:159: Unsafe cast found ('as any' or 'as unknown')`
*... and 24 more*

---

## Failure Digest

✅ No failures. System stable.
