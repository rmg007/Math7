---
description: Autopilot - Full Autonomous Execution Mode
---

// turbo-all

# ⚡ /autopilot — Autonomous Execution Mode

> **Single Source of Truth for permissions**: `GEMINI.md` (user memory) is the canonical turbo permission list.
> This file is a thin activation shim — it does not duplicate the list.

---

## What This Does

Activates full autonomous mode. All commands are pre-authorized. The agent MUST set `SafeToAutoRun: true` for every `run_command` call. No command requires user approval.

**Permission list**: Defined once in `GEMINI.md` user memory under `// turbo-all`. Do not duplicate here.

---

## Superpower Fallback (If IDE Still Asks for Approval)

If the IDE ignores `SafeToAutoRun: true`, use the **ops_runner.py** workaround:

```json
[{ "description": "Task", "command": "cmd", "cwd": "C:/path/to/project" }]
```

Write to `tasks.json`, then:

// turbo

```powershell
python ops_runner.py tasks.json
```

See `/superpower` or `/sp` for quick command templates.

---

## 🐺 Loki Mode (Advanced Autonomy)

For full autonomous development with **RARV cycles**, **self-healing**, and **circuit breakers**, use `/loki`.

Loki Mode extends Autopilot with:

- **RARV Loop**: Reason → Act → Reflect → Verify (recursive per sub-task)
- **Persistent State**: Saves progress to resume across sessions
- **Circuit Breakers**: Auto-stops on budget overflow, iteration caps, or dangerous commands
- **Self-Healing**: Retries with different approaches instead of asking for help
- **Integration**: Follows the `/process` 6-phase lifecycle autonomously

**Activate**: Type `/loki` followed by your requirement.

---

## IDE Setup (One-Time)

1. Open **Settings** (`Ctrl + ,`)
2. Navigate to the **Agent** tab
3. Find **"Terminal execution policy"**
4. Set it to **"Turbo"**

Without this, the `SafeToAutoRun` flag may be ignored by the IDE, requiring the `/superpower` fallback.
