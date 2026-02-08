# CI/CD Operational Guide

This document explains the repository workflows, required checks, caching, job dependencies, and failure triage.

## Workflow Structure

- ci.yml (main quality gates):
  - TypeScript (admin-panel, tools/oracle-plus): lint, type-check, unit tests with coverage, dependency graph checks.
  - Python (content-engine): pytest with coverage.
  - Flutter (student-app): flutter analyze, unit tests with coverage.
  - Design System: token generation drift verification.
  - Quick DB Lint: lightweight schema/migration validation (complements database.yml).
- database.yml: Full migration application on ephemeral DB and schema verification.
- admin-panel-e2e.yml: Playwright e2e and visual tests.
- security.yml: Semgrep security scanning with SARIF upload for code scanning.
- deepsource.yml/docs-index.yml/validate.yml: repository-specific automations and docs indexing.

## Concurrency and Permissions

- Concurrency: group by workflow + ref to cancel superseded runs.
- Permissions:
  - contents: read (default)
  - security-events: write (security.yml only)

## Caching Strategy

- Node: actions/setup-node@v4 with npm ci; cache by lockfile hash.
- Python: pip cache keyed by requirements.txt.
- Flutter: pub cache keyed by pubspec.lock; flutter SDK via subosito/flutter-action@v2.

## Required Checks

- Lint/Typecheck/Test for each workspace.
- Dependency graph checks (dependency-cruiser) for TS projects.
- Security scan (Semgrep) on PRs.
- Database migration verification (database.yml) on PRs and pushes to main.

## Running Locally

- Node:
  - npm ci
  - npm run lint && npm run typecheck && npm run test:ci
  - npm run dep:check (where available)
- Python:
  - python -m venv .venv && source .venv/bin/activate (or .venv\Scripts\activate on Windows)
  - pip install -r content-engine/requirements.txt
  - pytest -q --cov
- Flutter:
  - flutter pub get
  - flutter analyze
  - flutter test --coverage
- Supabase:
  - Scripts in scripts/; see docs/supabase/migrations-ci.md

## Failure Triage

- Lint/Typecheck: fix reported files; for TS types, prefer explicit public types.
- Tests: reproduce locally; check coverage report to add tests; avoid flakiness.
- Dependency graph: inspect report; remove forbidden imports or add allowed exceptions with justification.
- Security: review Semgrep alerts; fix or add justified suppressions in semgrep.yml.
- Database: inspect migration logs; ensure idempotent and reversible scripts; verify RLS.
- Design system: run generator and commit updated generated assets.

## Artifacts

- Coverage: stored per language as artifacts.
- Dependency graph: HTML/JSON uploaded.
- Security: SARIF uploaded to code scanning.
- DB: migration logs and schema diffs.
