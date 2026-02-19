---
description: Autonomous Developer Mode
---

# 🐺 /loki — Autonomous Developer Mode

// turbo-all

> **Loki Mode** transforms the agent from a "chatbot" into a "founding engineer."
> It uses the **RARV cycle** (Reason → Act → Reflect → Verify) for zero-intervention development.

---

## Activation

When `/loki` is invoked:

1. **Read the Skill**: `view_file .agent/skills/loki-mode/SKILL.md` — this is your operational mandate
2. **Load Config**: `view_file .agent/skills/loki-mode/config.json` — your permissions and boundaries
3. **Load or Init State**: Check `.agent/skills/loki-mode/state.json`
   - If exists with active session → resume from last checkpoint
   - If idle → initialize fresh state with current mission

## Workflow

### Step 1: Understand the Mission

- Read the user's requirement (PRD, task description, or brief)
- Break it into 3–12 atomic sub-tasks
- Write the plan to `state.json`

### Step 2: Execute RARV Loop (per sub-task)

For each sub-task, follow the RARV cycle defined in `SKILL.md`:

```text
┌─────────────────────────────────────────┐
│  REASON → ACT → REFLECT → VERIFY       │
│     ↑                        │          │
│     └── (on failure) ────────┘          │
│                                         │
│  ✅ Pass → next sub-task                │
│  🛑 5 failures → circuit breaker        │
│  🛡️ Bug Fixed? → Add Preventative Test  │
└─────────────────────────────────────────┘

**Learning Flag Protocol**: When documenting a learning, you MUST append one of these flags: `[need test]`, `[test created]`, or `[no test needed]`.
```

### Step 3: Phase Progression

Follow the `/process` lifecycle autonomously:

- Phase 1 → 5: No human approval needed
- Phase 6 (Deploy): **STOP and ask user**

### Step 4: Finalize

- Save final state to `state.json`
- Write session summary to `logs/`
- Clean up `tasks.md` by deleting all completed items (`[x]` or `✅`)
- Perform **Repository Hygiene**: Delete temp files (`test_output.txt`, `*.log`) and consolidate files
- Commit and push all changes with `docs:` or `fix:` prefix
- Announce completion

## Circuit Breakers

The agent MUST stop if:

- Same sub-task fails 5 times
- Same error message appears 3 times consecutively
- Total iterations exceed 25
- Dangerous command attempted (see `config.json` deny list)
- 15 minutes with no progress

## Key Commands

```bash
# Verification suite (use during VERIFY phase)
python ops_runner.py tasks.json # executes: ./scripts/preflight.ps1
python ops_runner.py tasks.json # executes: ./scripts/run-all-tests.ps1
python ops_runner.py tasks.json # executes: ./scripts/code-hygiene-scan.ps1

# Quick checks (use during REFLECT phase)
cd admin-panel && npx tsc --noEmit && npm run lint
cd student-app && flutter analyze && flutter test
```

## State Persistence

After every completed sub-task, update `.agent/skills/loki-mode/state.json`:

```json
{
  "current_subtask": "...",
  "iteration_count": N,
  "completed": N,
  "errors": [...],
  "learnings": ["Found infinite loop in auth [test created]"]
}
```

## Integration with Other Workflows

| Workflow      | Relationship                                               |
| ------------- | ---------------------------------------------------------- |
| `/autopilot`  | Loki uses autopilot's turbo permissions                    |
| `/superpower` | Loki falls back to ops_runner.py if IDE gates commands     |
| `/autoloop`   | Loki can batch commands via tasks.json for async execution |
| `/process`    | Loki follows the same 6-phase lifecycle autonomously       |
| `/certify`    | Loki's VERIFY phase runs the same certification checks     |

## Monitoring (While Away)

Check progress via:

- `.agent/skills/loki-mode/state.json` — current progress
- `.agent/skills/loki-mode/logs/` — RARV reasoning traces
- `git log --oneline` — commit history shows work done
- Cloud sync folder — view logs remotely
