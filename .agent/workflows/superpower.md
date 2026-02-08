---
description: AI generates tasks.json, ops_runner.py executes them automatically
---

# ⚡ Superpower Mode

**Problem**: IDE requires approval for every command AND file change.  
**Solution**: I output JSON → You paste into `tasks.json` → Watcher auto-executes.

## IDE Approvals Required

| Action | You Do |
|--------|--------|
| **File changes** | Click "Accept All" in IDE |
| **Commands** | Use watcher to bypass (see below) |

## Setup
1. `pip install watchdog` (once)
2. Double-click `START_WATCHER.bat` (or `python ops_runner.py --watch .`)
3. Leave it running

## Usage

Just say `/sp <action>`:

| Command | Does |
|---------|------|
| `/sp lint` | Lint admin-panel |
| `/sp test` | Run tests |
| `/sp ci` | Full CI |
| `/sp analyze` | Flutter analyze |
| `/sp build` | Build apps |
| `/sp deploy` | Deploy to cloud |
| `/sp push` | Git push |
| `/sp certify` | Run certification checks |

I output JSON → You paste → Watcher runs.

## Paths

```
Admin:   C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel
Student: C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/student-app
Root:    C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix
```

## Integration with Other Workflows

When using `/process`, `/certify`, `/resume`:
- I still guide you through the workflow phases
- For any commands, I output tasks.json instead of running directly
- You paste → watcher executes
