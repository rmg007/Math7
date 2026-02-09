# Questerix: Autonomous Agent Instruction Set

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/ca061805934446349d970335029a9937)](https://app.codacy.com/gh/[YOUR_ORG]/Questerix/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/ca061805934446349d970335029a9937)](https://app.codacy.com/gh/[YOUR_ORG]/Questerix/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)

> **The "Golden Command" to start development:**
> 
> ```text
> "Start with docs/strategy/QUICKSTART_AGENTS.md. Then check docs/technical/CONTEXT_MAP.md."
> ```

---

## 🚀 Overview

This repository contains the complete **Executive Specification** for **Questerix** - an offline-first educational platform. It is designed to be consumed by AI Coding Agents (Cursor, Antigravity, etc.) to autonomously build the application.

The project consists of:
1.  **Student App** (`student-app/`): A Flutter tablet app (offline-first, Drift DB).
2.  **Admin Panel** (`admin-panel/`): A React dashboard (shadcn/ui, Supabase Auth).
3.  **Landing Pages** (`landing-pages/`): Marketing site (React/Vite, Tailwind CSS).
4.  **Domain Models** (`questerix_domain/`): Shared Dart models and validators.
5.  **Backend**: Supabase (PostgreSQL, Edge Functions, Realtime).

## 📂 Key Files

- **`docs/strategy/AGENTS.md`**: The Constitution. Core rules and behavioral protocols.
- **`docs/strategy/QUICKSTART_AGENTS.md`**: The Session Startup Checklist.
- **`docs/technical/CONTEXT_MAP.md`**: The Map. Use this to find technical documentation.
- **`PHASE_STATE.json`**: The Live State. Tracks validation status and current phase.
- **`docs/technical/KNOWLEDGE_INDEX.md`**: The Knowledge Base (Project Oracle).

## 🧑‍💻 For Humans (Development)

- `docs/technical/DEVELOPMENT.md`
- `docs/technical/PORTABILITY.md` (Setup on any machine)
- `docs/operational/CI_CONTRACT.md`
- `docs/technical/VALIDATION.md`
- `docs/technical/MCP_SETUP_GUIDE.md`

## 🤖 For AI Agents

1.  **Read `docs/strategy/QUICKSTART_AGENTS.md`** immediately to ground yourself.
2.  **Consult `docs/technical/CONTEXT_MAP.md`** to navigate the documentation.
3.  **Check `PHASE_STATE.json`** to identify the active phase.
4.  **Execute Phase Tasks** using the `ops_runner.py` pattern (Superpower Mode).
5.  **Validate** using `scripts/validate-phase-X.ps1`.

**Do not deviate from the Phase State.**

### 🦾 Agent Commands
- **`/autopilot`**: Triggers full autonomous build & maintenance capability.
- **`/test`**: Runs the recommended "Enterprise QA" suite (Offline-Sync integration, E2E, Lint).
- **`/map`**: Displays the Context Map.
- **`/oracle`**: Queries the Knowledge Index.
