# 📚 Project Best Practices

> ⚠️ **For Implementation Details**: This document provides high-level conventions. For comprehensive coding standards, test patterns, and the IDD Protocol, see **[docs/standards/ORACLE_COGNITION.md](./standards/ORACLE_COGNITION.md)**.


## 1. Project Purpose
Questerix is a multi-app learning platform combining:
- Admin Panel (TypeScript + Vite + Playwright/Vitest) for content and operations management
- Student App (Flutter/Dart) for the learner experience
- Content Engine (Python) for parsing documents and generating questions
- Supabase (SQL + Edge Functions) for database, auth, and serverless logic
- Shared scripts, CI/CD automations, and documentation to orchestrate releases and quality gates

The repository implements a feature-first, modular architecture with strong tooling for quality, security, and accessibility.

## 2. Project Structure
- Root (mono-repo orchestration)
  - package.json, tsconfig, dependency-cruiser configs, Makefile, tasks.json
  - CI workflows in .github/workflows
  - SECURITY.md, ROADMAP.md, ORACLE_DOCS.md, docs/*
- admin-panel/ (TypeScript, Vite, Tailwind, Playwright, Vitest)
  - src/ (feature-first organization)
  - tests/ and e2e via Playwright; vitest.config.ts; playwright.config.ts
- student-app/ (Flutter)
  - lib/, test/, integration_test/, platform-specific folders
  - ARCHITECTURE.md, REPOSITORY_GUIDE.md, accessibility guides
- content-engine/
  - src/generators/, src/parsers/, src/validators/ (Python modules)
- supabase/
  - migrations/, functions/, seed.sql, scripts/
- design-system/
  - tokens/, icons/, generators/, generated/ (source of truth for UI consistency)
- scripts/
  - migration utilities, validation scripts, knowledge-base tooling
- docs/
  - architecture, specs, reports, operational runbooks

Key entry points and configs:
- TypeScript: tsconfig.json, vite.config.ts, vitest.config.ts, tailwind.config.js
- Playwright: playwright.config.ts
- Python: content-engine/requirements.txt
- Dart/Flutter: analysis_options.yaml, pubspec.yaml
- Supabase: supabase/migrations, supabase/functions, wrangler.toml (if using edge workers)

## 3. Test Strategy
- Frameworks
  - Admin Panel: Vitest for unit tests; Playwright for e2e/visual tests
  - Student App: Flutter test + integration_test
  - Python: Prefer Pytest (align with requirements; add tests under content-engine/tests)
  - SQL/DB: Migration verification via scripts and CI checks
- Organization and naming
  - co-locate unit tests near source or under src/__tests__ for TS
  - Playwright e2e tests under tests/ with fixtures and page objects
  - Flutter tests under test/ and integration_test/ with descriptive names and golden tests where applicable
  - Python tests under content-engine/tests/ mirroring src package structure
- Mocking guidelines
  - Use dependency injection and interfaces for isolation (Vitest: vi.fn, spies; Flutter: mocktail or Mockito; Python: pytest-mock)
  - Prefer contract tests for external services and adapters
- Unit vs Integration
  - Unit: Pure logic, reducers, selectors, adapters, small components
  - Integration: Module boundaries (API + store + component), database migrations, auth flows
  - E2E: Critical user journeys, accessibility checks, visual regression
- Coverage expectations
  - Aim for 80%+ on core modules; higher for business-critical code (auth, payments, assessments)
  - Enforce thresholds in CI where supported

## 4. Code Style
- TypeScript (Admin Panel, tools)
  - Strict mode in tsconfig; favor explicit types for public APIs
  - Async/await over Promise chains; never ignore rejected promises
  - Use feature-first folders; maintain barrel files sparingly to avoid cyclic deps (enforced by dependency-cruiser)
  - Naming: kebab-case for file names, camelCase for variables/functions, PascalCase for components/types, UPPER_SNAKE for env constants
  - Styling via ESLint + Prettier; follow Tailwind utility-first best practices
  - Error handling: Typed error shapes; central error boundaries; never swallow errors in async handlers
- Flutter/Dart (Student App)
  - analysis_options.yaml rules enforced; prefer immutable models and const constructors
  - Use Riverpod (or chosen DI) for state management and dependency injection
  - Repository pattern between domain and data layers; DTOs separated from domain entities
  - Naming: PascalCase for types/widgets, lowerCamelCase for vars/functions, snake_case for files
  - Error handling: sealed classes/Results; surface friendly messages and log technical details
- Python (Content Engine)
  - Follow PEP8; type hints with mypy-friendly signatures where feasible
  - Pure functions for generators/parsers where possible; separate I/O from core logic
  - Use pydantic or dataclasses for schemas and validation (question_schema indicates schema-first)
  - Logging via standard logging module; avoid print in library code
  - Exceptions: Define custom exception types for parsing/validation/generation errors
- SQL/Supabase
  - Migration scripts are idempotent and reversible; keep schema changes small and reviewed
  - Prefer RLS with explicit policies; least-privilege on functions

## 5. Common Patterns
- Feature-first architecture for frontends; keep cross-cutting concerns in shared utilities
- Repository + Use Case (Service) layering in Flutter and TS where applicable
- Adapters for API/DB access; isolate side-effects behind interfaces for testability
- Validation at boundaries: schemas for inputs/outputs, type-safe API clients
- Dependency graphs monitored with dependency-cruiser; avoid circular deps and forbidden layers
- Design System as single source of truth: tokens generate CSS/Flutter resources; do not hardcode design values
- CI-as-documentation: workflows express quality gates (lint, type-check, tests, security scans)

## 6. Do's and Don'ts
- Do
  - Keep modules small and cohesive; enforce clear boundaries
  - Write tests alongside new code; update fixtures and mocks thoughtfully
  - Document public modules with concise READMEs or docstrings
  - Use environment variables through typed config loaders; validate eagerly
  - Run linters, type-checkers, and dependency-cruiser before committing
  - Maintain accessibility standards in UI; use semantic components and ARIA as needed
  - Prefer pure, deterministic functions for core domain logic
- Don't
  - Introduce cross-feature imports that violate the architecture graph
  - Commit credentials; use .secrets.template and CI secrets
  - Rely on flaky timers or sleeps in tests; use proper waits and test IDs
  - Swallow errors or return null for exceptional states; model them explicitly
  - Duplicate design tokens or styles outside the design-system

## 7. Tools & Dependencies
- Key libraries
  - Admin Panel: React/Vite, TypeScript, TailwindCSS, Vitest, Playwright, Dependency-Cruiser
  - Student App: Flutter, Riverpod (DI), Drift/Http clients as applicable
  - Content Engine: Python 3.x, pydantic/dataclasses, pytest (recommended)
  - Supabase: Postgres, SQL migrations, Edge Functions (Wrangler/Cloudflare if present)
- Setup
  - Node: Use npm ci; run lint, typecheck, test locally before PR
  - Flutter: flutter pub get; run flutter analyze and tests
  - Python: pip install -r content-engine/requirements.txt; add a virtualenv; run pytest
  - Database: apply migrations via scripts/apply-migrations.* and verify via CI scripts

## 8. Other Notes
- Keep docs in sync with behavior; docs/ contains architecture and reports that act as authoritative guides
- Prefer configuration-driven behavior; master-config.json/.staging.json suggest environment-based toggles
- When generating new code, follow existing directory conventions and naming schemes; co-locate tests
- For large changes, update dependency rules (.dependency-cruiser*) and CI workflows to reflect new boundaries
- Ensure accessibility, security, and performance checks are part of your definition of done