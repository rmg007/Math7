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

## ⚡ Quickstart (Superpower Mode)

In this project, **ALL terminal commands** must be executed via the `ops_runner.py` pattern to bypass IDE restrictions and ensure consistent environments.

### The Golden Workflow

1.  **Define Task**: Create/update `tasks.json` with your command.
2.  **Execute**: Run `python ops_runner.py tasks.json`.

**Example `tasks.json`**:
```json
[
  {
    "description": "Start Admin Panel",
    "command": "npm run dev",
    "cwd": "C:/path/to/repo/admin-panel"
  }
]
```

### Admin Panel Commands
Use `tasks.json` to run these:

- **Setup**: `npm ci`
- **Dev**: `npm run dev` (binds to `0.0.0.0:5173`)
- **Lint/Test**: `npm run lint`, `npm run test`
- **Build**: `npm run build`
- **E2E**: `npm run test:e2e:ui` (Interactive)

### Student App Commands
Use `tasks.json` to run these:

- **Setup**: `flutter pub get`
- **Codegen**: `dart run build_runner build --delete-conflicting-outputs`
- **Analyze**: `flutter analyze`
- **Test**: `flutter test`
- **Run (Web)**: `flutter run -d chrome --web-port 3000`

### Database Commands
Use `tasks.json` to run these:

- **Start**: `supabase start`
- **Stop**: `supabase stop`
- **Reset**: `supabase db reset` (Destructive!)
- **Verify RLS**: `supabase db reset` then `supabase test db` (or custom script)

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

- **Operation Blocked?**: If a command is gated by the IDE, verify you are using `ops_runner.py`. Direct execution of `npm` or `flutter` may be restricted.
- **Low disk space**: Validation scripts may skip/fail if Docker needs space.
- **Supabase start failures**: Ensure Docker is running.
- **Ports/hosts**: Dev servers bind to `0.0.0.0` by contract.

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

## 🛠️ Development Automation (Quality Gates)

This project uses **Husky** and **lint-staged** to enforce quality standards locally before code reaches the remote repository.

### Pre-commit Hooks (Fast Fixes)
- **Timing**: < 5 seconds.
- **Scope**: Changed files only.
- **Actions**:
  - **Admin Panel**: Fixes linting (ESLint) and formatting (Prettier).
  - **Student App**: Formats Dart code (`dart format`).
  - **Global**: Formats JSON, Markdown, and YAML.

### Pre-push Hooks (Safety Net)
- **Timing**: 10-30 seconds.
- **Scope**: Project-wide sanity check.
- **Actions**:
  - **Admin Panel**: Runs TypeScript type-checking (`tsc --noEmit`).
  - **Student App**: Runs Flutter analysis (`flutter analyze`).
- **Bypass**: Use `git commit --no-verify` in emergencies.

### Local Setup
To initialize the automation hooks on a new machine:
```bash
# Bash
bash scripts/setup-automation.sh

# PowerShell
.\scripts\setup-automation.ps1
```

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
