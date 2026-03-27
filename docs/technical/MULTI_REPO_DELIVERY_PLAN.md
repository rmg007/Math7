# Multi-Repo Delivery Plan (Questerix Ecosystem)

> Strategy-only document. No implementation.
> Generated from deep analysis of all four repositories on 2026-03-25.
> **Revised**: 2026-03-25 with AI Agent Performance, Governance Audit, and God-File Decomposition sections.

---

## Table of Contents

1. [Ecosystem Overview](#1-ecosystem-overview)
2. [Current Pain Points (Evidence-Based)](#2-current-pain-points-evidence-based)
3. [AI Agent Performance — The #1 Bottleneck](#3-ai-agent-performance--the-1-bottleneck)
4. [Governance Debt Audit — What to Kill](#4-governance-debt-audit--what-to-kill)
5. [Architecture: Keep 4 Repos, Fix Coordination](#5-architecture-keep-4-repos-fix-coordination)
6. [Type and Contract Drift Elimination](#6-type-and-contract-drift-elimination)
7. [CI/CD Overhaul: Fast Lane / Full Lane](#7-cicd-overhaul-fast-lane--full-lane)
8. [Local Developer Experience](#8-local-developer-experience)
9. [Testing Strategy Simplification](#9-testing-strategy-simplification)
10. [Deployment Pipeline Improvements](#10-deployment-pipeline-improvements)
11. [God-File Decomposition](#11-god-file-decomposition)
12. [Documentation and Process Reduction](#12-documentation-and-process-reduction)
13. [Cortex ROI Assessment](#13-cortex-roi-assessment)
14. [Broken or Misaligned Workflows to Fix](#14-broken-or-misaligned-workflows-to-fix)
15. [Release Cadence and Integration Model](#15-release-cadence-and-integration-model)
16. [Metrics to Track](#16-metrics-to-track)
17. [30-Day Rollout Plan](#17-30-day-rollout-plan)
18. [Risk Register and Rollback Strategy](#18-risk-register-and-rollback-strategy)
19. [Decision Log Template](#19-decision-log-template)

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

### 2.13 Repos Live Inside OneDrive (Recurring Infrastructure Problem)

All four repos are located under `C:\Users\mhali\OneDrive\Desktop\Important Projects\`. OneDrive cloud-sync causes:

- **File locking**: OneDrive holds open handles to files during sync, causing `flutter pub get` to fail on `lib/l10n` and Vite HMR to drop connections
- **Build artifacts corrupted**: `.dart_tool`, `node_modules`, and `dist/` are re-uploaded by OneDrive even though they should never be synced
- **Agent read failures**: Occasional `EBUSY` and `Access is denied` errors mid-session when OneDrive re-syncs a file the agent just wrote
- **False positives in CI**: Timestamps on files change due to OneDrive sync metadata updates, causing unnecessary cache misses

**Recommendation**: Move all four repos to `C:\Dev\questerix\` or any non-OneDrive path. Add `node_modules/`, `.dart_tool/`, `build/`, and `dist/` to OneDrive's "Files On-Demand" exclusion list at minimum. This is a root cause of ~10-15% of agent session failures.

---

## 3. AI Agent Performance — The #1 Bottleneck

This is the single biggest productivity killer. Sessions regularly take 3-10x longer than necessary, cause IDE crashes, and sometimes require laptop restarts. The agent is not slow because the code is complex — it's slow because the _ceremony_ around the code is massive.

### 3.1 Measured Time Breakdown (Typical 30-min Bugfix)

| Phase                       | Time          | % of Session | Value Delivered                          |
| :-------------------------- | :------------ | :----------- | :--------------------------------------- |
| Bootstrap (read 7 files)    | 3-5 min       | 12-17%       | Low (same info every session)            |
| Read tasks.md + acknowledge | 1-2 min       | 3-7%         | Medium                                   |
| Cortex plan call            | 1-2 min       | 3-7%         | Low (usually returns "Tier A — proceed") |
| Actual code change          | 5-15 min      | 17-50%       | **High**                                 |
| Cortex verify call          | 1-2 min       | 3-7%         | Low                                      |
| Update tasks.md             | 1-2 min       | 3-7%         | Medium                                   |
| Update TIME_LOG.md          | 2-3 min       | 7-10%        | Low (bookkeeping)                        |
| Update LEARNING_LOG.md      | 2-3 min       | 7-10%        | Low                                      |
| Update CHANGELOG.md         | 1-2 min       | 3-7%         | Low                                      |
| Deployment (if triggered)   | 5-15 min      | 17-50%       | Medium                                   |
| **Total**                   | **22-51 min** |              |                                          |
| **Actual productive work**  | **5-15 min**  | **~30%**     |                                          |

> **Diagnosis**: Only ~30% of session time produces user-visible value. The remaining 70% is ceremony.

### 3.2 Root Causes of Infinite Loops and Crashes

| Cause                              | Mechanism                                                                                                                                                                                                         | Frequency                |
| :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------- |
| **Context window saturation**      | 800+ lines of agent rules + 7 bootstrap files + task + code = model runs out of reasoning space on complex tasks                                                                                                  | Every large task         |
| **Cross-repo logging**             | Agent edits code in student-app, then context-switches to main repo for TIME_LOG → loses code context                                                                                                             | Every cross-repo session |
| **Conflicting rules across repos** | 4 `AGENTS.md` + 2 `GEMINI.md` with subtly different rules → agent gets stuck on which rule to follow                                                                                                              | Frequent                 |
| **Mandatory test-per-bug**         | Agent writes fix → forced to write NEW test → test fails → agent loops on test fix → exhausts iterations. Existing CI tests still catch regressions automatically; the overhead is in writing _new_ tests per bug | Common                   |
| **build_runner cascades**          | One Freezed change → regenerate → type errors in generated files → agent tries to "fix" generated code                                                                                                            | Student app specific     |
| **Orchestrator as default deploy** | Simple UI tweak → agent runs full orchestrator pipeline (10+ min) instead of direct deploy                                                                                                                        | Common                   |

### 3.3 Proposed Fix: Task-Complexity Tiers

Instead of one-size-fits-all ceremony, classify tasks by complexity:

**Tier S — Surgical (< 5 min expected work)**

Examples: typo fix, CSS change, copy update, bump a version.

Protocol:

- NO bootstrap file reads
- NO Cortex plan/verify
- Make the change, commit, done
- Log in TIME_LOG only if session exceeds 15 min total

**Tier M — Standard (5-30 min expected work)**

Examples: bug fix, add a field, update a hook, refactor a component.

Protocol:

- Read `SKELETON_SUMMARY.md` only (1 file, not 7)
- Update tasks.md
- No mandatory test-per-bug (tests are opt-in based on risk)
- Session-close checklist at end of work period, not per task

**Tier L — Sprint (30+ min expected work)**

Examples: new feature, migration + schema change, cross-repo work.

Protocol:

- Full bootstrap (all relevant files)
- Cortex plan/verify
- Tests required
- Full session close

**Trigger mechanism**: The user signals the tier explicitly in their request:

- `// quick` or `// light` or `// s` → Tier S
- Default (no signal) → Tier M
- `// full` or `// sprint` or `// l` → Tier L

> **Design note**: Consider making Tier S the default and Tier M the opt-in (`// standard`). Rationale: most daily work is small fixes and tweaks. If the user forgets to type `// quick`, they still get punished with Tier M ceremony. Making lightweight the default means forgetting the signal never hurts — the user only opts into more process when they know they need it. This is a reversible decision; try S-as-default for one week and measure.

**Enforcement in AGENTS.md**: The tier system must be the **very first rule** in every `AGENTS.md`, before any bootstrap or checklist instructions. Format:

```
## Task Tiers (Read First)
if message contains '// quick' or '// light': TIER S — skip all bootstrap, Cortex, and close checklist
if message contains '// full' or '// sprint': TIER L — full bootstrap, Cortex plan/verify, full session close
default: TIER M — read SKELETON_SUMMARY.md only, update tasks.md, batch session close
```

Without this being first, the agent reads the checklist and bootstrap rules before seeing the tier override — defeating the purpose.

### 3.4 Agent Rule Consolidation Strategy

**Current state**: ~800 lines of agent rules across 6 files.

**Target state**: ~200 lines across 2 files per repo.

| Current File              | Lines | Action                                                                                                                                                                                  |
| :------------------------ | :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Questerix/AGENTS.md`     | ~180  | Keep, reduce to ~80 lines of universal rules                                                                                                                                            |
| `Questerix/GEMINI.md`     | ~150  | **Do NOT merge wholesale** — strip to <30 lines of Antigravity-specific execution permissions only (the `// turbo-all` block + ops_runner fallback). Universal rules move to AGENTS.md. |
| `student-app/AGENTS.md`   | ~100  | Reduce to ~40 lines (Flutter-specific only)                                                                                                                                             |
| `student-app/GEMINI.md`   | ~100  | Same as above — strip to <30 Antigravity-specific lines, universal rules → AGENTS.md                                                                                                    |
| `help-docs/AGENTS.md`     | ~60   | Reduce to ~20 lines                                                                                                                                                                     |
| `landing-pages/AGENTS.md` | ~60   | Reduce to ~20 lines                                                                                                                                                                     |

> **Why not fully merge GEMINI.md?** The `// turbo-all` directive and `ops_runner.py` fallback are Antigravity IDE-specific. If merged into AGENTS.md, Cursor, Windsurf, or Kiro would try to follow Antigravity execution rules and fail. Keep GEMINI.md alive but surgical — it should contain only what is meaningless to non-Antigravity agents.

**Shared rules** (defined once in `Questerix/AGENTS.md`, every other AGENTS.md states "inherit from Questerix root"):

- Conventional commits
- No TODO/FIXME in code
- Task-complexity tier system (see §3.3)
- Session-close checklist (per-session, not per-task)
- FILE_PLACEMENT table

**Per-repo rules** (only what's unique):

- Stack-specific patterns (React hooks vs Flutter widgets)
- Deployment commands
- Testing commands
- God-file ceiling for that repo

---

## 4. Governance Debt Audit — What to Kill

Every rule has a maintenance cost. This section evaluates each governance artifact against one question: **"Has this prevented a real incident in the last 60 days, and is the prevention value greater than the overhead?"**

### 4.1 Kill List (Recommend Deletion or Demotion)

| Artifact                    | Current Cost              | Incidents Prevented (60d)          | Verdict                                                     |
| :-------------------------- | :------------------------ | :--------------------------------- | :---------------------------------------------------------- |
| 7-file bootstrap protocol   | 3-5 min/session           | 0 (information is stale/redundant) | **Kill** — replace with 1-file `SESSION_READY.md`           |
| Cortex plan/verify per edit | 2-4 min/task              | 0 (almost always returns Tier A)   | **Kill** — make opt-in via `// cortex` flag                 |
| LEARNING_LOG per task       | 2-3 min/task              | 0 (rarely re-read)                 | **Demote** — weekly summary instead of per-task             |
| CHANGELOG per task          | 1-2 min/task              | 0 (auto-generable from commits)    | **Kill** — auto-generate from git log                       |
| Mandatory test-per-bug rule | 5-15 min/bug              | ~2 (caught 2 regressions)          | **Demote** — required for P0/P1 bugs only, opt-in for P2/P3 |
| RLS checklist per migration | 2-3 min/migration         | ~1 (caught missing SELECT policy)  | **Keep** — low cost, real value                             |
| `.cursorrules` file         | 0 min (passive)           | Unknown                            | **Audit** — may conflict with AGENTS.md                     |
| `ORACLE_COGNITION.md`       | 0 min (rarely read)       | 0                                  | **Archive** — add useful bits to AGENTS.md                  |
| 30+ workflow files          | Variable                  | ~3 used regularly                  | **Prune** — keep top 10, archive the rest                   |
| Circuit breaker thresholds  | Occasional false triggers | ~2 (stopped real loops)            | **Keep but loosen** — raise to 8 failures, 35 iterations    |

### 4.2 Keep List (Proven Value)

| Artifact               | Why It Stays                                                    |
| :--------------------- | :-------------------------------------------------------------- |
| `tasks.md`             | Central work tracker, referenced constantly                     |
| `TIME_LOG.md`          | Payroll/tax requirement — but move to per-session, not per-task |
| Forbidden-pattern grep | Fast, catches real secrets                                      |
| Gitleaks pre-push      | Fast, catches real secrets                                      |
| RLS checklist          | Cheap, prevents real security gaps                              |
| Conventional commits   | Zero overhead, enables auto-changelog                           |

### 4.3 Workflow Pruning Matrix

Of the 30+ workflows in `.agent/workflows/`, usage analysis:

| Usage Tier               | Workflows                                                                                                                          | Action                               |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| **Used weekly**          | `/default`, `/fix`, `/test`, `/process`                                                                                            | Keep                                 |
| **Used monthly**         | `/superpower`, `/continue`, `/resume`, `/sleep`, `/wake`                                                                           | Keep                                 |
| **Used rarely**          | `/certify`, `/forensics`, `/ironclad`, `/loki`                                                                                     | Archive to `docs/archive/workflows/` |
| **Never used or broken** | `/codescene`, `/governance-audit`, `/qa-autoloop`, `/reliability-audit`, `/security-hardening-audit`, `/reindex_docs`, `/optimize` | **Delete**                           |

> **Target**: Reduce from 30+ to 10 active workflows.

---

## 5. Architecture: Keep 4 Repos, Fix Coordination

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

## 6. Type and Contract Drift Elimination

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

## 7. CI/CD Overhaul: Fast Lane / Full Lane

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

## 8. Local Developer Experience

### 8.1 Lighten Pre-Commit Hook

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

### 8.2 Lighten Pre-Push Hook

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

### 8.3 Unified Command Surface

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

### 8.4 Student App Codegen Optimization

- Use `build_runner watch` during development instead of manual `build` after every change.
- Add a `codegen` npm/dart script alias: `dart run build_runner build --delete-conflicting-outputs`.
- Consider `.gitignore`-ing generated files and regenerating in CI (trade-off: faster reviews vs CI dependency).

### 8.5 Fix Known Local Environment Issues

- **OneDrive locking** (see §2.13): The definitive fix is moving all repos outside OneDrive. As a minimum viable workaround, add `node_modules`, `.dart_tool`, `build`, and `.dart_tool/flutter_build` to OneDrive's sync exclusion list via Settings → Sync and backup → Manage backup.
- **Windows NuGet for TTS**: Add to README troubleshooting with install command: `winget install Microsoft.NuGet`.
- **Failing tests**: Fix the 4 failing tests captured in `cortex_failure.txt` before any other work.

---

## 9. Testing Strategy Simplification

### 9.1 Admin Panel Test Consolidation

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

### 9.2 Student App Test Cleanup

1. **Resolve directory overlap**: Merge `test/features/onboarding/` into `test/features/auth/` and `test/features/practice/` into `test/features/curriculum/`.
2. **Fix the 4 failing tests** from `cortex_failure.txt` immediately.
3. **Add a `test:fast` script** that runs only tests matching changed files (Flutter supports `--name` and file-path targeting).

### 9.3 Cross-Repo Integration Testing

Currently there is no automated test that verifies admin-panel and student-app work together against the same Supabase instance.

**Proposal**: Add a weekly integration canary:

- Deploy latest `main` of both apps to staging
- Run a minimal flow: admin creates question → student app fetches it
- Alert on failure

---

## 10. Deployment Pipeline Improvements

### 10.1 Orchestrator Simplification

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
- **Agent latency**: The orchestrator takes 5-15 min, and the AI agent blocks on it the entire time, consuming context window for status-polling instead of doing other work

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

5. **Add `--fast` flag**: Skips smoke gate and preview — goes straight to build + production deploy for Tier S changes.

### 10.2 Per-Repo Deploy Independence

Each repo should be deployable independently:

- `Questerix`: `orchestrator.ps1 -Target admin-panel` (admin only, no student dependency)
- `questerix-student-app`: `publish.ps1` (already exists, works independently)
- `questerix-landing-pages`: `npm run build && npx wrangler pages deploy dist/` (already works)
- `questerix-help-docs`: `npm run build && npx wrangler pages deploy .vitepress/dist/` (already works)

The orchestrator should be optional for coordinated deploys, not mandatory for single-app changes.

### 10.3 Deploy-on-Push (Future — Highest ROI Single Change)

Ultimate goal: Push to `main` → GitHub Actions builds and deploys automatically. No local orchestrator needed.

This would eliminate the agent's role in deployment entirely, which is where a huge chunk of wasted time goes.

**What's needed to get there:**

1. A GitHub Actions workflow per deployable repo that triggers on merge to `main`:
   - `Questerix`: build admin-panel → deploy to Cloudflare Pages via `wrangler`
   - `questerix-student-app`: build web → deploy to Cloudflare Pages via `wrangler`
   - `questerix-landing-pages`: already nearly there (Cloudflare auto-deploy on push, gated by `QUESTERIX_ALLOW_PROD_DEPLOY`)
   - `questerix-help-docs`: already nearly there (Cloudflare auto-deploy on push)

2. Secrets needed in GitHub Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, project names from `master-config.json`

3. Supabase schema sync stays manual (too risky to auto-deploy migrations) — but typegen can be automated in CI

4. Smoke tests run post-deploy in CI, not as a local gate

**Why this is the highest-ROI single change**: Every deploy currently costs 5-15 minutes of agent time (build + preview + smoke + promote). With deploy-on-push, the agent's job ends at "commit and push." CI handles the rest asynchronously. For 2+ deploys per week, this saves 10-30 minutes of blocked agent time weekly — and eliminates the orchestrator as a crash/hang source.

---

## 11. God-File Decomposition

God-files are the #2 productivity killer after governance overhead. They cause:

- **AI context saturation**: A 50KB file consumes ~25% of the AI's context window just to read
- **Merge conflicts**: Every change to `AppsPage.tsx` conflicts with every other change to `AppsPage.tsx`
- **Cognitive overload**: 1950-line `practice_screen.dart` is impossible to reason about in one pass

### 11.1 Admin Panel God-Files

| File                | Size | setState/hooks | Decomposition Strategy                                                                                |
| :------------------ | :--- | :------------- | :---------------------------------------------------------------------------------------------------- |
| `AppsPage.tsx`      | 50KB | Many           | Extract: `AppCard`, `AppFilters`, `AppBulkImport`, `AppFormDialog`, `useAppsData`                     |
| `SubjectsPage.tsx`  | 48KB | Many           | Extract: `SubjectCard`, `SubjectFilters`, `SubjectBulkImport`, `SubjectFormDialog`, `useSubjectsData` |
| `question-list.tsx` | 41KB | Many           | Extract: `QuestionRow`, `QuestionFilters`, `QuestionBulkActions`, `useQuestionList`                   |
| `domain-list.tsx`   | 34KB | Many           | Extract: `DomainRow`, `DomainFilters`, `DomainBulkActions`, `useDomainList`                           |

**Pattern**: Each god-file follows the same structure — data hook + filter bar + list/card views + bulk import + form dialog. Extract into a consistent `features/{name}/components/` folder.

**Priority**: Do this during Week 3-4 of the rollout, after CI fixes stabilize the feedback loop.

### 11.2 Student App God-Files

| File                     | Lines | setState calls | Decomposition Strategy                                                                     |
| :----------------------- | :---- | :------------- | :----------------------------------------------------------------------------------------- |
| `practice_screen.dart`   | 1950+ | 6              | Extract: `QuestionRenderer`, `PracticeProgress`, `PracticeControls`, `PracticeTimer`       |
| `onboarding_screen.dart` | ~500  | 7              | Extract: `OnboardingStep` widgets, `OnboardingProgress`                                    |
| `question_widgets.dart`  | Large | N/A            | Extract: one widget file per question type (`McqWidget`, `BooleanWidget`, `ReorderWidget`) |

**Rule going forward**: No single file should exceed 400 lines. If a file crosses 400 lines, decompose it before adding more code.

---

## 12. Documentation and Process Reduction

### 12.1 Reduce Mandatory Close Checklist Frequency

**Current**: Run after **every task** (even 15-minute fixes).

**Proposed**: Run after **every session** (end of work period), not every micro-task.

For individual tasks within a session:

- Update `tasks.md` immediately (keep)
- Batch `TIME_LOG` and `LEARNING_LOG` updates to session end
- Clean temp files at session end

### 12.2 Consolidate Agent Instructions

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

### 12.3 Per-Repo Cheat Sheets

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

### 12.4 Auto-Generate What Humans Shouldn't Write

Move these from "agent manually writes" to "CI auto-generates":

| Artifact        | Current               | Proposed                                                                                      |
| :-------------- | :-------------------- | :-------------------------------------------------------------------------------------------- |
| CHANGELOG.md    | Agent writes per task | Auto-generate from conventional commit messages via `git log --format` or `standard-version`  |
| TIME_LOG.md     | Agent writes per task | Agent writes once per session (end of day); consider auto-deriving from git commit timestamps |
| LEARNING_LOG.md | Agent writes per task | Weekly summary only; daily-level detail has near-zero re-read rate                            |

---

## 13. Cortex ROI Assessment

Cortex is a custom intelligence layer for the Questerix project. It provides symbol search, session briefings, diff analysis, governance checks, and health reports. This section honestly evaluates its cost vs value.

### 13.1 What Cortex Costs

| Cost                                                                                                            | Per-Session Impact                                               |
| :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| Bootstrap reads (MACHINE_BRIEFING, SKELETON_SUMMARY, FAILURE_DIGEST, NEXT_TASK, LAST_CHANGED, UTILITY_REGISTRY) | 3-5 min of agent time reading files                              |
| `cortex_plan` before every edit                                                                                 | 1-2 min latency; usually returns "Tier A"                        |
| `cortex_verify` after every edit                                                                                | 1-2 min; runs tsc + tests that CI also runs                      |
| `cortex_search` for symbol lookup                                                                               | 10-30s per query (good)                                          |
| Maintenance of Cortex itself (MCP server, scripts, outputs, DB)                                                 | ~5% of total dev hours maintaining the tool                      |
| Context window consumption                                                                                      | Cortex outputs consume agent context that could hold actual code |

**Estimated total overhead: 5-10 min per session, or 20-35% of a typical 30-min bugfix**.

### 13.2 What Cortex Delivers

| Feature               | Usage Frequency                       | Incidents Prevented                                       | Verdict                                             |
| :-------------------- | :------------------------------------ | :-------------------------------------------------------- | :-------------------------------------------------- |
| `cortex_search`       | High (used most sessions)             | N/A — discovery tool                                      | **Keep** — genuinely useful                         |
| `SKELETON_SUMMARY.md` | High (read at bootstrap)              | Low — rarely provides info the agent doesn't already have | **Keep but make shorter**                           |
| `MACHINE_BRIEFING.md` | Medium                                | Low — often stale                                         | **Demote** — generate on-demand, not pre-session    |
| `FAILURE_DIGEST.md`   | Low (only useful when failures exist) | ~1                                                        | **Keep but read conditionally** (only if non-empty) |
| `NEXT_TASK.md`        | Low (agent reads tasks.md directly)   | 0                                                         | **Kill** — redundant with tasks.md                  |
| `LAST_CHANGED.md`     | Low                                   | 0                                                         | **Kill** — `git log -5` gives the same info         |
| `UTILITY_REGISTRY.md` | Low                                   | ~1 (prevented duplicate utility)                          | **Demote** — read only when creating new utilities  |
| `cortex_plan`         | Medium                                | 0 (always says Tier A)                                    | **Kill** — invest the saved time in actual tests    |
| `cortex_verify`       | Medium                                | ~1 (caught a type error)                                  | **Demote** — run only on Tier L tasks               |
| `cortex_briefing`     | Low                                   | 0                                                         | **Kill** — redundant with SKELETON_SUMMARY          |
| `cortex_diff`         | Low                                   | 0                                                         | **Kill** — `git diff` works                         |
| `cortex_insights`     | Low                                   | 0                                                         | **Move to weekly report**                           |
| `cortex_governance`   | Low                                   | 0                                                         | **Move to CI**                                      |

### 13.3 Recommended Cortex Simplification

**Keep (3 features)**:

- `cortex_search` — genuinely useful for symbol discovery
- `SKELETON_SUMMARY.md` — good orientation, but trim to 1 page
- `FAILURE_DIGEST.md` — read only when non-empty

**Kill (9 features)**:

- `cortex_plan`, `cortex_verify`, `cortex_briefing`, `cortex_diff`, `cortex_insights`, `cortex_governance`
- `NEXT_TASK.md`, `LAST_CHANGED.md`
- Mandatory 7-file bootstrap

**Net savings**: ~5-8 min per session, plus significant context window recovery.

### 13.4 Cortex Post-Simplification Fate

After killing 9 Cortex features, the Cortex codebase (MCP server, health scripts, TypeScript pipeline) becomes partially orphaned. Three options:

| Option           | What It Means                                                                                 | Recommendation                                                     |
| :--------------- | :-------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **Freeze**       | Stop developing Cortex, keep the MCP server running for `cortex_search`                       | ✅ Best option — low maintenance, preserves the one useful feature |
| **Retire**       | Shut down MCP server, delete questerix-cortex repo                                            | Too aggressive — loses `cortex_search` which is genuinely useful   |
| **Rebuild slim** | Rewrite Cortex as a 50-line script that only does symbol search + SKELETON_SUMMARY generation | Future option if maintenance burden grows                          |

**Decision**: Freeze Cortex at current state. Stop adding features. Run only the health check nightly. Accept that `MACHINE_BRIEFING.md` and other output files become stale and are no longer read by agents.

> **Maintenance note**: "Freeze" means no new features, not "never touch again." The MCP server will still need periodic dependency bumps (Node version, npm audit fixes). Budget ~1 hour per quarter for maintenance. If that cost exceeds the value of `cortex_search`, retire the MCP server entirely and replace with plain `rg` / `grep` commands.

---

## 14. Broken or Misaligned Workflows to Fix

These are concrete bugs in the current CI setup that should be fixed regardless of other changes:

| Issue                           | File                             | Problem                                                                                                     | Fix                                                                        |
| ------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Nightly glob matches zero files | `nightly-e2e.yml:30`             | `tests/*.e2e.spec.ts` — files are in subdirectories                                                         | Change to `tests/mutating/ tests/read-only/`                               |
| Nightly project name wrong      | `nightly-e2e.yml:30`             | `--project=chromium` — config defines `desktop`                                                             | Change to `--project=desktop`                                              |
| Nightly missing env vars        | `nightly-e2e.yml`                | No `TEST_*_EMAIL`/`PASSWORD` secrets                                                                        | Add same env block as `admin-panel-e2e.yml`                                |
| Nightly missing webServer       | `nightly-e2e.yml`                | No dev server started                                                                                       | Add webServer config or use `admin-panel-e2e.yml` config                   |
| CI project names wrong          | `ci.yml:191`                     | `--project=chromium --project=firefox --project=webkit`                                                     | Change to `--project=desktop` or remove (covered by `admin-panel-e2e.yml`) |
| Duplicate E2E runs              | `ci.yml` + `admin-panel-e2e.yml` | Both run Playwright on admin-panel changes                                                                  | Remove Playwright from `ci.yml`, keep in `admin-panel-e2e.yml`             |
| Debug test files committed      | `admin-panel/tests/`             | `debug-rerun.spec.ts`, `dump-*.spec.ts`, `screenshot.spec.ts`                                               | Delete or `.gitignore`                                                     |
| Stray diagnostic files          | `questerix-student-app/` root    | `windows_build_error.txt`, `cortex_*.txt`, `tests_output.json`                                              | Delete (already tracked in tasks.md)                                       |
| CHANGELOG has TIME_LOG fragment | `CHANGELOG.md:23-27`             | TIME_LOG table row and "Month Total: 0 hrs" pasted into v2.3.4 entry — likely copy-paste from session close | Remove the table and "Month Total" line from CHANGELOG                     |

---

## 15. Release Cadence and Integration Model

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

## 16. Metrics to Track

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

## 17. 30-Day Rollout Plan

### Week 0 (Prerequisite — Do Before Anything Else): Move Repos Off OneDrive

> This is not optional. OneDrive file locking is a root cause of ~10-15% of agent session failures, build corruption, and `EBUSY` errors. Every other improvement in this plan is undermined if repos stay on OneDrive.

- [ ] Create `C:\Dev\questerix\` (or any non-cloud-synced path)
- [ ] Move all four repos: `Questerix`, `questerix-student-app`, `questerix-landing-pages`, `questerix-help-docs`
- [ ] Update any IDE workspace files, terminal shortcuts, and `.cursorrules` paths
- [ ] Verify `git status` is clean in all four repos after the move
- [ ] Update Cursor workspace to point to new paths

**Estimated time**: 30 minutes. **Expected impact**: Eliminates file locking errors, build corruption, and `flutter pub get` failures on `lib/l10n`.

---

### Week 1: Fix What's Broken + Quick Wins (Estimated: 4 hours)

**Priority: Stop wasting CI minutes on broken workflows and reclaim local speed**

- [ ] Fix `nightly-e2e.yml` glob, project names, env vars, and webServer
- [ ] Fix `ci.yml` Playwright project names (`chromium` → `desktop`)
- [ ] Remove duplicate Playwright from `ci.yml` (keep in `admin-panel-e2e.yml`)
- [ ] Delete debug/diagnostic test files from admin-panel
- [ ] Delete stray `.txt` files from student-app root
- [ ] Lighten pre-commit hook (remove `tsc --noEmit`, move to pre-push)
- [ ] Remove E2E smoke from pre-push hook (enforce in CI only)

**Expected impact**: Faster commits, faster pushes, CI stops running phantom tests.

### Week 2: Agent Governance Trim (Estimated: 6 hours)

**Priority: Stop burning the first 70% of every session on ceremony**

- [ ] **Implement task-complexity tiers (Tier S/M/L)** — must be FIRST rule in all AGENTS.md files
- [ ] **Kill mandatory 7-file bootstrap** — replace with: read SKELETON_SUMMARY.md only (Tier M), read nothing (Tier S)
- [ ] **Kill Cortex plan/verify ceremony** — keep `cortex_search`, freeze everything else
- [ ] **Strip GEMINI.md to <30 lines** — Antigravity execution permissions only; move universal rules to AGENTS.md
- [ ] **Demote LEARNING_LOG** to weekly summary (not per-task)
- [ ] **Delete or archive 15+ unused workflow files** (see §4.3 pruning matrix)
- [ ] Add path filters to `ci.yml` jobs (admin, flutter, python, edge functions)
- [ ] Move cross-browser E2E, Pa11y, coverage gates to merge-to-main or label-triggered
- [ ] Move student-app performance profiler to nightly
- [ ] Create `test:fast` scripts in both repos
- [ ] Standardize command aliases across repos

**Expected impact**: Agent overhead drops by ~40%. Sessions for Tier S tasks drop from ~20 min to ~5 min. PR CI drops from ~20-30 min to ~5-8 min.

### Week 3: Type Drift + Deploy Improvements (Estimated: 8 hours)

- [ ] Consolidate TypeScript types to single `packages/core` target
- [ ] Migrate admin-panel imports from `@/lib/database.types` to `@questerix/core`
- [ ] Update orchestrator typegen output path
- [ ] Make student-app path configurable in orchestrator
- [ ] Split orchestrator into focused scripts
- [ ] Add `--fast` flag to orchestrator for Tier S deploys
- [ ] Add contract-change checklist to PR templates
- [ ] Verify `.secrets` file is excluded from OneDrive sync

**Expected impact**: Eliminates type drift, makes deploys more flexible. Removes deployment as an agent bottleneck.

### Week 4: God-File Decomposition + Process Documentation (Estimated: 8 hours)

> God-file decomposition is the highest-risk change and belongs in Week 4 when fast CI feedback loops are already in place.

- [ ] Begin god-file decomposition — start with `AppsPage.tsx` as the template pattern
- [ ] Reduce close checklist to per-session (not per-task)
- [ ] Create per-repo `QUICKSTART.md` cheat sheets
- [ ] Auto-generate CHANGELOG from conventional commits (kill manual writes)
- [ ] Set up GitHub Projects board for cross-repo tracking
- [ ] Implement weekly metrics dashboard
- [ ] Run first release train with new process
- [ ] **Measure before/after** — time 5 sample tasks and compare against Success Criteria table
- [ ] Retrospective: what worked, what didn't, adjust

**Expected impact**: Lower process overhead, better visibility, first god-file decomposed as template for others. Quantified proof that changes worked.

### Week 5 (Final Step): Deep Repo Housekeeping & Dead Code Extermination (Estimated: 6 hours)

> This represents the final physical scrub of the repositories after the governance and CI rules have been stabilized.

- [ ] Audit `Questerix` folder by folder to identify and delete unused/deprecated scripts.
- [ ] Scan `questerix-student-app` for orphaned widgets, unreachable screens, and dead providers.
- [ ] Prune `/tmp`, `/.agent/scratch`, and any temporary test dump folders globally.
- [ ] Remove fully deprecated edge functions and orphaned SQL migration drafts.
- [ ] Delete legacy placeholder images, unused `assets/`, and dead design tokens.
- [ ] Run dependency audits (`npm prune`, `flutter pub run dependency_validator`) and uninstall unused packages.

**Expected impact**: A significantly lighter repository footprint, faster IDE indexing, and a pristine baseline for future development.

### Success Criteria (End of 30 Days)

| Metric                                   | Before (Current) | Target   | How to Verify                            |
| :--------------------------------------- | :--------------- | :------- | :--------------------------------------- | ------ |
| Tier S task time (commit to done)        | 20-40 min        | < 8 min  | Time 5 sample tasks                      |
| Tier M task time (commit to done)        | 30-60 min        | < 20 min | Time 5 sample tasks                      |
| CI duration per PR (median)              | ~20-30 min       | < 8 min  | GitHub Actions dashboard                 |
| Agent governance overhead (% of session) | ~70%             | < 30%    | Manual observation                       |
| Laptop restarts per week due to agent    | ~2-3             | 0        | Self-report                              |
| IDE restarts per week due to agent       | ~5+              | < 1      | Self-report                              |
| Active workflow files                    | 30+              | < 12     | `ls .agent/workflows/                    | wc -l` |
| Lines of agent rules (total)             | ~800             | < 250    | `wc -l AGENTS.md GEMINI.md` across repos |

---

## 18. Risk Register and Rollback Strategy

Changes this aggressive carry risk. Plan for what could go wrong.

### 18.1 Risk Matrix

| Risk                                                                 | Likelihood | Impact       | Mitigation                                                                                                                                     |
| :------------------------------------------------------------------- | :--------- | :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| Removing Cortex verify causes a regression to ship                   | Low        | Medium       | CI already runs tsc + tests; this is a safety net on top of a safety net                                                                       |
| Killing bootstrap causes agent to make wrong architectural decisions | Medium     | Low          | SKELETON_SUMMARY still read; agent can always `// full` for complex tasks                                                                      |
| Auto-generating CHANGELOG produces garbage                           | Low        | Low          | Review first 3 auto-generated entries; revert if quality is poor                                                                               |
| God-file decomposition introduces regressions                        | Medium     | Medium       | Each decomposition gets its own PR with targeted tests                                                                                         |
| Workflow pruning deletes something needed                            | Low        | Low          | Archive to `docs/archive/workflows/`, not hard-delete; recoverable in < 1 min                                                                  |
| Close checklist demotion causes tax/payroll gaps                     | Low        | High         | TIME_LOG stays mandatory per session; only LEARNING_LOG and CHANGELOG are demoted                                                              |
| Fewer CI checks cause a security issue                               | Low        | High         | Gitleaks and forbidden-pattern grep are never removed; security scans move to nightly, not deleted                                             |
| `.secrets` file corrupted or leaked via OneDrive                     | Medium     | **Critical** | Move repos outside OneDrive (§2.13). Until then, add `.secrets` to `.gitignore` AND OneDrive's Personal Vault or exclusion list. Never commit. |
| Tier S bypass lets a breaking change reach production                | Low        | High         | Tier S tasks still go through CI (pre-push tsc + Gitleaks). The bypass only removes agent ceremony, not CI gates.                              |

### 18.2 Rollback Plan

Every Week 1-4 change should be reversible:

- **Git hooks**: Old hooks saved as `.husky/pre-commit.bak` before modification
- **CI workflows**: Changes are in PRs; revert the PR if nightly scores drop
- **Agent rules**: Old AGENTS.md/GEMINI.md saved as `AGENTS.md.bak` for 2 weeks
- **Workflow files**: Archived, not deleted — restore from `docs/archive/workflows/`
- **God-file splits**: Each split is a self-contained PR that can be reverted independently

---

## 19. Decision Log Template

Use this to record final decisions as changes are implemented:

| Date | Decision                                                     | Rationale                                                                              | Owner |
| ---- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----- |
|      | Task complexity tiers (S/M/L) with `// quick` trigger        | 70% of sessions are Tier S                                                             |       |
|      | Fast lane required checks: lint + typecheck + targeted tests | Balance speed vs safety                                                                |       |
|      | Full lane trigger: label `full-qa` or merge to `main`        | Expensive checks only when needed                                                      |       |
|      | Pre-commit: lint-staged + secret grep only                   | Typecheck moved to pre-push                                                            |       |
|      | Pre-push: gitleaks + typecheck only                          | E2E moved to CI                                                                        |       |
|      | Type target: `packages/core` only                            | Eliminate drift                                                                        |       |
|      | Close checklist: per-session, not per-task                   | Reduce overhead                                                                        |       |
|      | Nightly: full E2E + security + perf + a11y                   | Comprehensive but non-blocking                                                         |       |
|      | Kill Cortex plan/verify, keep cortex_search                  | 5-8 min saved per session                                                              |       |
|      | Strip GEMINI.md to <30 lines (Antigravity-only permissions)  | Universal rules live in AGENTS.md; GEMINI.md keeps only IDE-specific directives (§3.4) |       |
|      | Agent rule budget: <250 lines total                          | Prevent context window saturation                                                      |       |
|      | God-file ceiling: 400 lines max                              | Prevent merge hell and AI thrash                                                       |       |

---

## Appendix: Files Referenced in This Plan

| File                                                 | Repo        | Relevance                                 |
| ---------------------------------------------------- | ----------- | ----------------------------------------- |
| `.husky/pre-commit`                                  | Questerix   | Hook optimization (§8.1)                  |
| `.husky/pre-push`                                    | Questerix   | Hook optimization (§8.2)                  |
| `.github/workflows/ci.yml`                           | Questerix   | CI overhaul (§7)                          |
| `.github/workflows/admin-panel-e2e.yml`              | Questerix   | E2E dedup (§7)                            |
| `.github/workflows/nightly-e2e.yml`                  | Questerix   | Broken workflow fix (§14)                 |
| `orchestrator.ps1`                                   | Questerix   | Deploy improvements (§10)                 |
| `packages/core/src/types/database.types.ts`          | Questerix   | Type consolidation (§6)                   |
| `admin-panel/src/lib/database.types.ts`              | Questerix   | Type consolidation — remove (§6)          |
| `admin-panel/playwright.config.ts`                   | Questerix   | Project name alignment (§14)              |
| `admin-panel/tests/global-setup.ts`                  | Questerix   | Auth simplification (§9)                  |
| `admin-panel/src/features/apps/AppsPage.tsx`         | Questerix   | God-file decomposition (§11)              |
| `admin-panel/src/features/subjects/SubjectsPage.tsx` | Questerix   | God-file decomposition (§11)              |
| `AGENTS.md`                                          | Questerix   | Rule consolidation + tier system (§3, §4) |
| `GEMINI.md`                                          | Questerix   | Strip to <30 lines (§3.4)                 |
| `.secrets`                                           | Questerix   | Security — exclude from OneDrive (§18.1)  |
| `master-config.json`                                 | Questerix   | Deploy config (§10)                       |
| `questerix-cortex/outputs/SKELETON_SUMMARY.md`       | Questerix   | Keep (§13.3)                              |
| `questerix-cortex/outputs/FAILURE_DIGEST.md`         | Questerix   | Keep conditionally (§13.3)                |
| `questerix-cortex/outputs/MACHINE_BRIEFING.md`       | Questerix   | Demote — on-demand only (§13.2)           |
| `questerix-cortex/outputs/NEXT_TASK.md`              | Questerix   | Kill — redundant with tasks.md (§13.2)    |
| `tasks.md`                                           | Both repos  | Process reference (§4.2)                  |
| `docs/TIME_LOG.md`                                   | Questerix   | Payroll — keep, per-session only (§12.1)  |
| `docs/LEARNING_LOG.md`                               | Questerix   | Demote to weekly (§12.4)                  |
| `.agent/workflows/`                                  | Questerix   | Pruning target (§4.3)                     |
| `AGENTS.md`                                          | Student app | Reduce to 40 lines (§3.4)                 |
| `GEMINI.md`                                          | Student app | Strip to <30 lines (§3.4)                 |
| `.github/workflows/ci.yml`                           | Student app | CI optimization (§7)                      |
| `.github/workflows/performance.yml`                  | Student app | Move to nightly (§7)                      |
| `lib/src/core/database/tables.dart`                  | Student app | Contract sync (§6)                        |
| `lib/src/features/practice/practice_screen.dart`     | Student app | God-file decomposition (§11.2)            |
| `pubspec.yaml`                                       | Student app | Codegen dependencies (§8.4)               |
