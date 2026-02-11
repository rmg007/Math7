---
description: Restore session from HANDOVER.md
---

// turbo-all

# ☀️ /wake — Session Restore

> **Purpose**: Restore session context from a previous `/sleep`. Validates environment health and presents the next action.

> **Prerequisite**: A previous `/sleep` must have generated `docs/HANDOVER.md`.

---

## Phase 1: Load Handover

### 1.1 Check for HANDOVER.md

```powershell
// turbo
if (Test-Path "docs/HANDOVER.md") { Get-Content "docs/HANDOVER.md" } else { Write-Output "NO_HANDOVER_FOUND" }
```

**If not found**: Stop and report:

```
☀️ No handover file found at docs/HANDOVER.md.

   Options:
   1. Use /resume (recover from same-agent session break)
   2. Use /continue (recover after agent switch)
   3. Use /process (start fresh task)
```

### 1.2 Parse and Validate

Extract from HANDOVER.md:

- `Saved` timestamp
- `Branch` name
- `Next Immediate Step`
- `Temporary Hacks` list
- `Open Questions` list

### 1.3 Staleness Check

Calculate age of HANDOVER.md from the `Saved` timestamp.

| Age        | Action                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| < 4 hours  | Proceed normally                                                                   |
| 4-24 hours | Proceed with note: "Handover is [N] hours old."                                    |
| > 24 hours | Warn: "⚠️ This handover is [N] days old. Context may be outdated. Proceed anyway?" |

---

## Phase 2: Validate Environment

### 2.1 Branch Check

```powershell
// turbo
git branch --show-current
```

Compare with HANDOVER.md branch. If different:

```
⚠️ Branch mismatch!
   HANDOVER says: [saved_branch]
   Current branch: [current_branch]

   Switch to [saved_branch]? [Y/n]
```

### 2.2 Pull Latest (safe mode)

```powershell
// turbo
git pull --ff-only 2>&1
```

**If fails** (merge conflict or diverged): Stop and report the error. Do NOT attempt auto-merge.

### 2.3 Quick Health Check

```powershell
// turbo
cd admin-panel ; npx tsc --noEmit 2>&1 | Select-Object -First 10
```

**If errors found**: Report them but don't block. Note: "Build has [N] errors. You may want to fix these before proceeding."

**If clean**: Note: "✅ TypeScript compilation clean."

### 2.4 CI Repair Check

```powershell
// turbo
gh issue list --label "ci-repair" --state open --json number,title --limit 5 2>$null
```

- **If `gh` is not authenticated**: Skip silently.
- **If repair issues found**: Include them in the state summary under a "🩺 CI Repairs Pending" section.
- **If none found**: Skip.

---

## Phase 3: Present State

Display to user:

```markdown
☀️ Session Restored

**From**: [saved timestamp] ([age] ago)
**Branch**: [branch] [✅ matches | ⚠️ switched from X]
**Build**: [✅ clean | ⚠️ N errors]

## What Was Happening

[from HANDOVER.md]

## Next Immediate Step

[from HANDOVER.md]

## Cleanup Needed

[from HANDOVER.md, or "None"]

## Open Questions

[from HANDOVER.md, or "None"]

---

Ready to continue? [Y/n]
```

---

## Phase 4: Resume & Cleanup

On user confirmation:

1. **Archive** the HANDOVER.md:
   - Delete `docs/HANDOVER.md` (it has been consumed)

2. **Begin work** on the "Next Immediate Step"

3. If TASK_STATE.json exists, update it:
   ```json
   {
     "last_updated": "[new timestamp]",
     "woke_at": "[timestamp]"
   }
   ```

---

## Edge Cases

### HANDOVER.md Exists But Is Empty/Corrupted

```
⚠️ HANDOVER.md exists but could not be parsed.

Falling back to /resume workflow...
```

Then execute `/resume` steps instead.

### git pull --ff-only Fails

```
⚠️ Cannot fast-forward. Remote has diverged.

Options:
1. git pull --rebase (try rebase)
2. git stash && git pull && git stash pop (stash approach)
3. Skip pull and work on local state

Which approach? [1/2/3]
```

### Health Check Takes Too Long (>15 seconds)

- Kill the check and report: "Health check timed out. Skipping — you can run `npm run typecheck` manually."

### Multiple HANDOVER Files

- Only `docs/HANDOVER.md` is recognized. Any other location is ignored.

---

## Success Criteria

- [ ] HANDOVER.md loaded and parsed
- [ ] Branch validated (match or user confirmed switch)
- [ ] Pull completed (or skipped with explanation)
- [ ] Health check completed (or timed out gracefully)
- [ ] State summary presented to user
- [ ] User confirmed, work resumed
- [ ] HANDOVER.md deleted after consumption
