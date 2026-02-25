# 🩺 Questerix Health Report

_Generated: 2/25/2026, 9:47:29 AM_

## Overall Health Score: 100/100

| Suite               | Status    | Duration |
| :------------------ | :-------- | :------- |
| Unit Tests (Lib)    | ✅ PASSED | 12.7s    |
| Lint Check          | ✅ PASSED | 9.1s     |
| E2E Smoke (Desktop) | ✅ PASSED | 53.1s    |

**Production Bundle**: 7427 KB

## 🧪 Type Safety Audit

**Unsafe Casts**: 16 detected (as any/unknown)

- [ ] `features/ai-assistant/pages/GovernancePage.tsx:64: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/auth/pages/LoginPage.tsx:196: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/components/domain-list.tsx:704: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/pages/question-studio-page.tsx:236: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/pages/question-studio-page.tsx:241: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/pages/question-studio-page.tsx:248: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/pages/question-studio-page.tsx:251: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/pages/question-studio-page.tsx:252: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/pages/question-studio-page.tsx:254: Unsafe cast found ('as any' or 'as unknown')`
- [ ] `features/curriculum/pages/question-studio-page.tsx:255: Unsafe cast found ('as any' or 'as unknown')`
      _... and 6 more_

## 🔒 RLS Audit

**Verdict**: PASS

| Table                  | Missing Policies       | Verdict                  | Severity |
| :--------------------- | :--------------------- | :----------------------- | :------- |
| `ai_token_usage`       | DELETE, INSERT, UPDATE | 🔵 Intentional (Service) | info     |
| `generation_audit_log` | DELETE, INSERT, UPDATE | 🔵 Intentional (Service) | info     |
| `profiles`             | DELETE, INSERT         | 🔵 Intentional (Student) | info     |

---

## Failure Digest

✅ No failures. System stable.
