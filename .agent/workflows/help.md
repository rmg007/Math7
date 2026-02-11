# 🛠️ Questerix Workflow Guide

## ⚡ SUPERPOWER MODE (Start Here!)

Commands not auto-running? Use the workaround:

1. **Start watcher**: Double-click `START_WATCHER.bat`
2. **Use `/sp <action>`**: I output JSON
3. **Paste into `tasks.json`**: Watcher runs it

| Quick Command | Does |
|---------------|------|
| `/sp lint` | Lint all |
| `/sp test` | Run tests |
| `/sp ci` | Full CI |
| `/sp analyze` | Flutter analyze |
| `/sp push` | Git push |

---

## ⚡ Turbo Parallel Commands (Automated via Scripts)

These scripts run multiple checks in parallel to save 60-70% wall-clock time.

| Command | File Path | When to Use |
|---------|-----------|-------------|
| **Preflight** | `scripts/preflight.ps1` | Fast global validation (TSC, Lint, Analyze, Deps) |
| **Test All** | `scripts/run-all-tests.ps1` | Run EVERY test suite in the project simultaneously |
| **Hygiene** | `scripts/code-hygiene-scan.ps1` | Scan for secrets, empty catches, and leaks |
| **Certify** | `scripts/certify-evidence.ps1` | Collect all mechanical audit artifacts |
| **Sync Types** | `scripts/gen-types-verify.ps1` | Generate types + Compile check |

> **Automation Note**: These are now baked into `/process` and `/certify`. You rarely need to run them manually.

---

## 🚀 Primary Workflows

| Workflow | When to Use |
|----------|-------------|
| `/process` | Start new feature/task (99% of work) |
| `/certify` | Verify completed work |
| `/resume` | Continue after break (same agent) |
| `/continue` | Switch to different AI agent |
| `/autopilot` | Full autonomous mode |
| `/blocked` | Report blockers |
| `/forensics` | **Deep-Dive Forensic Audit & Security Sweep** |
| `/sp` | Quick commands via watcher |

## 💤 Session Management

| Command | When to Use |
|---------|-------------|
| `/sleep` | Ending your work session — saves state to HANDOVER.md |
| `/wake` | Starting a new session — restores state, health check, next step |
| `night mode` | Want minimal agent output (code-first, no filler) |
| `normal mode` | Want explanations back |

## 🧪 Testing

| Command | What It Does |
|---------|-------------|
| `npm run test:quick` | Tests only changed files, JSON output (fast) |
| `npm run test:full` | Full suite + coverage, JSON output |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:arch` | Architecture boundary tests |

---

## 📖 Workflow Details

### `/process` - Unified Development Lifecycle
1. Planning (interactive, no code)
2. Database (migrations, RLS)
3. Implementation (recursive fix loop)
4. Verification (tests, security)
5. Finalization (docs, git push)
6. Release (optional deploy)

### `/certify` - Independent Quality Audit
Run AFTER `/process` to verify with fresh eyes. Checks database, code quality, security, tests, performance, UX.

### `/resume` - Session Resumption
Detects TASK_STATE.json, uncommitted work, and resumes from correct phase.

### `/continue` - Agent Handoff
For switching AI agents mid-task. Validates state and resumes.

### `/autopilot` - Full Autonomous Execution
Enables all commands to auto-run (if IDE configured).

### `/blocked` - Report Blockers
Document what's stopping progress and partial achievements.

### `/forensics` - All-Seeing Auditor Protocol
**The "Nuclear Option" for Quality Control.** Runs a highly optimized, single-pass autopsy of the codebase. Subsumes `/audit`. Use this to detect structural rot (hollow files), zombie tests (hangs), and historical security vulnerabilities. **Optimized for speed — never scans node_modules.**

---

- **EFFICIENCY FIRST**: Never scan `node_modules`, `dist`, or `.git`. Always use surgicial search patterns (`-t`, `-g`).
- All workflows support superpower fallback
- When commands needed, I output JSON for `/sp` style paste
- Start watcher once, keep it running in background
- `/sleep` + `/wake` are automatic in `/default` — the agent will prompt you
- Say `night mode` anytime for terse, code-only responses
