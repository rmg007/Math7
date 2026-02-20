---
description: Default entry point for Questerix development
---

// turbo-all

# Default Workflow

> **⚡ Superpower Fallback**: If commands need approval, use `/sp` - I output JSON, you paste into `tasks.json`, watcher runs it.

You are operating in the **Questerix Unified Lifecycle**.

---

## 🌅 Auto-Wake (Run on Every Session Start)

**Before doing anything else**, check if a previous session left a handover:

```powershell
// turbo
if (Test-Path "docs/HANDOVER.md") { Write-Output "HANDOVER_EXISTS" } else { Write-Output "NO_HANDOVER" }
```

- **If `HANDOVER_EXISTS`**: Execute the `/wake` workflow automatically. Do NOT ask the user — just restore context, run health check, and present the summary.
- **If `NO_HANDOVER`**: Proceed normally with whatever the user asked.

---

## 🩺 CI Repair Check (Run After Wake)

After wake/handover resolution, check GitHub for open CI repair issues:

```powershell
// turbo
gh issue list --label "ci-repair" --state open --json number,title,body --limit 5 2>$null
```

- **If `gh` is not authenticated**: Skip silently. Do NOT block session start.
- **If repair issues found**: Present them to the user:

  ```
  🩺 Found [N] open CI repair issue(s):
     #42: [REPAIR] CI Failure: CI — Lint
     #43: [REPAIR] CI Failure: Admin Panel E2E Tests — Run E2E tests

  Would you like me to prioritize fixing these? [Y/n]
  ```

- **If none found**: Skip silently.

---

## 🔧 Standard Process

By default, any new feature or fix should follow the **`/process`** workflow steps:

1.  **Planning** (Interactive, No Coding)
2.  **Implementation** (Recursive Review/Fix)
3.  **Testing** (Automation QA)
4.  **Finalization** (Docs, Git, Push)
5.  **Deployment** (Verification) - `scripts/deploy/deploy-all.ps1`

---

## 🦾 Universal Protocol

- **SafeToAutoRun**: Always set to `true` for all `run_command` calls (per `GEMINI.md` user memory — the SSoT for turbo permissions).
- **Governance Model**: `AGENTS.md` = universal rules (all agents/IDEs). `GEMINI.md` = Antigravity-specific permissions. When they conflict, `GEMINI.md` wins.
- **Guardrails**: Before any ACT phase, scan `.antigravity/skills/loki-mode/guardrails.md` — it contains accumulated lessons from past failures.
- **Preventative Protocol**: **"Bug Fixed? Test Added."** Never fix a bug without a test that would have caught it.
- **Learning Flag Protocol**: When documenting a learning, append `[need test]`, `[test created]`, or `[no test needed]` to the entry.
- **No Hallucinations**: Run self-verifications before declaring success.
- **Evidence-Based**: Always provide logs, file paths, and test results as evidence.
- **Root Context**: Always stay within the provided `c:\Users\mhali\OneDrive\Desktop\Important Projects\Questerix` workspace.

---

## 💤 Auto-Sleep Reminder

When the conversation naturally winds down (user says "thanks", "that's all", "done for now", or stops responding), **proactively suggest**:

> 💤 Want me to run `/sleep` to save your session state before you go?

Do NOT run `/sleep` without the user saying yes. Just offer.

---

## 🆘 Troubleshooting

- If stuck, run **`/blocked`**.
- To see all workflows, run **`/help`**.
- To resume work, run **`/resume`**.
- To save session, run **`/sleep`**.
- To restore session, run **`/wake`**.
