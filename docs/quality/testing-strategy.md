# Testing Strategy and Coverage

This document describes the testing approach across the mono-repo and how coverage is enforced.

## Targets

- Admin Panel (TypeScript + Vite)
  - Unit: Vitest with jsdom
  - Integration: React component + store + API adapter tests
  - E2E: Playwright (admin-panel-e2e.yml)
  - Coverage: global ≥80%; critical modules higher

- Tools/oracle-plus (TypeScript CLI)
  - Unit: Vitest for command parsers and side-effect boundaries (fs, process)
  - Coverage: global ≥80%

- Content Engine (Python)
  - Unit: pytest for parsers, validators, and generators (pure logic preferred)
  - Coverage: leverage .coveragerc; target ≥80%

- Student App (Flutter/Dart)
  - Unit: flutter test
  - Integration: integration_test (optional on PR, required on main/nightly)
  - Golden tests: deterministic assets and fonts
  - Coverage: flutter test --coverage

## Conventions

- Co-locate unit tests near source or use src/__tests__ (TS) and content-engine/tests (Python);
  Flutter under test/ and integration_test/.
- Use DI and interfaces; mock side effects.
- Contract tests for external services (Supabase adapters, HTTP clients).

## CI Commands

- TS: npm run test:ci (vitest --run --coverage)
- Python: pytest -q --cov
- Flutter: flutter test --coverage

## Artifacts

- Store coverage reports per workspace.
- Upload Playwright reports and screenshots for e2e failures.

## Gaps to Close

- Ensure test:ci scripts exist across all workspaces.
- Add smoke tests for tools/oracle-plus commands.
- Add baseline unit tests for content-engine parsers/generators.
- Stabilize Flutter golden tests with fonts and tolerances.
