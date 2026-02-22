# Test Owners and Coverage Map

This document maps E2E spec files to functional components and the primary user personas they validate.

---

## E2E Ownership (Playwright)

| Spec File                          | Functional Domain               | Primary Persona              | CI Priority |
| :--------------------------------- | :------------------------------ | :--------------------------- | :---------- |
| `auth-flow.e2e.spec.ts`            | Authentication & Registration   | Guest / New User             | P0 (Smoke)  |
| `rbac-guards.e2e.spec.ts`          | Authorization & Role Guards     | Standard Admin / Super Admin | P0 (Smoke)  |
| `curriculum-lifecycle.e2e.spec.ts` | Curriculum (CRUD + Publish)     | Standard Admin (Editor)      | P0 (Smoke)  |
| `mentor-hub.e2e.spec.ts`           | Mentor Groups & Students        | Mentor                       | P1 (Full)   |
| `rls-bypass.e2e.spec.ts`           | Security & Database RLS         | System / Admin               | P1 (Full)   |
| `bulk-import.e2e.spec.ts`          | Data Import (Excel/CSV)         | Standard Admin               | P1 (Full)   |
| `apps.e2e.spec.ts`                 | Platform Config & Landing Pages | Super Admin                  | P1 (Full)   |
| `accessibility.spec.ts`            | Global Accessibility (WCAG 2.1) | All Personas                 | P1 (Full)   |
| `responsiveness.spec.ts`           | Responsive Layout Optimization  | All Personas                 | P1 (Full)   |
| `admin-panel.e2e.spec.ts`          | Legacy Platform Management      | Developer / Admin            | P1 (Full)   |

---

## Component Mapping (POM Abstraction)

| POM Class       | Component Source                                       | Used By Specs                         |
| :-------------- | :----------------------------------------------------- | :------------------------------------ |
| `LoginPage`     | `src/features/auth/`                                   | `auth-flow`, `rbac-guards`            |
| `DomainsPage`   | `src/features/curriculum/components/domain-list.tsx`   | `curriculum-lifecycle`, `admin-panel` |
| `SkillsPage`    | `src/features/curriculum/components/skill-list.tsx`    | `curriculum-lifecycle`                |
| `QuestionsPage` | `src/features/curriculum/components/question-list.tsx` | `curriculum-lifecycle`                |
| `GroupsPage`    | `src/features/mentorship/`                             | `mentor-hub`                          |
| `PublishPage`   | `src/features/curriculum/components/publish-page.tsx`  | `curriculum-lifecycle`                |

---

## Test Persona Definitions

- **System**: Validates cross-cutting concerns (RLS, security headers).
- **Guest**: Logged-out state, landing pages, registration.
- **Super Admin**: Full platform access, landing page registry, AI governance.
- **Standard Admin**: Curriculum editor, mentor group manager, report viewer.
- **Mentor**: Student management, assignment tracking (limited to assigned groups).
- **Student**: Practice engine, quiz navigation, progress tracking (Student App).
