# Dependency Boundaries and Architecture Rules

We enforce modular, feature-first architecture via dependency-cruiser for TypeScript projects and documented layering for Flutter and Python.

## TypeScript (admin-panel, tools/oracle-plus)

- Rules defined in .dependency-cruiser.* config files.
- No circular dependencies.
- Avoid cross-feature imports that violate layering; use adapters and interfaces for boundaries.
- CI runs dependency graph checks and fails on violations.

Run locally:

- npm run dep:check

## Flutter/Dart

- Repository + Use Case (Service) layering between domain and data.
- Use DI (e.g., Riverpod) to isolate dependencies for testing.
- Keep DTOs separate from domain entities; avoid platform-specific imports in domain.

## Python (Content Engine)

- Pure functions for core logic; isolate I/O in adapters.
- Use dataclasses/pydantic for schemas; keep generators, parsers, validators modular.

## Rationale

- Maintainability: small, cohesive modules.
- Testability: pure logic where possible, side effects isolated.
- Evolution: boundaries allow replacing implementations without ripple effects.

## CI Artifacts

- Dependency graph reports (HTML/JSON) uploaded for violations triage.
