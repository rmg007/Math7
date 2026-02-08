---
description: Continue work from previous session (same agent)
---

// turbo-all

# /resume - Session Resumption

> **⚡ Superpower Fallback**: If commands need approval, use `/sp` - I output JSON, you paste into `tasks.json`, watcher runs it.

**Purpose**: Pick up where the last session left off (same agent, new session).

**When to Use**: After sleep, restart, or disconnection. Use `/continue` instead if switching to a different AI agent.

---

## 📊 Phase 1: Session Detection

### Priority Detection Strategy

1. **TASK_STATE.json** (Primary Source)
   - Location: `.agent/artifacts/TASK_STATE.json`
   - Contains: Current phase, progress, plan artifact

2. **Git Status** (Secondary Source)
   - Uncommitted changes indicate WIP
   - Recent commits show recent work

3. **Session Files** (Legacy Support)
   - Location: `.session/*.md`
   - Older format, still supported

4. **User Input** (Fallback)
   - If no context found, ask user

### Commands

```powershell
// turbo
# Check for active task state
Get-Content .agent/artifacts/TASK_STATE.json -ErrorAction SilentlyContinue

# Check git status
git status --porcelain
git log --oneline -5

# Check for session files (legacy)
Get-ChildItem -Path ".session/*.md" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

---

## 🔍 Phase 2: State Analysis

### If TASK_STATE.json Found

Extract:
- `task_id`: What task is active
- `current_phase`: Which phase we're in (1-6)
- `plan_artifact`: Path to implementation plan
- `phases[X].status`: What's completed vs pending
- `phases[X].notes`: Any important context

### If Git Status Shows Changes

Analyze:
- Modified files suggest what was being worked on
- Recent commits indicate task context
- Uncommitted changes need to be handled

### If Session Files Found (Legacy)

Parse:
- YAML frontmatter: status, phase, task
- Completed criteria
- Next steps

---

## 📋 Phase 3: Progress Summary

Display to user:

```markdown
## 🔄 Resuming Session

**Task**: [task_id from TASK_STATE.json]
**Started**: [started_at]
**Last Updated**: [last_updated or last git commit time]

### Progress Summary
| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Planning & Strategy | ✅ | [timestamp] |
| 2. Database & Schema | ✅ | [timestamp] |
| 3. Implementation | 🔄 In Progress | - |
| 4. Verification | ⏸️ Pending | - |
| 5. Finalization | ⏸️ Pending | - |
| 6. Release | ⏸️ Pending | - |

### Current Phase Details
**Phase**: [current_phase name]
**Last Note**: [phases[current_phase].notes if any]

### Recent Activity
- [Last 3-5 git commits]
- [Uncommitted changes summary]

### Next Steps
[Based on current_phase, what should happen next]
```

---

## 🚀 Phase 4: Autonomous Resume

**No user prompt required** - automatically continue from current phase.

### Resume Logic

```javascript
if (current_phase === 1) {
  // Phase 1: Planning not finished
  "Resuming planning discussion..."
  // Continue expert consultation
}

if (current_phase === 2) {
  // Phase 2: Database work in progress
  "Resuming database schema work..."
  // Complete migrations, RLS, types
}

if (current_phase === 3) {
  // Phase 3: Implementation in progress
  "Resuming implementation..."
  // Continue coding from last checkpoint
}

if (current_phase === 4) {
  // Phase 4: Verification in progress
  "Resuming testing and verification..."
  // Run remaining tests
}

if (current_phase === 5) {
  // Phase 5: Finalization in progress
  "Resuming documentation updates..."
  // Complete docs and git push
}

if (current_phase === 6) {
  // Phase 6: Release pending
  "Ready for deployment..."
  // Prompt for deployment decision
}
```

### State Update

Update `TASK_STATE.json`:
```json
{
  "last_updated": "[new timestamp]",
  "resumed_at": "[timestamp]"
}
```

---

## 🛡️ Edge Cases

### No TASK_STATE.json Found

```markdown
⚠️ No active task found.

Checking alternative sources:
- Git status: [uncommitted changes found / clean]
- Session files: [legacy .session/*.md found / none]

Options:
1. Start new task with `/process`
2. Manually reconstruct from git history
3. Provide task description to resume

What would you like to do?
```

### Git Conflicts

```markdown
⚠️ Git conflicts detected.

Files in conflict:
- [file1]
- [file2]

Recommendation:
1. Resolve conflicts manually
2. Run `/resume` again after resolution

Would you like me to show the conflict details?
```

### Uncommitted Changes + No TASK_STATE.json

```markdown
⚠️ Uncommitted changes found but no active task state.

Modified files:
- [file1]
- [file2]

Recommendation:
1. Create TASK_STATE.json from git analysis
2. Or start fresh with `/process`

Should I reconstruct state from git history?
```

---

## 🔄 Migration from Legacy Session Files

If `.session/*.md` found but no `TASK_STATE.json`:

```markdown
📦 Legacy session file detected: `.session/[file].md`

Converting to new state format...

Created: `TASK_STATE.json`
Archived: `.session/[file].md` → `.session/archive/`

Resuming with new state tracking system.
```

---

## ✅ Success Criteria

- [ ] Session state successfully loaded (TASK_STATE.json or reconstructed)
- [ ] Progress summary displayed
- [ ] Current phase identified
- [ ] Work resumed autonomously from correct checkpoint
- [ ] State file updated with resume timestamp
