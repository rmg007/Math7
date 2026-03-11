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

- [x] **PARITY-001**: Audit and reconcile field name discrepancies between Student App and Admin Panel Types. (Renamed `answered`->`response`, `points_earned`->`score_awarded`, added `user_activity`, `user_metadata`, etc to schema_master.sql, fixed `CurriculumStatus` filter).
- [x] **PARITY-002**: Align 'Blind' Tables (user_activity, curriculum_meta, etc.) with Admin Panel understanding. (Added definitions to schema_master.sql, verified presence in `database.types.ts` where applicable; `curriculum_meta` remains missing from types but is in master schema).
- [x] **PARITY-003**: Documented identified Feature Flags in `docs/FEATURE_FLAGS.md`.
- [x] **HARDEN-001**: Run Full Verification Suite for Admin Panel (Lint + TS + Tests)
- [x] **HARDEN-002**: Run Full Verification Suite for Student App (Analyze + Test). (Achieved 100% pass rate on 319+ tests, resolved Supabase init conflicts and pending timer issues).
- [x] **HARDEN-003**: Perform RLS Governance Audit for all new tables (`user_activity`, `user_metadata`, `purchases`). (Standardized on `current_app_id()`, added `super_admin` bypass, enforced `app_id` isolation, and hardened `curriculum_meta`/`curriculum_snapshots`).
- [x] **DEPLOY-001**: Pre-deployment Smoke Test for Mentorship Views in Production Staging (Fixed 54 tests, resolved redirects, and mocked REST endpoints for deterministic verification).
- [/] **DEPLOY-002**: Unified Deployment via `orchestrator.ps1` (Admin + Student)

## Session Handoff (2026-03-11)

### Status: GREEN

- **Student App**: All 319+ tests passing. Supabase initialization in tests is now safely handled. `ProgressScreen` refactored for better testability.
- **Admin Panel**: Parity audit complete. Schema discrepancies resolved in `schema_master.sql`.

### Next Steps for Coding Agent

1. **RLS Audit**: Start with task `HARDEN-003`. Review RLS policies in `supabase/migrations/` for the three new tables: `user_activity`, `user_metadata`, and `purchases`.
2. **Context**: These tables were added to support student gamification. Ensure that students can only see/edit their own records and that `app_id` isolation is enforced.
3. **Reference**: See `questerix-student-app\docs\LEARNING_LOG.md` for details on the Supabase test fix.

## Queued Tasks

- [ ] **SEC-AUDIT-001**: Check for hardcoded secrets or sensitive logs in both apps
- [ ] **PERF-AUDIT-001**: Optimize data fetching / skeleton UI in Student Details Page
