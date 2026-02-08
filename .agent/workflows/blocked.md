---
description: Report blockers and partial progress
---

// turbo-all

# /blocked - Report Blocker

> **⚡ Superpower Fallback**: If commands need approval, use `/sp` - I output JSON, you paste into `tasks.json`, watcher runs it.

**Purpose**: Report when work cannot continue and document partial progress.

---

## When to Use

Use `/blocked` when:
- Waiting for user decision
- Need credentials or access
- External dependency not ready
- Unclear requirements
- Technical blocker discovered

---

## Instructions

When work is blocked, report:

### 1. Blocker Description
- What is preventing progress?
- Is it technical or external?
- When did it become blocked?

### 2. What is Needed
- Specific decision from user?
- Credentials or access?
- External dependency?
- Clarification on requirements?

### 3. Partial Progress
- What was already completed?
- Files changed so far
- What is in a working state?

### 4. Resume Instructions
- How to pick up when unblocked
- What command or action to continue

---

## Output Format

```markdown
## 🚧 BLOCKED

### Status
- **Blocked since**: [timestamp]
- **Phase**: [intake/plan/implement/verify]
- **Task**: [Description]

---

### Blocker
[Description of what is blocking progress]

**Type**: [Technical / External / Decision Needed / Access Required]

---

### What is Needed

- [ ] [Specific action or decision needed from user]
- [ ] [Credential or access required]
- [ ] [External dependency to be resolved]

**Question for user** (if applicable):
> [Specific question that needs an answer]

---

### Completed So Far

| File | Status | Notes |
|------|--------|-------|
| `path/to/file.ts` | ✅ Complete | [What was done] |
| `path/to/file.dart` | 🔄 In Progress | [What remains] |
| `path/to/file.sql` | ⏸️ Not Started | [Blocked by X] |

### Commands Executed
| Command | Result |
|---------|--------|
| `flutter pub get` | ✅ SUCCESS |
| `[blocked command]` | ❌ BLOCKED |

---

### Resume Instructions

When unblocked:

1. **If user provides answer**: 
   - Run `/resume` with the answer
   
2. **If credentials provided**:
   - Update `.env` with new values
   - Run `/resume`

3. **Manual resume**:
   ```bash
   # Step 1: [what to do first]
   # Step 2: [what to do next]
   ```

---

### Context for Next Session

[Any important context that should be remembered when resuming]
```

---

## Session State File

When blocked, optionally create a session state file:

**File**: `.session/[YYYY-MM-DD]-[task-name].md`

```markdown
---
status: blocked
phase: implement
task: Add skill widget
blocked_at: 2026-02-03T07:45:00
blocker: Need design decision on color scheme
---

## Context
[Brief context about the task]

## Completed
- [x] Created widget skeleton
- [x] Added routing

## Remaining
- [ ] Apply final styles (blocked)
- [ ] Write tests

## Resume With
User needs to decide: "Use blue or green for primary accent?"
```

---

## Unblocking

When the blocker is resolved:
1. User provides the needed input
2. Run `/resume` to continue
3. Or manually continue from the resume instructions
