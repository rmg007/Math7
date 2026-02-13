# 🔧 CI/CD Hygiene & Workflow Cleanup Plan

**Date**: 2026-02-12
**Repository**: `https://github.com/rmg007/Questerix.git`
**Goal**: Eliminate CI noise, close automated issue spam, disable broken/unneeded workflows, get `main` back to green

---

## 🔍 Diagnosis: What's Actually Wrong

### The Root Cause: A Self-Inflicting Failure Cascade

The repository has **38 GitHub Actions workflow files**. Many of them are triggering
off each other via `workflow_run` events, creating a **failure cascade**:

```
push to main
 → 8 workflows trigger (CI, Validation, Lighthouse, Bundle Size, etc.)
 → ALL of them fail (various reasons)
 → CI Repair Dispatch triggers once PER failure (8×)
 → CI Repair Dispatch itself fails → more CI Repair Dispatch triggers
 → CI Auto-Fix triggers on failures → also fails → more cascading
 → Checkly Autonomous Monitoring triggers → also fails
 → Each failure creates a [REPAIR] GitHub Issue
```

**Result**: A single push to `main` creates ~20-30 failed workflow runs and
5-10 new GitHub Issues. After a few pushes, you get thousands of failures
and hundreds of issues.

### By the Numbers

| Metric                           | Count    | Source                    |
| -------------------------------- | -------- | ------------------------- |
| Total open GitHub Issues         | **80**   | `gh api`                  |
| [REPAIR] issues (auto-generated) | **66**   | ci-repair label           |
| ZAP Scan Report issues           | **9**    | search query              |
| Other automated issues           | **5**    | automated label           |
| Human-created issues             | **0**    | —                         |
| Failed runs on `main` (last 200) | **200+** | `gh run list`             |
| In-progress runs (stuck)         | **9**    | All Coverage Tracking     |
| Workflow files                   | **38**   | .github/workflows/        |
| Cron-scheduled workflows         | **7**    | Running on timers         |
| `workflow_run` cascade triggers  | **6**    | Creating cascade failures |

### Security Status (The Real Alerts)

| Type                                  | Open Count   | Severity    | Action Needed                                     |
| ------------------------------------- | ------------ | ----------- | ------------------------------------------------- |
| Secret scanning: Google API Key       | 1            | 🔴 CRITICAL | Rotate key                                        |
| Secret scanning: Supabase Service Key | 1            | 🔴 CRITICAL | Rotate key                                        |
| Secret scanning: Supabase PAT         | 1            | 🔴 CRITICAL | Rotate token                                      |
| Secret scanning: MessageBird API Key  | 1            | 🟡 MEDIUM   | Rotate if in use                                  |
| Code scanning (CodeQL)                | 3            | 🟡 WARNING  | Race conditions in scrub.js, stack trace exposure |
| Dependabot alerts                     | **DISABLED** | —           | Not the source of the 248 you saw                 |

> **Note**: The "248 security issues" the user saw may have been from the GitHub
> Security Overview which aggregates issues, ZAP reports, and dependabot across
> all branches. With branches deleted, many of those are now gone.

---

## 🎯 Execution Plan (6 Phases)

### Phase 1: Stop the Bleeding — Cancel In-Progress Runs

9 Coverage Tracking runs are stuck in-progress, burning CI minutes.

```powershell
# Cancel all in-progress runs
gh run list --status in_progress --limit 50 --json databaseId --jq '.[].databaseId' |
  ForEach-Object { gh run cancel $_ }
```

**Risk**: ZERO — these are stuck and will never complete.

---

### Phase 2: Disable the Cascade Workflows

These workflows create more failures than they fix. Disable them IMMEDIATELY:

| Workflow                     | Why Disable                                               | Monthly Waste |
| ---------------------------- | --------------------------------------------------------- | ------------- |
| `ci-repair-dispatch.yml`     | Creates ~93 failed runs on main, cascades infinitely      | CRITICAL      |
| `ci-auto-fix.yml`            | Triggers on failures, fails itself, creates more cascades | CRITICAL      |
| `checkly-deploy.yml`         | Runs every 6 hours, fails, triggers CI Repair Dispatch    | HIGH          |
| `ci-recover-button.yml`      | Part of the cascade                                       | MEDIUM        |
| `workflow-health.yml`        | Reports health but triggers cascade                       | MEDIUM        |
| `platform-health-report.yml` | Part of cascade chain                                     | MEDIUM        |

**Method**: Disable via GitHub API (not delete — we can re-enable later):

```powershell
$cascadeWorkflows = @(
  "ci-repair-dispatch.yml",
  "ci-auto-fix.yml",
  "checkly-deploy.yml",
  "ci-recover-button.yml",
  "workflow-health.yml",
  "platform-health-report.yml"
)

foreach ($wf in $cascadeWorkflows) {
  gh workflow disable $wf
}
```

**Risk**: LOW — These can be re-enabled with `gh workflow enable <name>`.

---

### Phase 3: Disable Non-Essential Scheduled Workflows

These run on cron but consistently fail:

| Workflow           | Schedule      | Why Disable                     |
| ------------------ | ------------- | ------------------------------- |
| `dast.yml`         | Daily 1 AM    | ZAP scans creating noise issues |
| `auto-cleanup.yml` | Daily 2 AM    | Auto-cleanup failing            |
| `dead-code.yml`    | Weekly Sunday | Not critical                    |
| `duplication.yml`  | Weekly Monday | Not critical                    |
| `license-sbom.yml` | Weekly Sunday | Creates branches that fail      |
| `security.yml`     | Weekly Sunday | Failing consistently            |

```powershell
$scheduledWorkflows = @(
  "dast.yml",
  "auto-cleanup.yml",
  "dead-code.yml",
  "duplication.yml",
  "license-sbom.yml",
  "security.yml"
)

foreach ($wf in $scheduledWorkflows) {
  gh workflow disable $wf
}
```

**Risk**: LOW — These are convenience workflows, not core CI.

---

### Phase 4: Disable Additional Non-Core Workflows

These workflows add complexity without current value:

| Workflow                    | Why Disable                                      |
| --------------------------- | ------------------------------------------------ |
| `production-monitoring.yml` | Monitoring a stack that's still being stabilized |
| `staging-migrations.yml`    | No staging environment active                    |
| `visual-regression.yml`     | No baseline screenshots to compare against       |
| `screenshot-diff.yml`       | Same as above                                    |
| `preview-testing.yml`       | Preview deployments not set up                   |
| `lighthouse.yml`            | Nice to have, not essential now                  |
| `bundle-size.yml`           | Nice to have, not essential now                  |
| `changelog.yml`             | Can run manually when needed                     |
| `docs-index.yml`            | Can run manually when needed                     |
| `oracle-index.yml`          | Can run manually when needed                     |
| `deepsource.yml`            | DeepSource integration creating noise            |
| `pr-agent.yml`              | AI PR review not needed during stabilization     |
| `auto-label.yml`            | Auto-labeling can wait                           |
| `auto-format.yml`           | Can format manually or via pre-commit hooks      |
| `commit-lint.yml`           | Can lint manually                                |
| `developer-experience.yml`  | DX convenience, not essential                    |

```powershell
$nonEssentialWorkflows = @(
  "production-monitoring.yml",
  "staging-migrations.yml",
  "visual-regression.yml",
  "screenshot-diff.yml",
  "preview-testing.yml",
  "lighthouse.yml",
  "bundle-size.yml",
  "changelog.yml",
  "docs-index.yml",
  "oracle-index.yml",
  "deepsource.yml",
  "pr-agent.yml",
  "auto-label.yml",
  "auto-format.yml",
  "commit-lint.yml",
  "developer-experience.yml"
)

foreach ($wf in $nonEssentialWorkflows) {
  gh workflow disable $wf
}
```

**Risk**: LOW — All re-enableable. We keep only the essential workflows below.

---

### Phase 5: Close All Automated Issues

80 issues, ALL auto-generated. Close them in bulk with a comment explaining why:

```powershell
# Close all ci-repair issues
gh issue list --label "ci-repair" --state open --limit 500 --json number --jq '.[].number' |
  ForEach-Object {
    gh issue close $_ --comment "Bulk closed during CI hygiene cleanup (2026-02-12). The CI cascade that generated these issues has been disabled. See docs/reports/CI_HYGIENE_PLAN.md for details."
  }

# Close ZAP report issues
gh issue list --search "ZAP Full Scan Report" --state open --limit 100 --json number --jq '.[].number' |
  ForEach-Object {
    gh issue close $_ --comment "Bulk closed during CI hygiene cleanup. DAST workflow disabled — will re-enable when infrastructure is stable."
  }

# Close remaining automated issues
gh issue list --label "automated" --state open --limit 500 --json number --jq '.[].number' |
  ForEach-Object {
    gh issue close $_ --comment "Bulk closed during CI hygiene cleanup (2026-02-12)."
  }
```

**Risk**: ZERO — All auto-generated, zero human issues. Can be reopened if needed.

---

### Phase 6: Secret Rotation (CRITICAL)

4 exposed secrets detected by GitHub Secret Scanning:

| Secret                    | Action                                                 |
| ------------------------- | ------------------------------------------------------ |
| Google API Key (#5)       | Rotate in Google Cloud Console → update GitHub Secrets |
| Supabase Service Key (#4) | Rotate in Supabase Dashboard → update GitHub Secrets   |
| Supabase PAT (#2)         | Rotate in Supabase Account → update GitHub Secrets     |
| MessageBird API Key (#1)  | Check if in use → rotate or revoke                     |

**⚠️ This requires manual action — API keys must be rotated in the respective dashboards.**

This phase is flagged but NOT automated — user needs to handle key rotation.

---

## ✅ Workflows to KEEP Enabled (Essential Core Only)

After cleanup, only these workflows remain active:

| #   | Workflow                | Purpose                      | Trigger  |
| --- | ----------------------- | ---------------------------- | -------- |
| 1   | `ci.yml`                | Core CI — tests, lint, build | push, PR |
| 2   | `validate.yml`          | Validation checks            | push, PR |
| 3   | `admin-panel-e2e.yml`   | E2E tests                    | push, PR |
| 4   | `flutter-builds.yml`    | Flutter CI                   | push, PR |
| 5   | `type-generation.yml`   | Supabase type gen            | push, PR |
| 6   | `coverage-tracking.yml` | Coverage tracking            | push     |
| 7   | `database.yml`          | Database safety              | push, PR |
| 8   | `gitleaks.yml`          | Secret leak prevention       | push, PR |
| 9   | `semgrep.yml`           | Static analysis              | push, PR |
| 10  | `secrets.yml`           | Secret scanning              | push, PR |

**10 workflows kept** out of 38 = **74% reduction in CI complexity**.

---

## 🔄 Rollback Procedures

### Re-enable a disabled workflow:

```powershell
gh workflow enable <workflow-file.yml>
```

### Reopen closed issues (if needed):

```powershell
gh issue reopen <issue-number>
```

### Full rollback — re-enable everything:

```powershell
gh workflow list --all --json name,state --jq '.[] | select(.state == "disabled_manually") | .name' |
  ForEach-Object { gh workflow enable $_ }
```

---

## 📝 Execution Log

| Phase                     | Time (PST) | Status     | Notes                                                            |
| ------------------------- | ---------- | ---------- | ---------------------------------------------------------------- |
| 1 — Cancel stuck runs     | 18:42      | ✅ DONE    | 9 Coverage Tracking runs cancelled                               |
| 2 — Disable cascade       | 18:43      | ✅ DONE    | 6 cascade workflows disabled                                     |
| 3 — Disable scheduled     | 18:44      | ✅ DONE    | 6 cron workflows disabled                                        |
| 4 — Disable non-essential | 18:45      | ✅ DONE    | 16 non-essential workflows disabled                              |
| 5 — Close issues          | 18:47      | ✅ DONE    | 80 issues closed via ops_runner (66 ci-repair + 9 ZAP + 5 other) |
| 6 — Secret rotation       | —          | ⚠️ FLAGGED | 4 secrets need manual rotation by user                           |

---

## 📚 Lessons Learned

### 1. `workflow_run` Cascades Are a Ticking Time Bomb

**Problem**: 6 workflows used `workflow_run` triggers. When a primary workflow fails,
each `workflow_run` listener fires. If the listener also fails, it triggers MORE listeners.
This is an exponential cascade.
**The math**: 1 push → 8 failures → 93 CI Repair Dispatch failures → 66 GitHub Issues.
**Fix**: Never chain `workflow_run` without a circuit breaker or maximum retry limit.

### 2. "Self-Healing CI" Can Become Self-Harming CI

**Problem**: The CI Repair Dispatch was designed to auto-create repair issues. But since
the underlying workflows were broken, it just created spam. The CI Auto-Fix tried to
auto-fix failures but also failed, creating more cascade events.
**Lesson**: Self-healing systems need a "give up" threshold. After N failures on the
same signature, the system should stop, not keep trying.

### 3. Scheduled Workflows Need a Health Check Gate

**Problem**: 7 cron workflows ran daily/weekly regardless of repo health. When landing-pages
was deleted, the bundle-size and formatting workflows kept running against non-existent code.
**Lesson**: Every scheduled workflow should have a "pre-flight" step that checks if its
target project/directory exists before running.

### 4. Zero Human Issues = 100% Noise

**Problem**: All 80 open issues were auto-generated. Not a single human-created issue existed.
**Lesson**: When automation generates more noise than signal, the automation is wrong, not the
developer ignoring it. If no human ever reads an auto-created issue, the issue shouldn't exist.

### 5. Start Lean, Add Complexity When Needed

**Problem**: 38 workflows for a project in active development is too many. Most of them
(lighthouse, visual regression, screenshot diff, DAST) are "nice to have" for a production
app with stable CI — not for a project still being built.
**Lesson**: Start with 5-10 core workflows. Add fancy ones only when the basics are green.

---

## ✅ Final Verified State

- **Active workflows**: 10 core + 3 GitHub-managed (down from 38) ✅
- **Open issues**: **0** (down from 80) ✅
- **In-progress stuck runs**: **0** (down from 9) ✅
- **Cascade failure loops**: **Eliminated** ✅
- **Secrets to rotate**: 4 (flagged for manual rotation) ⚠️
- **CI complexity reduction**: **74%**
- **Issue noise reduction**: **100%**

### Active Workflows Registry

| Workflow                | Type       | Why Kept                            |
| ----------------------- | ---------- | ----------------------------------- |
| `ci.yml`                | Core CI    | Primary test/lint/build pipeline    |
| `validate.yml`          | Validation | Schema and config validation        |
| `admin-panel-e2e.yml`   | Testing    | End-to-end test coverage            |
| `flutter-builds.yml`    | Build      | Mobile/web build verification       |
| `type-generation.yml`   | Codegen    | Supabase type safety                |
| `coverage-tracking.yml` | Quality    | Test coverage tracking              |
| `database.yml`          | Safety     | Database migration safety           |
| `gitleaks.yml`          | Security   | Prevent secret leaks in code        |
| `semgrep.yml`           | Security   | Static analysis for vulnerabilities |
| `secrets.yml`           | Security   | Secret scanning                     |

### Disabled Workflows (re-enable with `gh workflow enable <file>`)

28 workflows disabled. Full list in Phases 2-4 above.
