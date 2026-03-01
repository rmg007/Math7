# 🏛️ AetherFlow Template Vault

> This directory is a **tech-stack agnostic template and scaffold** of abstract lessons, architectural patterns, and techniques distilled from the Questerix/Cortex project.
>
> It is designed to be **extracted and reused** as a starting point for _any_ future project — regardless of tech stack (React, Flutter, Django, Go, etc.). Think of it as the "Product DNA" and "hard-won wisdom" that survived the Questerix build.
>
> **Task Tracking Rule**: All tasks that create or edit files inside this vault MUST be tracked in **[`futer_projects_plan_tasks.md`](./futer_projects_plan_tasks.md)**. Questerix/Cortex codebase work belongs in `tasks.md`.

---

## 🧭 Navigation for Future Agents

| Path                                     | Purpose                                                                                                                                               |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `architecture/MANIFESTO.md`              | The 5 core meta-principles (Dynamic Singleton, Data-Layer Authority, Forensic Pit Crew, Tiered Verification, Agent-Native Docs). **Read this first.** |
| `architecture/STRATEGY_8_TIER.md`        | The full 8-Tier Quality Framework — agnostic, tech-stack independent blueprint for 5M+ scale.                                                         |
| `architecture/AGENT_NATIVE_GUIDE.md`     | How to design codebases for AI Readiness (SKELETON, FEATURE_GUIDE, Semantic SSoT, Forensic Audit).                                                    |
| `governance/ARCHITECTURAL_GUARDRAILS.md` | Mandatory rules for security (RLS), session management, multi-tenancy, and project hygiene.                                                           |
| `prompts/PROMPT_LIBRARY.md`              | Verified Day-0 bootstrapping prompts for AI agents starting new AetherFlow-compliant apps.                                                            |
| `futer_projects_plan_tasks.md`           | The full long-term roadmap tracker — all phases, all slots (J-1 through K-2).                                                                         |

---

## 📊 Current Status

| Phase       | Description                              | Status         |
| :---------- | :--------------------------------------- | :------------- |
| **Phase 0** | Knowledge Extraction & Meta-Architecture | ✅ Complete    |
| **Phase 1** | AetherFlow Scaling Refactors (Slot J)    | 🔄 In Progress |
| **Phase 2** | Long-Term Compliance (Slot K)            | ⬜ Pending     |

> **Active sprint tasks** (Phase 1) are being tracked in `/tasks.md` at the project root.
> Long-term and out-of-scope planning lives here.

---

## 🔱 Why This Exists

Software development is often hindered by **"Project Amnesia."** This vault ensures that:

1. **Architecture is Intentional**: We don't just "write code" — we follow the AetherFlow principles of multi-tenancy, data-layer security, and agent-native documentation.
2. **AI Agents are Context-Aware**: Any new agent reading this folder can immediately understand the "Rules of the Game" without scanning 1,000 source files.
3. **Scalability is a First-Class Citizen**: The patterns here are designed for **5 million users from Day 1**.
4. **Knowledge Survives Agent Turnover**: Insights, guardrails, and decision rationale are preserved here so no lesson is lost between sessions.

---

## 🚀 Quick-Start Protocol for Agents

1. Read `architecture/MANIFESTO.md` — understand the 5 meta-principles.
2. Read `architecture/STRATEGY_8_TIER.md` — understand the 8-tier quality framework.
3. Read `governance/ARCHITECTURAL_GUARDRAILS.md` — know the hard rules.
4. Check `futer_projects_plan_tasks.md` — see what's done and what's pending.

> [!TIP]
> **To any Coding Agent reading this**: This vault is your "Permanent Memory" for the Questerix platform. Before proposing any architectural change, check if it aligns with the principles in `MANIFESTO.md` and the guardrails in `ARCHITECTURAL_GUARDRAILS.md`. If it contradicts them, escalate to the user before proceeding.

---

> Last updated: 2026-02-28
