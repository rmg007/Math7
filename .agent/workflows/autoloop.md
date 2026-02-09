---
description: High-Performance Asynchronous Execution Loop
---

# ⚡ /autoloop: Asynchronous "Fire-and-Forget" Protocol

This workflow enables the AI agent to execute complex command chains asynchronously without waiting for synchronous tool feedback, maximizing speed and minimizing token usage.

## 🚀 Concept
Instead of: `run_command` -> wait -> `read output` -> think -> `run_command`
We do: `write tasks.json` -> (User/Watcher executes) -> `read tasks.status.json` -> act.

## 🛠️ The Protocol

### 1. The Trigger
- When you need to run shell commands (npm, git, python, etc.), do NOT use `run_command` individually.
- Instead, **compile all planned commands** into a single `tasks.json` file.

### 2. The Manifest (`tasks.json`)
Write a JSON array to `tasks.json` in the project root:

```json
[
  {
    "description": "Install dependencies",
    "command": "npm install",
    "cwd": "path/to/cwd"  // optional, defaults to root
  },
  {
    "description": "Run tests",
    "command": "npm test",
    "cwd": "path/to/cwd"
  }
]
```

### 3. The Execution (User Side)
- If the user is running `python ops_runner.py --watch .`, execution starts immediately.
- If not, you may trigger it once with `run_command("python ops_runner.py tasks.json")`.

### 4. The Verification (AI Side)
- In the **NEXT TURN**, check for `tasks.status.json`.
- This file contains the exit code, stdout, and stderr for every command in the chain.

```json
{
  "overall_success": true,
  "results": [
    {
      "status": "success",
      "stdout": "...",
      "duration_ms": 1200
    }
  ]
}
```

## 🧠 Best Practices
1. **Batch Deeply**: Don't shy away from 10+ commands in a single manifest.
2. **Fail Fast**: The runner stops at the first failure (non-zero exit code). Order matters!
3. **Self-Healing**: If `tasks.status.json` shows a failure, read the `stderr`, fix the config/code, and write a new `tasks.json`.
4. **No Chatty Output**: You don't need to tell the user "I am running npm install". Just do it.

## ✅ When to use
- Installing packages
- Running test suites
- Large refactorings with multiple git operations
- Setting up new environments

// turbo-all
