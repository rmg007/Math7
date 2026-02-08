# AI Coding Instructions

> **New agent?** Start with [`AGENT_QUICKSTART.md`](AGENT_QUICKSTART.md) for fast knowledge discovery, then return here for the full rules.

This repository is contract-driven. Use the repo’s contracts (Makefile, CI workflows, validation scripts, migrations/RLS checks) as the primary source of truth for “how to work here.”

## Authority order (highest to lowest)

1. `docs/strategy/AGENTS.md`
2. `kb_registry` (Supabase AI Performance Registry - Highest technical truth)
3. **`docs/standards/ORACLE_COGNITION.md`** - IDD Protocol & coding standards
4. `AI_CODING_INSTRUCTIONS.md` (this file) - Agent rules & workflows
5. `docs/technical/SCHEMA.md` (explanatory reference; migrations are executable truth)
6. `PHASE_STATE.json`
7. `docs/specs/*`
8. `best_practices.md`
9. `SECURITY.md`
10. `README.md`
11. Everything else

If two sources conflict, follow the highest-ranked source.

## IDD Protocol Compliance (MANDATORY)

**All code written by AI agents MUST follow the Integrity-Driven Development (IDD) Protocol** defined in `docs/standards/ORACLE_COGNITION.md`.

### Quick IDD Reference:
1. **Contract Analysis** → Define purpose, contracts, failure boundary
2. **Threat Modeling** → List 5 failure vectors (Input Abuse, State Corruption, Dependency Failure, Resource Exhaustion, Security Surface)
3. **Test-First** → Write ✅💥⏱️🔄 tests before implementation
4. **Strategy Selection** → Evaluate 2+ approaches, choose resilient over clever
5. **Silent Failure Hunt** → No empty catches, ambiguous nulls, or swallowed errors

See `.cursorrules` for the complete IDD constitution.


## HARD RULES (NON-NEGOTIABLE)

1. **NEVER PUBLISH LANDING-PAGES**: Deployment of the `landing-pages` directory is strictly prohibited.
2. **NEVER DEPLOY TO questerix.com**: Do not ever attempt to deploy or publish anything to the root domain `https://questerix.com/`. 
3. **DEVELOPMENT ONLY**: The project is currently in the development & testing phase. Any automated or manual deployment script MUST skip landing page tasks.

## AI Performance Protocol (Database First)

To minimize latency and avoid expensive file system scans, the agent MUST follow this query hierarchy:

1. **Deterministic Registry**: Query the `kb_registry` table for project names, types, platforms, and tech stacks.
2. **System Summary**: Use `SELECT * FROM get_ai_system_summary()` for a high-level overview of the ecosystem.
3. **Core Metrics**: Query `kb_metrics` for line counts, file counts, and language distribution.
4. **Semantic Search**: Use `scripts/knowledge-base/query-docs.ts` (Project Oracle) for unstructured documentation search.
5. **File System Scan**: Use `list_dir` or `find_by_name` ONLY if the information is missing from the database or requires real-time source code inspection.

**Never scan `node_modules`, `.dart_tool`, `build`, or `dist` directories.**

## Repository contracts you must follow

### Command Execution & Autonomy
- **ALWAYS** reference `.cursorrules` and `.agent/workflows/autopilot.md` for approved command patterns.
- Command whitelists are defined in `.cursorrules`.
- You are authorized to use any command pattern defined in these files.
- If a command fails due to permission, check if it matches a `// turbo` pattern in `autopilot.md` and adjust the syntax to match the whitelist exactly.
- **IDE Requirement**: Antigravity IDE must have "Terminal execution policy" set to "Turbo" for autonomous execution to work. See `.agent/workflows/autopilot.md` for setup instructions.

### Autonomous Task Finalization
- You must follow the **Autonomous Task Finalization** protocol defined in `docs/strategy/AGENTS.md` before marking any task as complete.
- This includes mandatory testing, refactoring, and documentation updates without asking for permission.

### Workflow Slash Commands (Trust & Verify System)
Use these commands for structured task execution:

| Command | Purpose |
|---------|---------|
| `/help` | Show all available workflows |
| `/intake` | Define problem + acceptance criteria |
| `/plan` | Create implementation plan |
| `/implement` | Execute code changes with evidence |
| `/verify` | Run tests + lint + analyze (REQUIRED) |
| `/docs` | Update documentation minimally |
| `/pr` | Generate PR description |
| `/postmortem` | Learn from bugs |
| `/blocked` | Report blockers |
| `/resume` | Continue previous work |

**Evidence Requirement**: Every workflow completion MUST include file paths, commands executed, and test results. See `.agent/workflows/*.md` for details.

### Run/test contract

- Use the `Makefile` targets whenever possible.
- Dev servers must bind to `0.0.0.0` (not `localhost`) to support remote dev environments.

### CI/validation contract

- CI gates are defined in:
  - `.github/workflows/ci.yml`
  - `.github/workflows/validate.yml`
- Phase validation scripts live in `scripts/validate-phase-*.sh|ps1`.
- `STRICT=1` is enforced in CI. Skips that are allowed locally become failures in CI.

### Database security contract

- Supabase is the backend.
- RBAC is enforced in the database via RLS/policies (not just UI).
- `supabase/scripts/verify_rls.sql` is the security verification harness.

## Locked technology decisions (do not change without explicit approval)

- **Student app**: Flutter.
- **State management (Flutter)**: Riverpod only.
- **Admin panel**: React + Vite + TypeScript.
- **Server state (React)**: `@tanstack/react-query` v5.
- **Backend**: Supabase.

## Key implementation conventions

- **Offline-first**: local writes first, then sync.
- **Soft delete + timestamps**: tables use `updated_at` and `deleted_at` for sync.
- **Student attempt submission**: use the `batch_submit_attempts` RPC (not direct REST writes to `attempts`).

## Testing Conventions

### Flutter Widget Tests
- **Stream Mocking**: Avoid using `Stream.empty()` or `Stream.value()` for mocking repositories that feed `StreamBuilder`. These often complete too quickly (race condition) or confusingly for the widget tester.
- **Preferred Pattern**: Use `StreamController`.
  ```dart
  // Setup
  final controller = StreamController<T>();
  addTearDown(() => controller.close()); // Critical: prevent leaks
  when(() => mockRepo.watchData()).thenAnswer((_) => controller.stream);
  
  // Test Loading
  await tester.pumpWidget(buildApp());
  await tester.pump(); // Pump a frame (don't settle)
  expect(find.byType(LoadingWidget), findsOneWidget);
  
  // Test Data
  controller.add(data);
  await tester.pumpAndSettle();
  expect(find.text('Data'), findsOneWidget);
  ```

### E2E Tests (Playwright)
- **Data Seeding**: Never rely on pre-existing database state. Use `seed-test-data.ts` in `beforeAll` hooks to ensure a consistent test environment.
- **Port config**: Explicitly target port `5000` for local dev server consistency.

## Safe change principles

- Prefer small, reviewable change sets.
- Do not introduce new libraries, patterns, or architecture unless the contracts/specs explicitly allow it.
- Do not weaken security or rely on UI-only checks for admin access.

## Where to look for “how to do X”

- Local development: `docs/technical/DEVELOPMENT.md`
- CI expectations and Strict mode: `docs/operational/CI_CONTRACT.md`
- **Deployment**: `docs/operational/DEPLOYMENT_PIPELINE.md`
- Validation scripts: `scripts/validate-phase-*.sh` and `scripts/common.sh`
- Database schema and RLS: `supabase/migrations/*.sql` and `supabase/scripts/verify_rls.sql`

### Phase 5: Cleanup & Report
- Removes generated environment files
- **Syncs AI Performance Registry**: Updates `kb_registry` and `kb_metrics` in Supabase
- Displays deployment summary with live URLs
- Logs all output to `deploy-{timestamp}.log`

## Deployment Pipeline

The project uses a unified deployment orchestrator for deploying all three applications (Landing Pages, Admin Panel, Student App) to Cloudflare Pages.

### Key Files
- `master-config.json` - Single source of truth for all environment variables
- `orchestrator.ps1` - Main deployment script (PowerShell)
- `scripts/deploy/` - Supporting deployment scripts
- `.secrets.template` - Template for local secrets file

### Environment Configuration
- **Flutter/Student App**: Uses `lib/src/core/config/env.dart` for environment access
- **React/Admin Panel**: Uses `src/config/env.ts` for environment access
- **Configuration Source**: All values flow from `master-config.json`

### Deployment Commands
```powershell
# Full deployment
./orchestrator.ps1

# Staging deployment  
./orchestrator.ps1 -Env staging

# Dry run (validate only)
./orchestrator.ps1 -DryRun
```

See `docs/operational/DEPLOYMENT_PIPELINE.md` for complete documentation.
