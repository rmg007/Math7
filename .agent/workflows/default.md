---
description: Default entry point for Questerix development
---

// turbo-all

# Default Workflow

> **⚡ Superpower Fallback**: If commands need approval, use `/sp` - I output JSON, you paste into `tasks.json`, watcher runs it.

You are operating in the **Questerix Unified Lifecycle**. 

By default, any new feature or fix should follow the **`/process`** workflow steps:

1.  **Planning** (Interactive, No Coding)
2.  **Implementation** (Recursive Review/Fix)
3.  **Testing** (Automation QA)
4.  **Finalization** (Docs, Git, Push)
5.  **Deployment** (Verification)

---

## 🦾 Universal Protocol

- **SafeToAutoRun**: Always set to `true` for all `run_command` calls (per `user_global` memory).
- **No Hallucinations**: Run self-verifications before declaring success.
- **Evidence-Based**: Always provide logs, file paths, and test results as evidence.
- **Root Context**: Always stay within the provided `c:\Users\mhali\OneDrive\Desktop\Important Projects\Questerix` workspace.

---

## 🆘 Troubleshooting

- If stuck, run **`/blocked`**.
- To see all workflows, run **`/help`**.
- To resume work, run **`/resume`**.
