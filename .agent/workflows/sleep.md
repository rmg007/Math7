---
description: Save session state for later resumption
---

// turbo-all

# 💤 /sleep — Session Save

> **Purpose**: Explicitly save session context so a future `/wake` can restore it. Use at the end of a work session.

> **Difference from /resume**: `/resume` is reactive (recover from unexpected breaks). `/sleep` is proactive (deliberate session boundary).

---

## Phase 1: Capture State

### 1.1 Git Snapshot

```powershell
// turbo
git status --porcelain && git log --oneline -5 && git diff --stat
```

Record:
- Current branch name
- Dirty/staged files
- Last 5 commit summaries
- Diff stats

### 1.2 Running Processes

```powershell
// turbo
Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*flutter*" -or $_.ProcessName -like "*dart*" } | Select-Object ProcessName, Id, @{N='MemMB';E={[math]::Round($_.WorkingSet64/1MB,1)}} | Format-Table -AutoSize
```

Record any running dev servers or watchers.

### 1.3 Active Task

```powershell
// turbo
Get-Content .agent/artifacts/TASK_STATE.json -ErrorAction SilentlyContinue
```

If exists, extract: `task_id`, `current_phase`, `plan_artifact`.
If not, note: "No formal task tracked."

---

## Phase 2: Generate HANDOVER.md

Create `docs/HANDOVER.md` with the following structure:

```markdown
# Session Handover

**Saved**: [ISO timestamp]
**Branch**: [current branch]
**Agent**: [agent identifier if known]

## Current State
- **Active Task**: [task_id or "No formal task"]
- **Phase**: [current_phase or "N/A"]
- **Dirty Files**: [list or "Clean working tree"]

## Last 5 Commits
- [commit summaries]

## Running Processes
- [process list or "None detected"]

## What Was Happening
[1-2 sentence summary of the current work context, derived from recent commits and dirty files]

## Next Immediate Step
[The single most important thing to do next]

## Temporary Hacks / Cleanup Needed
- [Any workarounds, TODO items, or known shortcuts that need proper fixes]
- [If none: "None identified"]

## Open Questions / Blockers
- [Any unresolved decisions or blockers]
- [If none: "None"]
```

---

## Phase 3: Finalize

1. **Do NOT commit HANDOVER.md** — it stays local only.
   - Verify `docs/HANDOVER.md` is in `.gitignore`. If not, add it.

2. Report to user:

```
💤 Session saved to docs/HANDOVER.md
   Branch: [branch]
   Next step: [next step summary]
   
   Use /wake to restore this session.
```

---

## Edge Cases

### No TASK_STATE.json
- Proceed without it. Reconstruct context from git history and dirty files.
- Note in HANDOVER.md: "No formal task tracked. Context reconstructed from git."

### Clean Working Tree (nothing to hand over)
- Still generate HANDOVER.md with commit history and "Clean working tree" status.
- This is valid — user may be at a natural stopping point.

### User Has Unstaged Changes They Want to Keep
- `/sleep` never runs `git add` or `git commit` on user files.
- HANDOVER.md is local-only. No git operations on user's work.

---

## Success Criteria
- [ ] `docs/HANDOVER.md` exists with complete state
- [ ] No user files were committed or staged
- [ ] `docs/HANDOVER.md` is gitignored
- [ ] User sees confirmation with next-step summary
