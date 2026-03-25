# Multi-Repo Delivery Plan (Questerix Ecosystem)

> Strategy-only document. No implementation.
> Generated from deep analysis of all four repositories on 2026-03-25.

---

## Table of Contents

1. [Ecosystem Overview](#1-ecosystem-overview)
2. [Current Pain Points (Evidence-Based)](#2-current-pain-points-evidence-based)
3. [Architecture: Keep 4 Repos, Fix Coordination](#3-architecture-keep-4-repos-fix-coordination)
4. [Type and Contract Drift Elimination](#4-type-and-contract-drift-elimination)
5. [CI/CD Overhaul: Fast Lane / Full Lane](#5-cicd-overhaul-fast-lane--full-lane)
6. [Local Developer Experience](#6-local-developer-experience)
7. [Testing Strategy Simplification](#7-testing-strategy-simplification)
8. [Deployment Pipeline Improvements](#8-deployment-pipeline-improvements)
9. [Documentation and Process Reduction](#9-documentation-and-process-reduction)
10. [Broken or Misaligned Workflows to Fix](#10-broken-or-misaligned-workflows-to-fix)
11. [Release Cadence and Integration Model](#11-release-cadence-and-integration-model)
12. [Metrics to Track](#12-metrics-to-track)
13. [30-Day Rollout Plan](#13-30-day-rollout-plan)
14. [Decision Log Template](#14-decision-log-template)

---

## 1. Ecosystem Overview

| Repo                      | Stack                                 | Deploy Target               | CI Workflows     | Approx. Code Files                                               | Change Frequency      |
| ------------------------- | ------------------------------------- | --------------------------- | ---------------- | ---------------------------------------------------------------- | --------------------- |
| `Questerix`               | React/Vite + Supabase + Python + Deno | Cloudflare Pages + Supabase | **48** workflows | ~37 pages, 66 test files, 10 edge functions, 2222-line type file | High (daily)          |
| `questerix-student-app`   | Flutter/Dart + Drift + Supabase       | Cloudflare Pages (web)      | **2** workflows  | 119 source files, 57 test files, 38 generated files              | High (daily)          |
| `questerix-landing-pages` | React/Vite                            | Cloudflare Pages            | **0** workflows  | 11 source files                                                  | Low (campaign bursts) |
| `questerix-help-docs`     | VitePress                             | Cloudflare Pages            | **3** workflows  | 22 markdown files                                                | Low (post-release)    |

### Cross-Repo Coupling Points

| Coupling              | Source                            | Consumer                        | Current Mechanism                  | Risk           |
| --------------------- | --------------------------------- | ------------------------------- | ---------------------------------- | -------------- |
| Database types        | Supabase schema                   | Admin panel, Student app        | Manual typegen to 2+ locations     | **High drift** |
| Environment config    | `master-config.json` + `.secrets` | All apps via `generate-env.ps1` | File-based, manual                 | Medium         |
| Deploy orchestration  | `orchestrator.ps1`                | Admin + Student (sibling path)  | PowerShell, assumes folder layout  | Medium         |
| Design tokens         | `Questerix/packages/core`         | Landing pages (manual copy)     | Static CSS copy                    | Low            |
| Logging/docs          | `Questerix/docs/TIME_LOG.md`      | All repos reference it          | Manual cross-repo writes           | Low (process)  |
| Screenshot automation | `questerix-help-docs` scripts     | Live student/admin apps         | Playwright against production URLs | Low            |

---

## 2. Current Pain Points (Evidence-Based)

### 2.1 Type Generation Has Three Targets (Drift Risk)

The Supabase typegen currently writes to:

- `admin-panel/src/lib/database.types.ts` (via `orchestrator.ps1` line 147-161)
- `packages/core/src/types/database.types.ts` (via `packages/core/package.json` typegen script)
- CI checks **both** `admin-panel/src/lib/database.types.ts` AND `admin-panel/src/types/database.types.ts` for emptiness

Most admin-panel imports use `@/lib/database.types`, not the `@questerix/core` package export. The shared package exists but is not the primary consumption path.

The student app uses its own Dart models (Drift tables + Freezed classes), not the TypeScript types at all. Schema changes require manual synchronization.

### 2.2 Pre-Commit Hook Is Too Heavy

The `.husky/pre-commit` hook runs:

1. `npx lint-staged` (fast, correct)
2. **Full `tsc --noEmit` on admin-panel** (slow — typechecks entire app on every commit)
3. Forbidden-pattern grep on staged files (fast)
4. Governance check on staged markdown (runs `npm run governance:check` in questerix-cortex)

Steps 2 and 4 are disproportionate for small commits. A one-line CSS fix triggers a full typecheck.

### 2.3 Pre-Push Hook Runs E2E Smoke Tests

The `.husky/pre-push` hook runs:

1. Gitleaks secret scan (reasonable)
2. Forbidden-pattern grep (fast)
3. **Full E2E smoke test suite** via `npm run test:e2e:smoke` (slow — Playwright browser launch + auth + tests)

This blocks every push by minutes. The `SKIP_SMOKE=1` escape hatch exists but defeats the purpose.

### 2.4 CI Has 48 Workflows with Overlap

The main `ci.yml` alone runs on **every push and PR** with no path filters:

- Docs freshness + link checking
- Flutter analyze + test + 60% coverage gate
- Python lint + test + 80% coverage gate
- Python security scan (Bandit)
- Admin lint + dep validation + arch tests + Vitest + **3-browser Playwright** + 70% coverage gate + build + typecheck + Pa11y
- Edge function tests
- Conditional: migration gate, RLS audit, P0 smoke E2E, Oracle drift

Meanwhile, `admin-panel-e2e.yml` **also** runs E2E on admin-panel changes (with path filter). This creates duplicate E2E runs when admin-panel code is pushed.

### 2.5 Nightly E2E Is Broken

`nightly-e2e.yml` runs:

```
npx playwright test tests/*.e2e.spec.ts --project=chromium
```

**Problems:**

- All E2E spec files live under `tests/mutating/` and `tests/read-only/`, not `tests/`. The glob matches **zero files**.
- It references `--project=chromium`, but `playwright.config.ts` defines projects named `desktop` and `unauthenticated`, not `chromium`.
- No `webServer` configuration or global setup — tests would fail even if files matched.

### 2.6 CI Project Name Mismatch

`ci.yml` admin job runs:

```
npx playwright test --project=chromium --project=firefox --project=webkit
```

But `playwright.config.ts` only defines `desktop` and `unauthenticated`. These project names don't match, so Playwright either runs nothing or falls back to all projects.

### 2.7 Student App Codegen Friction

38 generated files (`.g.dart` + `.freezed.dart`) across the repo. Any change to:

- Drift tables (15 tables, schema v15)
- Riverpod-annotated providers
- Freezed model classes

...requires running `dart run build_runner build --delete-conflicting-outputs`, which takes 30-60+ seconds and creates noisy diffs.

### 2.8 Student App Local Environment Issues

Diagnostic artifacts in the repo reveal recurring problems:

- `windows_build_error.txt`: Flutter TTS plugin requires NuGet on Windows — blocks desktop builds
- `cortex_output.txt`: OneDrive file locking breaks `lib/l10n` during `flutter pub get`
- `cortex_failure.txt`: 4 failing unit tests in last captured run

### 2.9 Orchestrator Assumes Sibling Folder Layout

`orchestrator.ps1` line 190:

```powershell
$siblingRootDir = Split-Path -Parent $ScriptDir
$studentBuild = Join-Path $siblingRootDir 'questerix-student-app\build\web'
```

This breaks if repos are not cloned as siblings in the same parent directory.

### 2.10 God-Files Create Merge Conflicts

Several files are disproportionately large and frequently touched:

**Admin Panel:**

- `AppsPage.tsx` — 50KB
- `SubjectsPage.tsx` — 48KB
- `question-list.tsx` — 41KB
- `domain-list.tsx` — 34KB

**Student App:**

- `practice_screen.dart` — 1950+ lines, 6 setState calls
- `onboarding_screen.dart` — 7 setState calls
- `question_widgets.dart` — large

These are merge-conflict magnets and review bottlenecks.

### 2.11 Mandatory Close Checklist on Every Micro-Task

Both repos require after **every task** (not session):

1. Update `TIME_LOG.md` (in main Questerix repo)
2. Update `LEARNING_LOG.md` (in main Questerix repo)
3. Clean temp files
4. Update `tasks.md`

For a 15-minute bugfix, this overhead can equal the fix time itself.

### 2.12 Test Directory Naming Confusion

Student app has overlapping test paths:

- `test/features/onboarding/` vs `test/features/auth/` (onboarding is part of auth)
- `test/features/practice/` vs `test/features/curriculum/` (practice is part of curriculum)

This creates confusion about where to add new tests.

---

## 3. Architecture: Keep 4 Repos, Fix Coordination

### Why keep separate repos

- Independent deploy cycles (student app doesn't wait for admin CI)
- Smaller, focused CI per repo
- Clear ownership boundaries
- Different tech stacks (Flutter vs React vs VitePress)

### What to add: Lightweight coordination

**Option A: GitHub Projects board (recommended for your scale)**

- One project board spanning all 4 repos
- Parent issue per feature/bug with linked child issues per repo
- Labels: `admin-panel`, `student-app`, `landing`, `help-docs`, `cross-repo`
- Milestones aligned to weekly release windows

**Option B: Simple cross-repo tracking in `tasks.md`**

- Keep current `tasks.md` but add a `[cross-repo]` tag
- Add a `## Cross-Repo Dependencies` section listing blocked items

### Cross-repo change protocol

When a change affects multiple repos (e.g., schema change):

1. Schema migration lands in `Questerix` first
2. Types regenerated and committed
3. Student app Drift tables updated in follow-up PR
4. Help docs screenshots refreshed if UI changed
5. Each step is a separate PR with a shared ticket ID

---

## 4. Type and Contract Drift Elimination

### Current state (problematic)

```
Supabase Schema
    ├── orchestrator.ps1 → admin-panel/src/lib/database.types.ts (TS)
    ├── packages/core typegen → packages/core/src/types/database.types.ts (TS)
    └── Manual → questerix-student-app/lib/src/core/database/tables.dart (Dart)
```

### Proposed state

```
Supabase Schema (Single Source of Truth)
    │
    ├── CI typegen step → packages/core/src/types/database.types.ts
    │   └── admin-panel imports from @questerix/core (remove local copy)
    │
    └── Schema changelog → student app team manually updates Drift tables
        (with a checklist item in the PR template)
```

### Specific changes needed

1. **Single TypeScript type target**: Generate types only to `packages/core`. Remove `admin-panel/src/lib/database.types.ts` as a separate target.
2. **Admin panel imports**: Migrate all `@/lib/database.types` imports to `@questerix/core/types/database` (the Vite alias already exists).
3. **Orchestrator update**: Change typegen output path from `admin-panel/src/lib/` to `packages/core/src/types/`.
4. **CI guard**: Add a step that fails if `admin-panel/src/lib/database.types.ts` exists (prevents regression).
5. **Student app contract checklist**: Add to PR template: "If schema changed, update `tables.dart` and bump `schemaVersion`."

---

## 5. CI/CD Overhaul: Fast Lane / Full Lane

### Principle: Match validation cost to change risk

### Fast Lane (default for every PR)

| Check                            | Where       | Time    |
| -------------------------------- | ----------- | ------- |
| Lint (changed files only)        | Per-repo CI | ~30s    |
| Type check / `flutter analyze`   | Per-repo CI | ~1-2min |
| Unit tests (changed + dependent) | Per-repo CI | ~2-5min |
| Forbidden pattern grep           | Per-repo CI | ~5s     |

**Total: ~3-8 minutes**

### Full Lane (triggered by label or path)

| Check                                      | Trigger                                          | Time      |
| ------------------------------------------ | ------------------------------------------------ | --------- |
| Full test suite                            | Label `full-qa` or path `supabase/migrations/**` | ~10-20min |
| Cross-browser E2E                          | Label `full-qa` or merge to `main`               | ~15-25min |
| Coverage gates                             | Label `full-qa` or merge to `main`               | ~2min     |
| Security scans (Bandit, Semgrep, Gitleaks) | Label `security` or nightly                      | ~5min     |
| Performance profiler                       | Label `perf` or nightly                          | ~10min    |
| Accessibility audit                        | Label `a11y` or nightly                          | ~5min     |
| Visual regression                          | Label `visual` or nightly                        | ~10min    |

### Nightly Lane (scheduled, no PR blocking)

| Check                                   | Schedule       |
| --------------------------------------- | -------------- |
| Full E2E regression (all browsers)      | Daily 6 AM UTC |
| Security scans (DAST, Gitleaks, Bandit) | Daily          |
| Dead code detection                     | Weekly         |
| License/SBOM audit                      | Weekly         |
| Bundle size tracking                    | Weekly         |
| Lighthouse performance                  | Weekly         |
| Dependency vulnerability scan           | Daily          |

### Specific `ci.yml` changes (Questerix repo)

1. **Add path filters** to the `admin` job: only run on `admin-panel/**` changes.
2. **Add path filters** to the `flutter` job: only run on `questerix-student-app/**` or `student-app/**` changes. (Note: Flutter code lives in the student-app repo, but CI references it.)
3. **Move 3-browser E2E** from `ci.yml` to `admin-panel-e2e.yml` only (avoid duplicate runs).
4. **Remove Pa11y** from `ci.yml` (already covered by `admin-panel-e2e.yml` a11y-gate).
5. **Make coverage gates** run only on merge to `main`, not on every PR push.
6. **Move Oracle drift check** to nightly (it's informational, not blocking).

### Specific `admin-panel-e2e.yml` changes

1. **PR runs**: `test:e2e:pr` (smoke + logic only) — already correct.
2. **Main merge runs**: `test:e2e:full` — already correct.
3. **Remove Lighthouse from E2E workflow** — move to nightly or separate workflow.

### Fix `nightly-e2e.yml`

1. Change glob from `tests/*.e2e.spec.ts` to `tests/mutating/ tests/read-only/`.
2. Change `--project=chromium` to `--project=desktop`.
3. Add `webServer` config or ensure global setup runs.
4. Add test environment variables (currently missing `TEST_*_EMAIL` and `TEST_*_PASSWORD`).

### Student app CI changes

1. Keep 4-shard test matrix (good parallelism).
2. **Move performance profiler** to nightly or label-triggered (it adds Linux desktop setup overhead).
3. **60% coverage gate**: Keep, but run only on merge to `main`, not on every PR.

---

## 6. Local Developer Experience

### 6.1 Lighten Pre-Commit Hook

**Current** (slow):

1. lint-staged
2. Full `tsc --noEmit` on admin-panel
3. Forbidden-pattern grep
4. Governance check on markdown

**Proposed** (fast):

1. lint-staged (keep)
2. Forbidden-pattern grep (keep)
3. Move `tsc --noEmit` to pre-push or CI only
4. Move governance check to CI only

**Expected savings**: 10-30 seconds per commit.

### 6.2 Lighten Pre-Push Hook

**Current** (blocking):

1. Gitleaks scan
2. Forbidden-pattern grep
3. Full E2E smoke test suite

**Proposed**:

1. Gitleaks scan (keep — fast and critical)
2. Forbidden-pattern grep (keep)
3. `tsc --noEmit` (moved from pre-commit — catches type errors before push)
4. **Remove E2E smoke from local push** — enforce in CI only

**Expected savings**: 2-5 minutes per push.

### 6.3 Unified Command Surface

Create consistent aliases across all repos:

```
dev         → Start local dev server
test:fast   → Run only changed/affected tests
test:full   → Run complete test suite
check       → Lint + typecheck (no tests)
deploy:preview → Deploy to preview environment
deploy:prod    → Deploy to production (with confirmation)
```

Implementation: Add these as npm scripts in each repo's `package.json`.

### 6.4 Student App Codegen Optimization

- Use `build_runner watch` during development instead of manual `build` after every change.
- Add a `codegen` npm/dart script alias: `dart run build_runner build --delete-conflicting-outputs`.
- Consider `.gitignore`-ing generated files and regenerating in CI (trade-off: faster reviews vs CI dependency).

### 6.5 Fix Known Local Environment Issues

- **OneDrive locking**: Document workaround (move repo outside OneDrive, or use `flutter pub get --offline` after initial fetch).
- **Windows NuGet for TTS**: Add to README troubleshooting with install command: `winget install Microsoft.NuGet`.
- **Failing tests**: Fix the 4 failing tests captured in `cortex_failure.txt` before any other work.

---

## 7. Testing Strategy Simplification

### 7.1 Admin Panel Test Consolidation

**Current state**: 66 files under `admin-panel/tests/` with:

- 22 E2E specs split across `mutating/` and `read-only/`
- Multiple smoke specs
- Debug/screenshot/dump specs (should not be committed)
- 7 page objects
- Global setup authenticating 4 roles

**Recommendations**:

1. **Delete debug/diagnostic test files** from the repo:
   - `debug-rerun.spec.ts`
   - `screenshot.spec.ts`
   - `dump-dom.spec.ts`
   - `dump-studio.spec.ts`
     These are one-off diagnostic tools, not regression tests.

2. **Consolidate smoke configs**: Currently there are two Playwright configs (`playwright.config.ts` and `playwright.smoke.config.ts`). Consider merging into one config with project-based selection.

3. **Reduce auth roles in global setup**: If most tests only use `super-admin`, authenticate only that role by default. Add other roles on-demand per test file.

4. **Tag-based test selection**: Use `@smoke`, `@full`, `@a11y` tags consistently so CI can select subsets without separate configs.

### 7.2 Student App Test Cleanup

1. **Resolve directory overlap**: Merge `test/features/onboarding/` into `test/features/auth/` and `test/features/practice/` into `test/features/curriculum/`.
2. **Fix the 4 failing tests** from `cortex_failure.txt` immediately.
3. **Add a `test:fast` script** that runs only tests matching changed files (Flutter supports `--name` and file-path targeting).

### 7.3 Cross-Repo Integration Testing

Currently there is no automated test that verifies admin-panel and student-app work together against the same Supabase instance.

**Proposal**: Add a weekly integration canary:

- Deploy latest `main` of both apps to staging
- Run a minimal flow: admin creates question → student app fetches it
- Alert on failure

---

## 8. Deployment Pipeline Improvements

### 8.1 Orchestrator Simplification

**Current `orchestrator.ps1`** (358 lines) does:

1. Preflight (config + secrets)
2. Supabase sync (migrations + typegen)
3. Build (admin + student)
4. Deploy to preview
5. Smoke gate
6. Promote to production
7. Log rotation + cleanup

**Problems**:

- Assumes sibling folder layout for student app
- Types written only to admin-panel (not `packages/core`)
- Edge function deploy is a placeholder (commented out)
- Mixes concerns (build + deploy + test + cleanup)

**Recommendations**:

1. **Split into focused scripts**:
   - `sync-schema.ps1` — migrations + typegen only
   - `build.ps1` — build one or both apps
   - `deploy.ps1` — deploy to preview or production
   - `smoke.ps1` — run smoke tests against a URL
   - Keep `orchestrator.ps1` as a thin wrapper that calls them in sequence

2. **Make student app path configurable**:

   ```powershell
   param([string]$StudentAppPath = (Join-Path (Split-Path -Parent $ScriptDir) 'questerix-student-app'))
   ```

3. **Implement edge function deploy** (currently placeholder).

4. **Add `--target admin-only` and `--target student-only` shortcuts** for single-app deploys.

### 8.2 Per-Repo Deploy Independence

Each repo should be deployable independently:

- `Questerix`: `orchestrator.ps1 -Target admin-panel` (admin only, no student dependency)
- `questerix-student-app`: `publish.ps1` (already exists, works independently)
- `questerix-landing-pages`: `npm run build && npx wrangler pages deploy dist/` (already works)
- `questerix-help-docs`: `npm run build && npx wrangler pages deploy .vitepress/dist/` (already works)

The orchestrator should be optional for coordinated deploys, not mandatory for single-app changes.

---

## 9. Documentation and Process Reduction

### 9.1 Reduce Mandatory Close Checklist Frequency

**Current**: Run after **every task** (even 15-minute fixes).

**Proposed**: Run after **every session** (end of work period), not every micro-task.

For individual tasks within a session:

- Update `tasks.md` immediately (keep)
- Batch `TIME_LOG` and `LEARNING_LOG` updates to session end
- Clean temp files at session end

### 9.2 Consolidate Agent Instructions

Currently, agent instructions are spread across:

- `AGENTS.md` (Questerix root)
- `GEMINI.md` (Questerix root, student app root)
- `.cursorrules` (Questerix root)
- `.agent/workflows/*.md` (both repos)
- `docs/standards/ORACLE_COGNITION.md`
- `docs/technical/DEVELOPMENT.md`

**Recommendation**: Create a single `QUICKSTART.md` per repo with:

- "How to fix a bug" (5 steps)
- "How to add a feature" (7 steps)
- "How to deploy" (3 steps)
- Links to detailed docs for edge cases

### 9.3 Per-Repo Cheat Sheets

Each repo gets a one-page reference:

**Admin Panel Cheat Sheet:**

```
Fix a bug:    npm run dev → reproduce → fix → npm run test:fast → push
Run tests:    npm run test (unit) | npm run test:e2e:smoke (E2E)
Type check:   npm run typecheck
Deploy:       orchestrator.ps1 -Target admin-panel
```

**Student App Cheat Sheet:**

```
Fix a bug:    flutter run -d chrome → reproduce → fix → flutter test test/path/to/test.dart → push
Codegen:      dart run build_runner build --delete-conflicting-outputs
Run tests:    flutter test test/specific_test.dart (NEVER full suite locally)
Deploy:       publish.ps1
```

---

## 10. Broken or Misaligned Workflows to Fix

These are concrete bugs in the current CI setup that should be fixed regardless of other changes:

| Issue                           | File                             | Problem                                                        | Fix                                                                        |
| ------------------------------- | -------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Nightly glob matches zero files | `nightly-e2e.yml:30`             | `tests/*.e2e.spec.ts` — files are in subdirectories            | Change to `tests/mutating/ tests/read-only/`                               |
| Nightly project name wrong      | `nightly-e2e.yml:30`             | `--project=chromium` — config defines `desktop`                | Change to `--project=desktop`                                              |
| Nightly missing env vars        | `nightly-e2e.yml`                | No `TEST_*_EMAIL`/`PASSWORD` secrets                           | Add same env block as `admin-panel-e2e.yml`                                |
| Nightly missing webServer       | `nightly-e2e.yml`                | No dev server started                                          | Add webServer config or use `admin-panel-e2e.yml` config                   |
| CI project names wrong          | `ci.yml:191`                     | `--project=chromium --project=firefox --project=webkit`        | Change to `--project=desktop` or remove (covered by `admin-panel-e2e.yml`) |
| Duplicate E2E runs              | `ci.yml` + `admin-panel-e2e.yml` | Both run Playwright on admin-panel changes                     | Remove Playwright from `ci.yml`, keep in `admin-panel-e2e.yml`             |
| Debug test files committed      | `admin-panel/tests/`             | `debug-rerun.spec.ts`, `dump-*.spec.ts`, `screenshot.spec.ts`  | Delete or `.gitignore`                                                     |
| Stray diagnostic files          | `questerix-student-app/` root    | `windows_build_error.txt`, `cortex_*.txt`, `tests_output.json` | Delete (already tracked in tasks.md)                                       |

---

## 11. Release Cadence and Integration Model

### Proposed Rhythm

| Day             | Activity                                                       |
| --------------- | -------------------------------------------------------------- |
| Monday–Thursday | Feature/bugfix PRs merged to `main` per repo                   |
| Thursday PM     | Integration check: deploy all to staging, run cross-repo smoke |
| Friday AM       | Release window: promote staging to production                  |
| Friday PM       | Nightly deep scans run over weekend                            |

### Hotfix Protocol

For production-breaking bugs:

1. Fix in isolated branch
2. Fast lane CI only (skip full matrix)
3. Deploy directly to production with `--SkipSmoke` if time-critical
4. Backfill tests in follow-up PR within 24 hours

### Feature Flags for Cross-Repo Work

When a feature spans admin + student app:

1. Admin-side lands first behind a feature flag (env var or config toggle)
2. Student-side lands in next PR
3. Flag removed once both sides are verified together

---

## 12. Metrics to Track

### Weekly Dashboard

| Metric                             | Target                  | How to Measure        |
| ---------------------------------- | ----------------------- | --------------------- |
| PR merge time (median)             | < 2 hours               | GitHub API            |
| CI duration per PR (p50)           | < 8 minutes (fast lane) | GitHub Actions timing |
| PR size (median files changed)     | < 8 files               | GitHub API            |
| Reopened bugs / regressions        | < 1 per week            | Issue tracker         |
| Nightly E2E pass rate              | > 95%                   | Workflow history      |
| Deploy frequency                   | >= 2 per week           | Deploy log            |
| Time from bug report to fix merged | < 48 hours for P0       | Issue tracker         |

### Monthly Review

- Total hours logged vs features/bugs shipped (velocity ratio)
- CI cost (GitHub Actions minutes)
- Cross-repo drift incidents
- God-file touch frequency (track if modularization is reducing conflicts)

---

## 13. 30-Day Rollout Plan

### Week 1: Fix What's Broken + Quick Wins

**Priority: Stop wasting CI minutes on broken workflows**

- [ ] Fix `nightly-e2e.yml` glob, project names, env vars, and webServer
- [ ] Fix `ci.yml` Playwright project names (`chromium` → `desktop`)
- [ ] Remove duplicate Playwright from `ci.yml` (keep in `admin-panel-e2e.yml`)
- [ ] Delete debug/diagnostic test files from admin-panel
- [ ] Delete stray `.txt` files from student-app root
- [ ] Lighten pre-commit hook (remove `tsc --noEmit`, move to pre-push)
- [ ] Remove E2E smoke from pre-push hook (enforce in CI only)

**Expected impact**: Faster commits, faster pushes, CI stops running phantom tests.

### Week 2: CI Fast Lane + Path Filters

- [ ] Add path filters to `ci.yml` jobs (admin, flutter, python, edge functions)
- [ ] Move cross-browser E2E, Pa11y, coverage gates to merge-to-main or label-triggered
- [ ] Move student-app performance profiler to nightly
- [ ] Create `test:fast` scripts in both repos
- [ ] Standardize command aliases across repos

**Expected impact**: PR CI drops from ~20-30 min to ~5-8 min for most changes.

### Week 3: Type Drift + Deploy Improvements

- [ ] Consolidate TypeScript types to single `packages/core` target
- [ ] Migrate admin-panel imports from `@/lib/database.types` to `@questerix/core`
- [ ] Update orchestrator typegen output path
- [ ] Make student-app path configurable in orchestrator
- [ ] Split orchestrator into focused scripts
- [ ] Add contract-change checklist to PR templates

**Expected impact**: Eliminates type drift, makes deploys more flexible.

### Week 4: Process + Documentation + Metrics

- [ ] Reduce close checklist to per-session (not per-task)
- [ ] Create per-repo `QUICKSTART.md` cheat sheets
- [ ] Set up GitHub Projects board for cross-repo tracking
- [ ] Implement weekly metrics dashboard (can be a simple markdown report)
- [ ] Run first release train with new process
- [ ] Retrospective: what worked, what didn't, adjust

**Expected impact**: Lower process overhead, better visibility, sustainable cadence.

---

## 14. Decision Log Template

Use this to record final decisions as changes are implemented:

| Date | Decision                                                     | Rationale                         | Owner |
| ---- | ------------------------------------------------------------ | --------------------------------- | ----- |
|      | Fast lane required checks: lint + typecheck + targeted tests | Balance speed vs safety           |       |
|      | Full lane trigger: label `full-qa` or merge to `main`        | Expensive checks only when needed |       |
|      | Pre-commit: lint-staged + secret grep only                   | Typecheck moved to pre-push       |       |
|      | Pre-push: gitleaks + typecheck only                          | E2E moved to CI                   |       |
|      | Type target: `packages/core` only                            | Eliminate drift                   |       |
|      | Close checklist: per-session, not per-task                   | Reduce overhead                   |       |
|      | Nightly: full E2E + security + perf + a11y                   | Comprehensive but non-blocking    |       |

---

## Appendix: Files Referenced in This Plan

| File                                        | Repo        | Relevance                   |
| ------------------------------------------- | ----------- | --------------------------- |
| `.husky/pre-commit`                         | Questerix   | Hook optimization           |
| `.husky/pre-push`                           | Questerix   | Hook optimization           |
| `.github/workflows/ci.yml`                  | Questerix   | CI overhaul                 |
| `.github/workflows/admin-panel-e2e.yml`     | Questerix   | E2E dedup                   |
| `.github/workflows/nightly-e2e.yml`         | Questerix   | Broken workflow fix         |
| `orchestrator.ps1`                          | Questerix   | Deploy improvements         |
| `packages/core/src/types/database.types.ts` | Questerix   | Type consolidation          |
| `admin-panel/src/lib/database.types.ts`     | Questerix   | Type consolidation (remove) |
| `admin-panel/playwright.config.ts`          | Questerix   | Project name alignment      |
| `admin-panel/tests/global-setup.ts`         | Questerix   | Auth simplification         |
| `tasks.md`                                  | Both repos  | Process reference           |
| `AGENTS.md`                                 | Both repos  | Process simplification      |
| `.github/workflows/ci.yml`                  | Student app | CI optimization             |
| `.github/workflows/performance.yml`         | Student app | Move to nightly             |
| `lib/src/core/database/tables.dart`         | Student app | Contract sync               |
| `pubspec.yaml`                              | Student app | Codegen dependencies        |
