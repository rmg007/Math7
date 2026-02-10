# Questerix System Excellence & Standardization Plan

This document outlines the systematic strategy to resolve technical debt, security risks, and architectural drift across the Questerix ecosystem. 

## ✅ Phase 1: The Constitution (Protocol Unification) - FINISHED
- [x] **Supreme Agent Protocol**: Created `docs/strategy/AGENTS.md` as the repository SSoT.
- [x] **Tooling Alignment**: Overwritten `.cursorrules`, `.windsurfrules`, and `.github/copilot-instructions.md`.
- [x] **Pilot Proof**: Strictly typed `SubjectsPage.tsx` with zero `any`/`as` casting.

---

## 🚨 Phase 2: Emergency Security & Hygiene (Plan 1)
### 2.1 Critical Database Fixes (VUL-019)
- [ ] **RLS Loop Fix**: Deploy `get_auth_context()` to resolve infinite recursion in `profiles`.
- [ ] **Shield Knowledge**: Enable RLS on `knowledge_chunks`.
- [ ] **Invoker Enforcement**: Convert `critical_spec_failures` to `SECURITY INVOKER`.

### 2.2 Security Hardening & Leaks
- [ ] **Nuke Backups**: Delete `backups/secrets/` and ensure it's removed from git history.
- [ ] **MCP Leakage**: Move `.mcp_config.json` to `.example` and relative-ize paths.
- [ ] **Admin Env Fix**: Update `secrets.example.env` with instructions on where to obtain `VITE_SUPABASE_URL`.
- [ ] **Codacy Repair**: Link badges and `.codacy.yml` to the actual repo.

### 2.3 Immediate Hygiene (The "Noise" Purge)
- [ ] **Gitignore Audit**: Block `.session/`, `logs/`, `tasks.status.json`, and all `test-output.txt`.
- [ ] **Config Sprawl**: Resolve duplicate `.dependency-cruiser` configs and delete redundant `master-config.*.json` from root.
- [ ] **Task Cleanup**: Standardize on `tasks.json`; remove `tasks.json.example` from tracking.

---

## 🏗️ Phase 3: Architectural Convergence & Automation
### 3.1 Monorepo Orchestration
- [ ] **Nx Implementation**: Bridge TS, Dart, and Python builds into a single graph.
- [ ] **Type Authority**: CI block on type-drift between DB migrations and generated files.

### 3.2 Testing & Quality
- [ ] **pgTAP RLS Checks**: Automated database security regression tests.
- [ ] **Integration Handshake**: Playwright test for Student App -> Supabase -> Admin Panel.

---

## 🎨 Phase 4: Admin UI Standardization (Active)
- [ ] **Publish/Group Detail/Account Settings**: Convert to `AdminHeader` + glassmorphism.
- [ ] **Global Polishing**: 100% `Skeleton` loaders; 0% "Loading..." strings.

---

## 📚 Phase 5: "Pure Truth" Decommissioning (Plan 2)
- [ ] **Re-index Oracle**: Execute knowledge indexer and purge all legacy reports to `/archive/`.
- [ ] **Global Name Scrub**: Replace all instances of `Math7` with `Questerix`.
- [ ] **Pre-commit Guard**: Lint-rule to block `any` types in features.
- [ ] **Root Script Purge**: Consolidate all entry points under a single `Makefile` + `scripts/agent/`.
