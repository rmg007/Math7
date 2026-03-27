# Questerix — AI Agent Instructions

## Autonomous Execution Rules

1. **Turbo Mode is ON**. All commands are pre-authorized via `// turbo-all`.
2. **Use `SafeToAutoRun: true`** for every `run_command` call.
3. If IDE gates a command, use the `ops_runner.py` workaround. Write `{ "description": "...", "command": "...", "cwd": "..." }` array to `tasks.json` in root, then run `python ops_runner.py tasks.json`.

## Watchdog Circuit Breakers

**CRITICAL**: These are hard limits to prevent infinite loops.

- **5 consecutive failures** on the same sub-task → STOP and escalate
- **3 consecutive identical errors** → You're in a loop. STOP.
- **25 total iterations** per session → Checkpoint progress and STOP
- **60 second test timeout** → Kill the test, investigate the hang
- **15 minutes with no progress** → Checkpoint and escalate
