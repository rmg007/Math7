# Test Decisions Record (TDR)

This document tracks key architectural decisions regarding the Questerix testing strategy and infrastructure. It follows the ADR (Architecture Decision Record) pattern.

---

## TDR-001: Dedicated Test Database Environment

- **Status**: Accepted
- **Date**: 2026-02-21
- **Decided by**: Oracle/Antigravity
- **Context**: Running E2E tests against the production development database causes data corruption and transient failures due to shared state.
- **Decision**:
  - Establish a dedicated Supabase project `QuesterixDB-test` for CI/CD and E2E testing.
  - All test-critical environment variables must be prefixed with `TEST_` (e.g., `TEST_VITE_SUPABASE_URL`).
  - Use `supabase db push` to synchronize the schema from production to test before running suites.
- **Consequences**:
  - Increased isolation and reliability of tests.
  - Requires maintaining secrets for a second Supabase project in GitHub Actions.
  - Prevents accidental deletion of production dev data.

## TDR-002: Serialized CI Execution for Shared Resources

- **Status**: Accepted
- **Date**: 2026-02-21
- **Decided by**: Oracle/Antigravity
- **Context**: Parallel E2E jobs targeting the same test database project cause race conditions (e.g., one test deletes a domain while another is trying to edit it).
- **Decision**:
  - Use GitHub Actions `concurrency:` groups keyed by branch name for all jobs that interact with the test database.
  - Enforce `cancel-in-progress: false` to ensure queueing rather than aborting.
- **Consequences**:
  - Longer total CI time for multiple concurrent PRs.
  - 100% elimination of database-related flakiness in E2E suites.

## TDR-003: 3-Layer Page Object Model (POM) Abstraction

- **Status**: Accepted
- **Date**: 2026-02-21
- **Decided by**: Antigravity
- **Context**: Playwright tests were becoming difficult to maintain due to duplicated selector logic and complex action sequences (e.g., logging in).
- **Decision**:
  - Adopt a 3-layer architecture for E2E:
    1. **Fixtures**: Standardized data (Zod-validated).
    2. **POM (Page Objects)**: Encapsulated selectors and low-level page interactions.
    3. **Actions Layer**: High-level semantic operations (e.g., `publishCurriculum()`).
- **Consequences**:
  - Better reuse of logic across specs.
  - Tests read like user journeys rather than code scripts.
  - Decouples test intent from UI implementation details.

## TDR-004: Automated Quality Dashboard

- **Status**: Accepted
- **Date**: 2026-02-21
- **Decided by**: Antigravity
- **Context**: Coverage information was fragmented across multiple tools (Vitest, Playwright, Flutter LCOV).
- **Decision**:
  - Implement a unified health reporter (`scripts/generate-test-report.js`).
  - Combine coverage from all layers (Web, Mobile, DB, API) into a single `docs/reports/TEST_COVERAGE.md` file.
  - Failure to meet aggregate thresholds (e.g., 70% total) fails the CI pipeline.
- **Consequences**:
  - Single source of truth for overall platform quality.
  - Motivates coverage improvement.

## TDR-005: Dual-DB Configuration Logic (env.ts)

- **Status**: Accepted
- **Date**: 2026-02-21
- **Decided by**: Oracle/Antigravity
- **Context**: The Admin Panel needs to switch between Production/Dev and Test databases dynamically based on the execution context.
- **Decision**:
  - Refactor `admin-panel/src/lib/env.ts` to implement a hierarchy:
    - If `import.meta.env.MODE === 'test'`, prioritize `TEST_` prefixed variables.
    - Otherwise, fallback to standard production/dev variables.
- **Consequences**:
  - Automated environment switching without manual config changes.
  - Simplifies local debugging of E2E failures.
