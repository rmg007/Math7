# GitHub Copilot Instructions

You are working on the **Math7** offline-first educational platform. This project follows a strict **"Docs-Driven Development"** protocol.

## 1. The Laws of This Repository
Before generating code/answers, you MUST consult the authority hierarchy:
1. **`AppShell/docs/AGENTS.md`**: The Execution Contract and Tech Stack. **Read this first.**
2. **`AppShell/docs/SCHEMA.md`**: The Database Truth.
3. **`PHASE_STATE.json`**: The current project status tracker.
4. **`AppShell/docs/specs/*`**: Detailed specifications for UI, API, and Data.

**Rule:** Do not guess business logic or schema. If it's not in the docs, check `PHASE_STATE.json`'s `resolved_clarifications` or ask the user.

## 2. Project Architecture & Stack
This is a monorepo with distinct component stacks:

- **Student App (`student-app/`)**:
  - **Framework**: Flutter >= 3.19.0 (Tablet target)
  - **State**: Riverpod ^2.5.0 (Providers for logic)
  - **Local DB**: Drift ^2.15.0 (Offline-first data layer)
  - **Auth**: Anonymous device-bound auth.

- **Admin Panel (`admin-panel/`)**:
  - **Framework**: React 18.2 + Vite 5
  - **UI System**: shadcn/ui + Tailwind CSS
  - **State**: React Query ^5.17.0
  - **Auth**: Supabase Auth (Email/Password)

- **Backend (`supabase/`)**:
  - **DB**: PostgreSQL 15+
  - **Logic**: Edge Functions, RLS Policies (Mandatory), RPCs.

## 3. Critical Workflows
- **Check Phase**: Always read `PHASE_STATE.json` to know the active phase.
- **Validation**: AFTER implementing features, run `scripts/validate-phase-N.ps1` (or `.sh`).
  - Example: `scripts/validate-phase-0.sh` for bootstrap.
- **Make Commands**: Use `Makefile` for standard ops:
  - `make web_dev`: Start Admin Panel.
  - `make flutter_run_web`: Start Student App.
  - `make db_verify_rls`: Check security policies.

## 4. Coding Conventions
- **Data Consistency**: All tables MUST have `updated_at` and `deleted_at` (Soft Delete) for sync.
- **RPC over REST**: Student App submits attempts via `batch_submit_attempts` RPC, not direct REST.
- **Flutter**: Use strictly typed Drift classes. Use Riverpod `AutoDispose` providers by default.
- **React**: Use functional components with Hooks. Prefer React Query for server state.

## 5. File Handling
- **Do NOT** modify `AGENTS.md` (it is the constitution).
- **Do NOT** modify `AppShell/docs/` unless explicitly instructed to update specs.
- **DO** update `PHASE_STATE.json` when a phase step is effectively completed and validated.
