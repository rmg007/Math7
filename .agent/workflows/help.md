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

## 🚀 Primary Workflows

| Workflow | When to Use |
|----------|-------------|
| `/process` | Start new feature/task (99% of work) |
| `/certify` | Verify completed work |
| `/resume` | Continue after break (same agent) |
| `/continue` | Switch to different AI agent |
| `/autopilot` | Full autonomous mode |
| `/blocked` | Report blockers |
| `/audit` | Quick security vulnerability scan |
| `/forensics` | **Deep-Dive Forensic Audit (Trust No One)** |
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

### `/audit` - Security Vulnerability Scan
Systematic codebase scan using vulnerability taxonomy. Use for quick reliability checks.

### `/forensics` - All-Seeing Auditor Protocol
**The "Nuclear Option" for Quality Control.** Use this when the system feels "buggy" or unstable. It assumes the repository is lying, checks for empty files (rot), zombie tests (hangs), and historical security confessions in migrations.

---

## 💡 Tips

- All workflows support superpower fallback
- When commands needed, I output JSON for `/sp` style paste
- Start watcher once, keep it running in background
- `/sleep` + `/wake` are automatic in `/default` — the agent will prompt you
- Say `night mode` anytime for terse, code-only responses
