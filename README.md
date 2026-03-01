# Questerix: Autonomous Agent Instruction Set

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/ca061805934446349d970335029a9937)](https://app.codacy.com/gh/rmg007/Questerix/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/ca061805934446349d970335029a9937)](https://app.codacy.com/gh/rmg007/Questerix/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)

> **The "Golden Command" to start development:**
>
> ```text
> "Read AGENTS.md at project root. Then check questerix-cortex/outputs/AGENT_CONTEXT.md."
> ```

---

## 🔗 Essential Links

- **🔥 Start Development**: Follow instructions in `AGENTS.md` (Phase 0)
- **🧠 Coding Standards**: [docs/standards/ORACLE_COGNITION.md](./docs/standards/ORACLE_COGNITION.md) - IDD Protocol & language patterns
- **🐛 Best Practices**: See `AGENTS.md` — Core Rules section
- **🔒 Security Model**: See `docs/standards/ORACLE_COGNITION.md` — Part 4: Security Checklist

---

## 🚀 Overview

This repository contains the complete **Executive Specification** for **Questerix** - an offline-first educational platform. It is designed to be consumed by AI Coding Agents (Cursor, Antigravity, etc.) to autonomously build the application.

The project consists:

1.  **Student App** (`student-app/`): A Flutter tablet app (offline-first, Drift DB).
2.  **Admin Panel** (`admin-panel/`): A React dashboard (shadcn/ui, Supabase Auth).
3.  **Domain Models** (`questerix_domain/`): Shared Dart models and validators.
4.  **Backend**: Supabase (PostgreSQL, Edge Functions, Realtime).
5.  **Workers** (`workers/`): Cloudflare Worker for AI generation and email alerts.

## 🌐 Sibling Repositories

| Repo                                                                         | Purpose                                              | Status    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- | --------- |
| [questerix-landing-pages](https://github.com/rmg007/questerix-landing-pages) | Public marketing site (React/Vite, Cloudflare Pages) | Extracted |
| [questerix-help-docs](https://github.com/rmg007/questerix-help-docs)         | User help center (VitePress, Cloudflare Pages)       | Extracted |

## 📂 Key Files

- **`AGENTS.md`** (root): The Constitution. Core rules, discovery, and behavioral protocols.
- **`questerix-cortex/outputs/AGENT_CONTEXT.md`**: The Session Startup Snapshot (health, context, next task).
- **`docs/technical/CONTEXT_MAP.md`**: The Map. Use this to find technical documentation.
- **`PHASE_STATE.json`**: The Live State. Tracks validation status and current phase.
- **`docs/technical/KNOWLEDGE_INDEX.md`**: The Knowledge Base (Project Oracle).

## 🧑‍💻 For Humans (Development)

- `docs/technical/DEVELOPMENT.md`
- `docs/technical/PORTABILITY.md` (Setup on any machine)
- `docs/operational/CI_CONTRACT.md`
- `docs/technical/VALIDATION.md`
- `docs/technical/MCP_SETUP_GUIDE.md`
- `docs/technical/CLOUD_DEV.md` (Replit & Codespaces)
- `docs/technical/IDE_SETUP.md` (Cursor, Windsurf, VS Code)
- `scripts/setup-automation.sh` (Minimal Viable Automation setup)

## 🛠️ Development Automation

This project uses **Husky** and **lint-staged** to ensure code quality:

- **Pre-commit**: Automatically lints and formats changed files (<5s).
- **Pre-push**: Validates types (Admin Panel) and analyzes code (Student App).

To set up locally:

```bash
# On Windows/Bash
bash scripts/setup-automation.sh
# On Windows/PowerShell
.\scripts\setup-automation.ps1
```

## 🤖 For AI Agents

1.  **Read `AGENTS.md`** immediately to ground yourself. Then read `questerix-cortex/outputs/AGENT_CONTEXT.md`.
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
- **`/certify`**: Runs high-integrity auditing (IDD protocol).

_See `docs/technical/DEVELOPMENT.md` for full command details._
