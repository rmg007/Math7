# CI Contract

This document describes what Continuous Integration (CI) enforces for this repository and how it relates to local commands.

## Sources of truth

CI behavior is defined in:

- `.github/workflows/ci.yml`
- `.github/workflows/validate.yml`

Local commands are defined in:

- `Makefile`
- `scripts/validate-phase-*.sh|ps1`
- `scripts/common.sh`

## What CI runs

### CI workflow: build/lint/test

From `.github/workflows/ci.yml`:

- **Flutter**
  - `flutter pub get`
  - `flutter analyze`
  - `flutter test`

- **Admin Panel**
  - `npm ci`
  - `npm run lint`
  - `npm run build`

### Validation workflow: phase scripts

From `.github/workflows/validate.yml`:

- Runs with `STRICT=1`.
- Executes:
  - `./scripts/validate-phase--1.sh`
  - `./scripts/validate-phase-0.sh`
  - `./scripts/validate-phase-1.sh` (expects Docker + Supabase)
  - `./scripts/validate-phase-2.sh`
  - `./scripts/validate-phase-3.sh`
- Separately executes:
  - `./scripts/validate-phase-4.sh` (Android build)

## Strict mode (`STRICT`)

Validation scripts support a `STRICT` environment variable (see `scripts/common.sh`).

- **Local / default (`STRICT` unset)**:
  - The scripts may **SKIP** certain checks if prerequisites are missing (e.g., no Docker, missing Android SDK).
  - A skip exits successfully (exit code 0) but prints `SKIPPED: <reason>`.

- **CI / strict (`STRICT=1`)**:
  - Skips become **hard errors** (exit code 1).

## Logs / artifacts

Validation scripts write logs to:

- `artifacts/validation/phase-<N>.log`

The GitHub Actions validation workflow uploads these logs as build artifacts.

## Local equivalents

The Makefile provides canonical local equivalents:

- CI-like gate run:
  - `make ci`
- Phase validations:
  - `make validate_phase_0`
  - `make validate_phase_1`
  - `make validate_phase_2`
  - `make validate_phase_3`
  - `make validate_phase_4`

## Notes on Phase 4 (Android)

Phase 4 includes an Android build check and requires:

- `ANDROID_SDK_ROOT` or `ANDROID_HOME` to be set
- Android platform packages for API 36

If these are missing and `STRICT` is not set, the script may skip; in CI (strict), it fails.
