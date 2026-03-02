# Questerix — Tasks

> [!IMPORTANT]
> **CRITICAL RULES — NEVER BREAK**
>
> 1. **No Work Without Record**: NEVER perform any technical work (reading, coding, testing) unless it is recorded in this file.
> 2. **Task State Discipline**: Mark the current task with `[/]` (Active) and finished with `[x]` (Completed).
> 3. **Session Start**: Always acknowledge the active task at the start of every session.
> 4. **Documentation**: Append every completed session to `docs/LEARNING_LOG.md` with: Root Cause, Fix, and Prevention Rule.
> 5. **Lean Focused**: Delete all completed `[x]` tasks from this list at the end of every session.
> 6. **Task File Boundaries**: This file is for **ALL Questerix/Cortex work** (active + queued). Tasks that add or edit files inside `.future_projects_plan_out_of_scope/` belong in `.future_projects_plan_out_of_scope/futer_projects_plan_tasks.md`.
> 7. **Autonomous Command Execution**: YOU MUST ALWAYS run commands using `ops_runner.py` (via writing to `tasks.json` first as documented in `GEMINI.md`). This is a NON-NEGOTIABLE workaround to bypass IDE approval gates. NEVER run commands directly unless it's impossible.
> 8. **No Interactive CLI Agents**: NEVER invoke interactive CLI tools (e.g., `npx @anthropic-ai/claude-code`, full E2E test suites with watch mode) via `run_command` or `ops_runner.py`. They will hang the background job and waste time. Always generate a `HANDOFF.md` or instruct the USER to run it.
> 9. **Deployment Shortcut**: When the USER says "deploy", ALWAYS run: `./orchestrator.ps1 -Env production -ConfirmProd -Target admin-panel`.

## Active Sprint Tasks

- [/] Reliable Deploy Pipeline Implementation (Master Task)
  - [x] Track E: CI/CD Audit (Read-only)
  - [x] Track C: Notifications & Watchdog (New Scripts)
  - [x] Track B: Smoke Gate (New Script + Refactor)
  - [x] Track A: Refactor `run-all-tests.ps1` (Parallel Gate)
  - [x] Track D: Orchestrator Phase 5 & Deployment Log

## Queued Tasks

- [ ] **[LATER] Test Suite Refresh + Deploy + Cortex Deployment Logging**
  - Update all post-deployment tests to reflect the current API mocking strategy and route list
  - Run full test suite, commit, and deploy to Cloudflare
  - Add a structured deployment log file inside `questerix-cortex/outputs/` only (e.g. `DEPLOY_LOG.md`)
    - Log format: timestamp, phase results, Cloudflare deploy URL, test pass/fail summary
    - Must be cleaned regularly (keep only last N entries); no sensitive data
    - Log must NOT exist outside of `questerix-cortex/` — not in docs, not in repo root

## Completed Tasks

- [x] Brainstorming and Planning session with the User.
