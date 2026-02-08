# Questerix: Autonomous Agent Instruction Set

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/ca061805934446349d970335029a9937)](https://app.codacy.com/gh/[YOUR_ORG]/Questerix/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/ca061805934446349d970335029a9937)](https://app.codacy.com/gh/[YOUR_ORG]/Questerix/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)


> **The "Golden Command" to start development:**
> 
> ```text
> "Follow the instructions in AGENTS.md. Start with Phase 0."
> ```

---
## 🔗 Essential Links

- **🔥 Start Development**: Follow instructions in `AGENTS.md` (Phase 0)
- **🧠 Coding Standards**: [docs/standards/ORACLE_COGNITION.md](./docs/standards/ORACLE_COGNITION.md) - IDD Protocol & language patterns
- **🐛 Best Practices**: [best_practices.md](./best_practices.md)
- **🔒 Security Model**: [SECURITY.md](./SECURITY.md)

---
## 🚀 Overview

This repository contains the complete **Executive Specification** for **Questerix** - an offline-first educational platform. It is designed to be consumed by AI Coding Agents (Cursor, Antigravity, etc.) to autonomously build the application.

The project consists:
1.  **Student App** (`student-app/`): A Flutter tablet app (offline-first, Drift DB).
2.  **Admin Panel** (`admin-panel/`): A React dashboard (shadcn/ui, Supabase Auth).
3.  **Landing Pages** (`landing-pages/`): Marketing site (React/Vite, Tailwind CSS).
4.  **Domain Models** (`questerix_domain/`): Shared Dart models and validators.
5.  **Backend**: Supabase (PostgreSQL, Edge Functions, Realtime).

## 📂 Key Files

- **`docs/strategy/AGENTS.md`**: The Supreme Law. The execution protocol every agent must follow.
- **`AI_CODING_INSTRUCTIONS.md`**: Short-form, code-grounded AI instructions (contracts, authority order, non-negotiables).
- **`ROADMAP.md`**: The visual timeline of the project phases.
- **`PHASE_STATE.json`**: The state file tracking the agent's progress.
- **`docs/specs/*`**: Detailed blueprints for UI, Data, and API.
- **`.mcp_config.json`**: Ready-to-use MCP server configuration.
- **`MCP_SETUP_COMPLETE.md`**: MCP installation summary and next steps.

## 🧑‍💻 For Humans (Development)

- `docs/technical/DEVELOPMENT.md`
- `docs/operational/CI_CONTRACT.md`
- `docs/technical/VALIDATION.md`
- `docs/technical/MCP_SETUP_GUIDE.md`

## 🤖 For AI Agents

1.  **Read `docs/strategy/AGENTS.md`** immediately.
2.  **Check `PHASE_STATE.json`** to see where to begin.
3.  **Execute** the current phase strictly according to the specs.
4.  **Validate** using the provided scripts (e.g., `scripts/validate-phase-0.ps1`).

**Do not deviate from the specifications.**

### 🦾 Agent Commands
- **`/autopilot`**: Triggers full autonomous build & maintenance capability.
- **`/test`**: Runs the recommended "Enterprise QA" suite (Offline-Sync integration, E2E, Lint).
*See `docs/technical/DEVELOPMENT.md` for full command details.*
 
