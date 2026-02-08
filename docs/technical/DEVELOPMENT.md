# Development

This document explains how to set up and run the Math7 monorepo locally (Student App, Admin Panel, and Supabase).

## Repository layout

- `student-app/`: Flutter (tablet-first) student application (offline-first).
- `admin-panel/`: React + Vite + TypeScript admin dashboard.
- `supabase/`: Supabase project (migrations, seed, RLS verification scripts).
- `scripts/`: Phase validation scripts (cross-platform variants exist).

## Prerequisites

- **Node.js**: v18+ (CI uses Node 18).
- **Flutter**: 3.19.0+ (CI pins 3.19.0; local environments may use newer).
- **Docker**: required for local Supabase (`supabase start`) and Phase 1 validation.
- **Supabase CLI**: required for local DB workflows.
- **Android SDK**: only required for Android builds / Phase 4 strict validation.

## Environment files

- **Admin Panel**: copy `admin-panel/.env.example` to `admin-panel/.env`.
- **Student App**: copy `student-app/.env.example` to `student-app/.env`.

The `*.env.example` files in this repo are the canonical examples.

## Quickstart

Run `make help` to see the contract commands.

For the full local gate run (similar to CI), run:

- `make ci`

### Admin Panel

- Install dependencies:
  - `make web_setup`
- Run dev server (binds to `0.0.0.0:5173`):
  - `make web_dev`
- Lint / test / build:
  - `make web_lint`
  - `make web_test`
  - `make web_build`
- **End-to-End Tests**:
  - `cd admin-panel && npm run test:e2e:ui` (Interactive UI)
  - **Serial Mode**: Tests run in serial mode to avoid DB race conditions.
  - **Multi-Tenant**: Requires seeding at least one App and Domain (see `admin-panel/tests/setup-test-users.js`).
  - See `admin-panel/tests/INDEX.md` for full documentation.
- **UI Components**:
  - We use `shadcn/ui` for components.
  - See `docs/SHADCN_GUIDE.md` for usage instructions.

### Student App (Flutter)

- Install dependencies:
  - `make flutter_setup`
- Run codegen (Drift/Riverpod/etc):
  - `make flutter_gen`
- Analyze / test:
  - `make flutter_analyze`
  - `make flutter_test`
- Smoke test on web (binds to `0.0.0.0:3000`):
  - `make flutter_run_web`

### Landing Pages
- Install dependencies:
  - `cd landing-pages && npm install`
- Run dev server (binds to `localhost:5173`):
  - `npm run dev`
- Build & Lint:
  - `npm run build`
  - `npm run lint`
- **Subdomain Verification**:
  - Routing Logic relies on subdomain extraction (e.g., `math.math7.com` vs `math7.com`).
  - Locally, this is simulated via query parameter: `http://localhost:5173/?subdomain=math`.

### Database (Supabase)

- Start/stop local Supabase stack:
  - `make db_start`
  - `make db_stop`
- Apply migrations:
  - `make db_migrate`
- Reset local DB (destructive):
  - `make db_reset`
- Verify RLS:
  - `make db_verify_rls`

## Phase validation scripts

Phase validations are implemented as scripts in `scripts/`.

- Bash:
  - `./scripts/validate-phase--1.sh`
  - `./scripts/validate-phase-0.sh`
  - `./scripts/validate-phase-1.sh`
  - `./scripts/validate-phase-2.sh`
  - `./scripts/validate-phase-3.sh`
  - `./scripts/validate-phase-4.sh`

On Windows, prefer the PowerShell equivalents (`scripts/validate-phase-*.ps1`) when available.

## Logs & artifacts

Validation runs write logs to:

- `artifacts/validation/phase-<N>.log`

## Troubleshooting

- **Low disk space**: validation scripts may skip/fail when Docker or Android build artifacts require more space.
- **Supabase start failures**: ensure Docker is running and has enough free disk.
- **Ports/hosts**: dev servers are expected to bind to `0.0.0.0` (not `localhost`) per the repo contract.

## 🤖 Agent Workflows (Trust & Verify System)

This project uses an **evidence-based workflow system** that forces the AI to prove its work at specific checkpoints.

### Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/help` | Show all workflows | When you forget commands |
| `/intake` | Define problem + criteria | Start of any task |
| `/plan` | Create implementation plan | Before complex work |
| `/implement` | Execute code changes | The work phase |
| `/verify` | Run tests + lint + analyze | **Required before commit** |
| `/docs` | Update documentation | Only if needed |
| `/pr` | Generate PR description | Before creating PR |
| `/postmortem` | Learn from bugs | After any bug fix |
| `/blocked` | Report blockers | When stuck |
| `/resume` | Continue previous work | New session |

### Typical Workflow Patterns

**Simple Bug Fix:**
```
/implement → /verify → /pr
```

**Standard Feature:**
```
/intake → /plan → /implement → /verify → /docs → /pr
```

**After Production Bug:**
```
/postmortem (add regression test + lesson learned)
```

### Legacy Workflows (Still Available)

| Command | Purpose |
|---------|---------|
| `/autopilot` | Full autonomous execution mode |
| `/test` | Enterprise QA suite (7 phases) |

See `.agent/workflows/*.md` for detailed workflow instructions.

## 🧪 Testing Strategy

### Mobile / Student App
We use a **Hybrid Testing Approach** for speed and fidelity:

1.  **Windows Desktop (Fast Logic):**
    -   Used for rapid iteration of "Offline Sync" logic.
    -   ~10x faster startup than emulators.
    -   Verifies the exact same Drift/Supabase architecture as mobile.

2.  **Android Emulator (High Fidelity):**
    -   Used for final QA to verify **Feel**, **Animations**, and **Touch Inputs**.
    -   Target AVD: `Medium_Phone_API_36.1` (or similar).
    -   Required for validating "Offline" behavior in a realistic OS environment.

3.  **Authentication & Onboarding (Automated):**
    -   Verified via Widget Tests (`flutter test test/ui/app_flow_test.dart`).
    -   Tests the user journey in a controlled, mock-driven environment (no manual clicking required).
    -   **Under 13**: Verify "Parent Approval" flow triggers when birth year implies < 13.
    -   **Over 13**: Verify "Standard Signup" flow triggers when birth year implies >= 13.
    -   See `student-app/ARCHITECTURE.md` for flow details.

### Admin Panel
- **Playwright** is the source of truth for all regression testing.
- Tests are located in `admin-panel/tests/`.

## 🧩 Rules & Autonomy (.cursorrules)

We use a `.cursorrules` file at the root to define:
1.  **Command Whitelists**: Commands the agent can run without asking (e.g., `npm install`).
2.  **Autonomous Protocol**: Steps the agent must take before labeling a task complete (Test -> Static Analysis -> Refactor -> Docs).

Always refer to `.cursorrules` for the latest source of truth on agent permissions.

## 🧩 Model Context Protocol (MCP)

This project uses MCP servers to give the AI "Superpowers".
See [MCP_SETUP_GUIDE.md](MCP_SETUP_GUIDE.md) for installation and configuration.
