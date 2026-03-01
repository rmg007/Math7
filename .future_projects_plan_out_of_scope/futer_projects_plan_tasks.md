# 📝 AetherFlow Template Vault — Task Tracker

> [!IMPORTANT]
> **SCOPE OF THIS FILE — READ BEFORE ADDING ANY TASK**
>
> This file tracks tasks that **create, edit, or expand documents inside this vault folder** (`.future_projects_plan_out_of_scope/`).
>
> **What this vault IS**:
> A **tech-stack agnostic template & scaffold** of abstract architectural lessons, patterns, and techniques distilled from the Questerix/Cortex project. It is designed to be reusable as a starting point for _any_ future project, regardless of tech stack.
>
> **What belongs in this file**:
>
> - ✅ Authoring new architecture docs (e.g., a new `architecture/` document)
> - ✅ Updating the manifesto, guardrails, or prompt library
> - ✅ Adding new sections, patterns, or lessons learned to vault documents
> - ✅ Preparing this folder for use as a reusable scaffold/template
>
> **What does NOT belong here**:
>
> - ❌ Any task that executes in the Questerix/Cortex codebase (`admin-panel/`, `questerix-cortex/`, `supabase/`, etc.) → those go in `tasks.md`
> - ❌ Questerix sprint work, even if it is "future-planned"

---

## ✅ v1.0: Initial Knowledge Extraction — COMPLETE

> These tasks produced the first version of the AetherFlow template vault.

- [x] Create `.future_projects_plan_out_of_scope` directory structure (`/architecture`, `/governance`, `/prompts`)
- [x] Author `architecture/MANIFESTO.md` — 5 agnostic meta-principles (Dynamic Singleton, Data-Layer Authority, Forensic Pit Crew, Tiered Verification, Agent-Native Docs)
- [x] Author `architecture/STRATEGY_8_TIER.md` — Full 8-tier quality framework, tech-stack agnostic
- [x] Author `architecture/AGENT_NATIVE_GUIDE.md` — How to design codebases for AI readiness
- [x] Create `governance/ARCHITECTURAL_GUARDRAILS.md` — 7 hard security & architecture rules
- [x] Create `prompts/PROMPT_LIBRARY.md` — 5 Day-0 bootstrapping prompts for AI agents
- [x] Update `README.md` — vault navigation, agent quick-start protocol, phase status

---

## �️ v1.1: Vault Expansion (Pending)

> Tasks to enrich the template before it is published/shared as a scaffold.

- [ ] Add `architecture/MULTI_TENANCY_PATTERNS.md` — Deep-dive on the Dynamic Singleton pattern with concrete implementation examples (subdomain resolution, metadata registry, tenant isolation)
- [ ] Add `prompts/PROMPT_LIBRARY.md` — Prompt 6: "Load & Performance Testing" (k6/Locust baseline setup)
- [ ] Add `prompts/PROMPT_LIBRARY.md` — Prompt 7: "Chaos Engineering" (latency/failure injection checklist)
- [ ] Add `governance/FEATURE_GUIDE_TEMPLATE.md` — a blank, reusable `FEATURE_GUIDE.md` template any project can copy into its feature folders
- [ ] Add `architecture/SKELETON_TEMPLATE.md` — define the format for machine-readable project skeletons

---

## 🚀 v2.0: Template Publishing Prep (Future)

> Tasks required before this folder can be extracted and used as a standalone scaffold for a new project.

- [ ] Replace all Questerix-specific references in docs with agnostic placeholders (e.g., `[YOUR_PROJECT]`, `[YOUR_DATABASE]`)
- [ ] Add a `GETTING_STARTED.md` at the root — step-by-step guide for a new project team adopting this template
- [ ] Create a `scripts/` folder with a Day-0 setup script (e.g., `init-aetherflow.sh`)
- [ ] Add a `CHANGELOG.md` for this template to track version history
- [ ] Verify all 5 prompts in `PROMPT_LIBRARY.md` work correctly with Gemini, Claude, and GPT-4

---

> [!NOTE]
> **Last updated**: 2026-02-28
> For all Questerix/Cortex sprint work, refer to `tasks.md` at the project root.
