# 🎯 PLAN: AI Performance Registry (Phase 13)

**Objective**: Eliminate file-scanning latency by implementing a "Database-First" metadata registry in Supabase.

---

## 🏗️ Architecture Sidebar
1.  **Registry Table**: `kb_registry`
    - Stores metadata for all apps, edge functions, and modules.
    - Enables sub-100ms counts and status checks.
2.  **Lifecycle Integration**: `orchestrator.ps1`
    - Automatically syncs deployment status to the registry after successful builds.
3.  **Instruction Pivot**:
    - Update AI rules to prioritize the registry over `list_dir`.

---

## 📊 Phase Breakdown

### Phase 1: Planning & Strategy (LOCKDOWN)
*   **Blueprint**: Finalize schema fields (name, type, platform, status, live_url, tech_stack).
*   **Constraint**: No hard-coding. Registry must be derived from `master-config.json`.

### Phase 2: Database & Schema Evolution
*   **Migration**: `supabase/migrations/20260204000007_create_ai_registry.sql`
*   **Security**: RLS "Read Only" for all, "Write" for service_role.
*   **Types**: Generate updated TypeScript interfaces.

### Phase 3: Implementation & Quality Loop
*   **Script**: `scripts/knowledge-base/sync-registry.ps1`
    - Logic: Reads `master-config.json`, iterates projects, upserts to Supabase.
*   **Metrics**: Simple line-count and file-count analyzer for `kb_metrics`.

### Phase 4: Orchestrator Integration
*   **Hook**: Inject `sync-registry.ps1` into the `Invoke-PhaseCleanup` or `Invoke-PhaseDeploy` stage of `orchestrator.ps1`.

### Phase 5: Verification & Quality Audit
*   **Speed Test**: Compare `SELECT COUNT(*)` time vs. `Get-ChildItem -Recurse` time.
*   **Visual Check**: Verify the registry data matches reality.

### Phase 6: Finalization & Instruction Update
*   **Single Source of Truth**: Update `.cursorrules` and `AI_CODING_INSTRUCTIONS.md` with "Database-First" retrieval logic.

---

## ⚠️ Risks & Mitigation
*   **Risk**: Registry becomes stale if a developer manually deploys without the orchestrator.
*   **Mitigation**: Add a "Scan on Null" fallback rule + provide a manual `npm run sync-knowledge` command.

---

## ✅ Readiness
- [x] Supabase Connection Active
- [x] Orchestrator Permissions Verified
- [x] Turbo Authorization Enabled
