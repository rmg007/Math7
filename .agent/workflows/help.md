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
| `/audit` | Security vulnerability scan |
| `/sp` | Quick commands via watcher |

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
Systematic codebase scan using vulnerability taxonomy.

---

## 💡 Tips

- All workflows support superpower fallback
- When commands needed, I output JSON for `/sp` style paste
- Start watcher once, keep it running in background
