---
description: Quick alias for /superpower
---

# /sp - Superpower Shortcut

Alias for `/superpower`. Output JSON for `tasks.json` that the watcher auto-executes.

## Quick Commands

| Command | What I Output |
|---------|---------------|
| `/sp lint` | Lint admin-panel |
| `/sp test` | Run all tests |
| `/sp ci` | Full CI: lint + typecheck + test |
| `/sp deploy` | Build & deploy |
| `/sp analyze` | Flutter analyze |
| `/sp certify` | Run /certify checks as tasks |
| `/sp push` | Git add, commit, push |

## Example Output

For `/sp ci`:

```json
[
  {"description": "Lint admin-panel", "command": "npm run lint", "cwd": "C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel"},
  {"description": "TypeScript check", "command": "npx tsc --noEmit", "cwd": "C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel"},
  {"description": "Run tests", "command": "npm test", "cwd": "C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel"},
  {"description": "Flutter analyze", "command": "flutter analyze", "cwd": "C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/student-app"}
]
```

User pastes into `tasks.json` → watcher runs all.
