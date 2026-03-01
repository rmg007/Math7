# Questerix Code Review Standards (AI-First)

This document defines the quality gates for the Questerix platform. These rules are enforced by the **CodiumAI PR-Agent** (Automated Reviewer) and implemented by the **AI Coding Agent** (Fixer).

## 1. Tenant Isolation (CRITICAL)

Questerix is a multi-tenant "Dynamic Singleton" platform. Data leakage is our highest risk.

- **Database**: All queries to `profiles`, `apps`, `subjects`, `domains`, etc., MUST include a filter on `app_id` or `id`.
- **RLS**: Any new table MUST have a corresponding Row Level Security policy in `supabase/schema_master.sql`.
- **Client-Side**: The `admin-panel` must never expose `service_role` keys.

## 2. Architectural Integrity

- **TypeScript (Admin)**:
  - Zero `any` usage. Use concrete types or `as unknown as Type` for Supabase bridges.
  - Hooks must reside in `admin-panel/src/hooks/` and follow `use-*.ts`.
  - Components must be standardized via `admin-panel/src/components/ui/` (shadcn).
- **Dart (Student)**:
  - Follow the Repository pattern for all data access.
  - Ensure offline-first logic uses the `Tombstone` pattern for deletions.
  - Batch sync operations are mandatory for curriculum data.

## 3. Security & Secrets

- No hardcoded API keys, even for "Public" services.
- Always use `env.ts` (Admin) or `config.dart` (Student) for environment variables.
- Check for path traversal risks in file-handling logic.

## 4. Testability & Quality Infrastructure

- **Unit Tests**: Required for all non-trivial logic (Services, Utils, Repositories).
- **AI Validation**: AI content generators (e.g., `document_parser`, `question_generator`) MUST be tested with real inputs/outputs to catch "Model Drift."
- **Edge Functions**: Logic involving AI outputs must have unit tests with mocked AI responses to ensure schema integrity.
- **E2E tests (Playwright)**: Must cover the "Happy Path" and the "Security Surface" for all new features.
- **DAST (Dynamic Security)**: Running applications must undergo periodic DAST scanning (e.g., OWASP ZAP) for runtime vulnerabilities (XSS, Injection).
- **Performance (LHCI)**: All PRs must pass Lighthouse CI thresholds for Performance, Accessibility, and SEO to prevent UX regressions.
- **Coverage Gates**: Minimum code coverage thresholds (starting at 50%) are enforced in CI for core modules.

## 5. Implementation Workflow (Reviewer-Fixer Loop)

1.  **Code submitted** via Pull Request.
2.  **CodiumAI PR-Agent** performs a logical audit and posts comments.
3.  **Local AI Agent** (Antigravity) ingests PR comments and implements fixes locally.
4.  **Fixes pushed** to the PR.
5.  **Merge** only occurs when AI Reviewer gives an "LGTM" and all CI checks pass.
