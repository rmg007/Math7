# 🗺️ Questerix Context Map

> **For AI Agents**: This file maps the documentation landscape. Use `view_file` on the relevant document to get specific context.

## 📍 Strategy & Governance
| File | Purpose |
|------|---------|
| `docs/strategy/AGENTS.md` | **The Supreme Law**. Core rules, behavioral protocols, and "Golden Commands". |
| `docs/strategy/QUICKSTART_AGENTS.md` | **Start Here**. Immediate onboarding checklist for new agent sessions. |
| `docs/strategy/PHASE_STATE_LOG.md` | (Planned) Historical log of phase transitions. See `PHASE_STATE.json` for live state. |
| `docs/strategy/ANTIGRAVITY_RULES.md` | Specialized persona rules for high-autonomy agents. |

## 🛠️ Technical Documentation
| File | Purpose |
|------|---------|
| `docs/technical/KNOWLEDGE_INDEX.md` | **Search System**. Documentation for Project Oracle (the RAG system). |
| `docs/technical/SCHEMA.md` | **Database Truth**. Complete SQL schema, RLS policies, and triggers. |
| `docs/technical/DEVELOPMENT.md` | Setup guides, command references, and local dev workflows. |
| `docs/technical/STUDENT_APP_ARCHITECTURE.md` | Flutter/Riverpod/Drift architecture deep dive. |
| `docs/technical/ADMIN_PANEL_ARCHITECTURE.md` | React/Vite/TanStack architecture deep dive. |
| `docs/technical/SECRETS_MANAGEMENT.md` | How to handle `.env`, Supabase keys, and CI secrets. |
| `docs/technical/best_practices.md` | Code style, linting rules, and preferred patterns. |
| `docs/technical/CLOUD_DEV.md` | **Cloud Setup**. Replit & GitHub Codespaces configuration. |
| `docs/technical/IDE_SETUP.md` | **Editor Setup**. Cursor, Windsurf, & VS Code optimization. |

## ⚙️ Operational & CI/CD
| File | Purpose |
|------|---------|
| `docs/operational/DEPLOYMENT_PIPELINE.md` | CI/CD workflows, GitHub Actions, and release process. |
| `docs/operational/CI_CONTRACT.md` | The "Proof of Run" requirements for every PR. |

## 📐 Specifications (Specs)
| File | Purpose |
|------|---------|
| `docs/specs/PRODUCT_REQUIREMENTS.md` | High-level PRD and user stories. |
| `docs/specs/DATA_MODEL.md` | Conceptual data model and entity relationships. |
| `docs/specs/API_SPEC.md` | RPC definitions, Edge Function signatures. |
| `docs/specs/STUDENT_APP_SPEC.md` | Detailed UI/UX and logic spec for the Mobile App. |
| `docs/specs/ADMIN_PANEL_SPEC.md` | Detailed UI/UX and logic spec for the Admin Dashboard. |

## 🗄️ Archive & Legacy
| File | Purpose |
|------|---------|
| `docs/archive/LEGACY_PHASE_0_TO_4.md` | Old phase definitions (useful for reference patterns). |

---

## 🧭 Navigation Heuristics

1. **New to the project?** Read `docs/strategy/QUICKSTART_AGENTS.md`.
2. **Need to write code?** Check the relevant architecture doc in `docs/technical/`.
3. **Database change?** Consult `docs/technical/SCHEMA.md` first.
4. **Submitting a PR?** Verify against `docs/operational/CI_CONTRACT.md`.
