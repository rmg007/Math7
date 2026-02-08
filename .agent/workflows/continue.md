---
description: Resume work after switching AI agents
---

// turbo-all

# 🔄 /continue - Agent Handoff & Resume

> **⚡ Superpower Fallback**: If commands need approval, use `/sp` - I output JSON, you paste into `tasks.json`, watcher runs it.

**Purpose**: Seamlessly resume work when switching AI agents mid-task. Loads context, validates current state, and continues from the correct phase.

**When to Use**: When you want to switch to a different AI agent during `/process` execution.

---

## 📊 Phase 1: Context Loading
**Goal**: Reconstruct the full picture of what was being worked on.

### Steps

1. **Load Task State**
   - Read `.agent/artifacts/TASK_STATE.json`
   - If not found: Report "No active task found. Use `/process` to start a new task."

2. **Load Implementation Plan**
   - Read the plan artifact specified in `plan_artifact` field
   - Extract: Task objectives, architectural decisions, file structure

3. **Review Recent History**
   - Run: `git log --oneline -10`
   - Check: Last 10 commits to understand recent work
   - Identify: Any WIP branches or uncommitted changes

4. **Evidence**
   - Display: Task ID, start time, current phase, plan summary
   - List: Completed phases and their completion times

---

## 🔍 Phase 2: State Validation
**Goal**: Verify the current state is healthy and matches expectations.

### Health Checks

1. **Build Status**
   - Run: `flutter analyze` (if Dart code modified)
   - Run: `npm run build` (if React code modified)
   - **Proof**: Build succeeds or note errors

2. **Test Status**
   - Run: Quick smoke tests
   - **Proof**: Core functionality works

3. **Git Status**
   - Run: `git status`
   - Check: Any uncommitted changes, conflicts, or stashes
   - **Proof**: Working tree state

4. **Alignment Check**
   - Compare: Current code against plan expectations
   - Identify: Any deviations or unexpected changes
   - **Proof**: Files match planned structure

---

## 📋 Phase 3: Progress Summary
**Goal**: Create a clear handoff report.

### Report Format

```markdown
## 🔄 Handoff Report

**Task**: [Task ID from TASK_STATE.json]
**Started**: [Start timestamp]
**Current Agent**: [New agent name/version]

### Progress Summary
| Phase | Status | Completed At | Notes |
|-------|--------|--------------|-------|
| 1. Planning | ✅ Completed | [timestamp] | Plan approved |
| 2. Database | ✅ Completed | [timestamp] | [brief notes] |
| 3. Implementation | 🔄 In Progress (60%) | - | [what's done, what remains] |
| 4. Verification | ⏸️ Pending | - | - |
| 5. Finalization | ⏸️ Pending | - | - |
| 6. Release | ⏸️ Pending | - | - |

### What's Completed
- [List of completed features/files]
- [Evidence: commits, tests passed]

### What Remains
- [List of remaining work from plan]
- [Estimated effort]

### Known Issues/Blockers
- [Any problems the previous agent encountered]
- [Technical debt or workarounds]

### Immediate Next Steps
1. [First action to take]
2. [Second action to take]
3. [Third action to take]
```

---

## 🎯 Phase 4: Resume Decision
**Goal**: Determine where to continue and get user confirmation.

### Resume Point Analysis

Based on `current_phase` in TASK_STATE.json:

| Current Phase | Resume Strategy |
|---------------|-----------------|
| **1 (Planning)** | Plan not completed. Resume expert consultation. |
| **2 (Database)** | Database work not finished. Complete schema/RLS/types. |
| **3 (Implementation)** | Code partially written. Continue from last checkpoint. |
| **4 (Verification)** | Implementation done, testing in progress. Complete QA. |
| **5 (Finalization)** | Testing done, docs in progress. Update docs and push. |
| **6 (Release)** | Ready for deployment. Proceed to release. |

### User Prompt

Present the handoff report and ask:

> **"I've reviewed the task state. We're currently at Phase [X]: [Phase Name].**
> 
> **Progress**: [brief summary]
> 
> **Options**:
> 1. ✅ **Continue from Phase [X]** (recommended)
> 2. 🔄 **Re-verify Phase [X-1]** (if you want extra safety)
> 3. 🛑 **Switch to `/certify`** (if you want full audit first)
> 
> **How should I proceed?**"

---

## 🚀 Phase 5: Autonomous Execution
**Goal**: Resume work without further prompts.

Once user confirms, execute the selected option:

- **Option 1**: Continue from current phase autonomously
- **Option 2**: Re-verify previous phase, then continue
- **Option 3**: Run `/certify` workflow for full audit

**State Update**: Update `TASK_STATE.json`:
- `last_updated = [new timestamp]`
- `resumed_by = [new agent identifier]`
- Add note: "Resumed after agent handoff"

---

## 🛡️ Edge Cases

### No TASK_STATE.json Found
```
⚠️ No active task found.

Would you like to:
1. Start a new task with `/process`
2. Manually specify a plan file to resume from
```

### Corrupted State File
```
⚠️ TASK_STATE.json exists but is corrupted.

I'll reconstruct state from:
- Recent git commits
- Artifact files in .agent/artifacts/
- Plan markdown files

Reconstructed state: [summary]
Proceed? [yes/no]
```

### Multiple Tasks in Progress
```
⚠️ Found multiple task state files:
1. task_security_logging.json (Phase 3, started 2 hours ago)
2. task_widget_refactor.json (Phase 2, started 1 day ago)

Which task should I continue?
```

### Phase Inconsistency
```
⚠️ State says "Phase 3 completed" but tests are failing.

Recommendation: Re-run Phase 4 (Verification) to identify issues.
Proceed? [yes/no]
```

---

## 📊 Success Criteria

- [ ] Task state successfully loaded
- [ ] Current state validated (builds, tests)
- [ ] Progress summary presented to user
- [ ] User confirms resume point
- [ ] Work continues seamlessly from correct phase
