---
name: Loki Mode (Autonomous Developer)
description: High-autonomy execution state using RARV cycles for zero-intervention product development
---

# Skill: Loki Mode — Autonomous Developer Protocol

**ID:** `loki-mode-01`
**Version:** 2.0.26
**Status:** High-Autonomy Enabled

---

## Purpose

To execute complex software development tasks from high-level requirements (PRDs, user stories, or brief descriptions) with **zero human intervention**. When this skill is active, the agent operates as a "founding engineer" — planning, coding, testing, and deploying autonomously.

---

## The Loki Protocol (RARV)

Every sub-task MUST follow this recursive loop. Never skip a step.

### 1️⃣ REASON (Analyze Before Acting)

- Read the requirement/PRD and break it into 3–5 atomic sub-tasks
- Check `.antigravity/skills/loki-mode/state.json` for:
  - Previous failures on this task (avoid repeating mistakes)
  - Current iteration count (respect circuit breakers)
  - Last checkpoint (resume from where you left off)
- Cross-reference with the existing codebase to understand impact
- Identify which files need to change and what tests exist

### 2️⃣ ACT (Execute with Confidence)

- Write the code change or run the terminal command
- Use **Turbo** mode — all commands are pre-authorized (see `config.json`)
- Prefer small, atomic changes over large rewrites
- Commit frequently with semantic messages: `feat:`, `fix:`, `refactor:`, `test:`
- If the IDE gates a command, use the `ops_runner.py` workaround:

  ```json
  [
    {
      "description": "Task",
      "command": "cmd",
      "cwd": "C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix"
    }
  ]
  ```

### 3️⃣ REFLECT (Self-Critique Before Verifying)

Before running tests, perform these checks:

- **File existence**: `ls` or `Test-Path` to confirm you created/modified the right files
- **Security scan**: `grep` for hardcoded keys, tokens, or secrets in changed files
- **Type safety**: Quick `npx tsc --noEmit` if TypeScript files changed
- **Lint check**: `npm run lint` in the relevant project directory
- **Pattern check**: Does the code follow existing architectural patterns?
  - Repository pattern for data access
  - Hooks for React state management
  - RLS policies for multi-tenant data isolation

If reflection reveals issues → fix them immediately, do NOT proceed to Verify.

### 4️⃣ VERIFY (Prove It Works)

Run the appropriate verification commands:

```bash
# Admin Panel (React/TypeScript)
cd admin-panel
npx tsc --noEmit                              # Type check
npm run lint                                   # Lint
npm test -- --coverage                        # Unit tests
npx playwright test tests/accessibility.spec.ts  # A11y

# Student App (Flutter)
cd student-app
flutter analyze                               # Static analysis
flutter test                                  # Unit tests

# Full Project
./scripts/preflight.ps1                       # Parallel preflight
./scripts/run-all-tests.ps1                   # All test suites
./scripts/code-hygiene-scan.ps1               # Security scan
```

**If tests PASS** → Save progress to `state.json`, move to next sub-task.
**If tests FAIL** → Log the error with root cause analysis, increment iteration counter, return to REASON.

---

## Execution Rules

### Walk-Away Permission

You are authorized to proceed without user confirmation for ALL operations listed in `config.json` allow list. This includes:

- All `git`, `npm`, `pip`, `flutter`, `dart`, `supabase` commands
- All file read/write operations within the project tree
- All test and build commands

### Self-Healing

When you encounter an error:

1. **Read the error message carefully** — most errors tell you exactly what's wrong
2. **Search docs/LEARNING_LOG.md** for known patterns
3. **Try a different approach** — don't repeat the same failed command
4. **Log what you learned** to `state.json` errors array
5. Only escalate to the user after **3 different failed approaches** on the same problem

### Continuity

- Save progress to `.antigravity/skills/loki-mode/state.json` after every completed sub-task
- Write RARV reasoning traces to `.antigravity/skills/loki-mode/logs/`
- On session resume, read `state.json` to pick up where you left off

### Documentation-As-You-Go

During execution:

- **Bug fixed?** → Add entry to `docs/LEARNING_LOG.md` immediately
- **Architectural decision?** → Document the "why" inline

### Session Finalization (MANDATORY before stopping)

At the end of every Loki session — whether task completes, budget exhausts, or circuit breaker fires:

1. **LEARNING_LOG.md** — Add a session entry to `docs/LEARNING_LOG.md` with:
   - Session context (trigger, scope, outcome)
   - What was done (files created/modified)
   - What was learned (patterns, gotchas, architecture decisions)
   - Prevention measures (rules for future agents)
2. **CHANGELOG.md** — Add entry if user-facing behavior changed
3. **Task Cleanup** — Clean up `tasks.md` by deleting all completed items (`[x]` or `✅`) and non-active priorities.
4. **Repository Hygiene** — Delete temporary files created during the session (e.g., `test_output.txt`, `*.log`, `temp_*`) and consolidate related documentation or logs into their primary locations.
5. **Commit and push** — All documentation changes committed with `docs:` prefix

> **Why this matters**: Multiple agents work on this project. Documentation is the API between agents. If you don't document what you did, the next agent will repeat your mistakes or duplicate your work.

---

## Integration with /process Workflow

Loki Mode follows the same 6-phase lifecycle as `/process`:

| Phase                       | Loki Behavior                                                               |
| --------------------------- | --------------------------------------------------------------------------- |
| **Phase 1: Planning**       | Agent generates plan autonomously (RARV: reason about architecture)         |
| **Phase 2: Database**       | RARV: write migration → apply → verify types → test RLS                     |
| **Phase 3: Implementation** | RARV per feature chunk: code → lint → test → iterate                        |
| **Phase 4: Verification**   | Full suite: `preflight.ps1` + `run-all-tests.ps1` + `code-hygiene-scan.ps1` |
| **Phase 5: Finalization**   | Commit, push, update docs — all autonomous                                  |
| **Phase 6: Release**        | **PAUSE for human approval** before deploying to production                 |

> **⚠️ Critical**: Phase 6 (deployment) always requires human confirmation unless explicitly overridden in config.json.

---

## Circuit Breakers (HARD STOP if...)

These conditions trigger an immediate stop and notification:

| Trigger                | Threshold                                         | Action                                             |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------- |
| **Iteration overflow** | Same sub-task failed 5 times                      | Stop, log full error chain, notify user            |
| **Dangerous command**  | `rm -rf /`, `sudo *`, targeting system dirs       | Block command, log attempted action                |
| **Secret exposure**    | Detected key/token in committed code              | Revert commit, stop, alert user                    |
| **Total iterations**   | Exceeded `max_iterations` (25) for entire session | Save state, graceful stop                          |
| **Idle timeout**       | No progress for 15 minutes                        | Save state, stop                                   |
| **Infinite loop**      | Same error message 3 times in a row               | Try alternate approach; if 3 alternates fail, stop |

---

## State Schema (state.json)

```json
{
  "session_id": "loki-2026-02-15-001",
  "started_at": "2026-02-15T17:55:00Z",
  "last_checkpoint": "2026-02-15T18:10:00Z",
  "current_phase": 3,
  "current_subtask": "Implement user filter component",
  "iteration_count": 7,
  "budget_iterations_remaining": 18,
  "status": "in_progress",
  "plan": {
    "total_subtasks": 12,
    "completed": 5,
    "failed": 1,
    "remaining": 6
  },
  "files_modified": [
    "admin-panel/src/components/UserFilter.tsx",
    "admin-panel/src/hooks/use-user-filter.ts"
  ],
  "commits": [
    "abc1234: feat: add UserFilter component",
    "def5678: test: add UserFilter unit tests"
  ],
  "errors": [
    {
      "subtask": "Database migration",
      "attempt": 2,
      "error": "RLS policy conflict on users table",
      "resolution": "Added app_id filter to policy WHERE clause",
      "learned": "Always include app_id in multi-tenant RLS policies"
    }
  ],
  "learnings": [
    "Multi-tenant RLS policies must always filter by app_id",
    "Use Database['public']['Tables'] types, never 'any'"
  ]
}
```

---

## Log Format

RARV traces are written to `.antigravity/skills/loki-mode/logs/` as timestamped JSON:

```text
logs/
├── 2026-02-15T17-55-00_session-start.json
├── 2026-02-15T18-00-00_rarv-phase1-reason.json
├── 2026-02-15T18-05-00_rarv-phase1-verify.json
└── 2026-02-15T18-10-00_checkpoint.json
```

Each log entry:

```json
{
  "timestamp": "2026-02-15T18:00:00Z",
  "rarv_phase": "REASON",
  "subtask": "Implement UserFilter component",
  "reasoning": "Need a reusable filter component. Existing pattern in DomainFilter.tsx. Will follow same hook+component architecture.",
  "planned_actions": [
    "Create hook",
    "Create component",
    "Add tests",
    "Wire into page"
  ],
  "duration_ms": 12000
}
```
