# AppShell Project Roadmap

> **Status**: ACTIVE
> **Current Phase**: Phase 0 (Project Bootstrap)

This document visualizes the execution path defined in `AGENTS.md`.

---

## 📅 Timeline & Dependencies

```mermaid
graph TD
    P_1[Phase -1: Env Validation] -->|PASSED| P0[Phase 0: Project Bootstrap]
    
    subgraph Foundation
        P0 --> P1[Phase 1: Data Model + Contracts]
    end
    
    subgraph Parallel Development
        P1 --> P2[Phase 2: Student App Core Loop]
        P1 --> P3[Phase 3: Admin Panel MVP]
    end
    
    subgraph Finalization
        P2 --> P4[Phase 4: Hardening]
        P3 --> P4
    end
    
    style P_1 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P0 fill:#fff3cd,stroke:#ffc107,stroke-width:2px
    style P1 fill:#e2e3e5,stroke:#6c757d,stroke-width:2px
    style P2 fill:#e2e3e5,stroke:#6c757d,stroke-width:2px
    style P3 fill:#e2e3e5,stroke:#6c757d,stroke-width:2px
    style P4 fill:#e2e3e5,stroke:#6c757d,stroke-width:2px
```

---

## 📍 Milestones

### ✅ Phase -1: Environment Validation (Completed)
- [x] Flutter environment validated
- [x] Node.js environment validated
- [x] Supabase CLI authenticated

### 🚧 Phase 0: Project Bootstrap (In Progress)
- [ ] Initialize `student-app` (Flutter)
- [ ] Initialize `admin-panel` (React + Vite)
- [ ] Configure linting & tooling
- [ ] Set up `.env.example` files
- [ ] **Checkpoint**: Validation Script `validate-phase-0.ps1`

### 📋 Phase 1: Data Model + Contracts
- [ ] Apply Supabase Schema (`SCHEMA.md`)
- [ ] Configure RLS Policies
- [ ] Create Seed Scripts
- [ ] Verify 7 core tables exist
- [ ] **Checkpoint**: Validation Script `validate-phase-1.ps1`

### 📱 Phase 2: Student App Core Loop
- [ ] Drift Database Implementation
- [ ] Offline Sync Engine (Outbox)
- [ ] UI: Domain/Skill Browsing
- [ ] UI: Question Runners (5 types)
- [ ] Conflict Resolution Logic
- [ ] **Checkpoint**: Validation Script `validate-phase-2.ps1`

### 🖥️ Phase 3: Admin Panel MVP
- [ ] Admin Authentication (RBAC)
- [ ] CRUD: Domains, Skills, Questions
- [ ] Atomic Publish Workflow
- [ ] JSON Import/Export
- [ ] **Checkpoint**: Validation Script `validate-phase-3.ps1`

### 🛡️ Phase 4: Hardening
- [ ] Error Handling (Sentry)
- [ ] CI/CD Pipelines
- [ ] Production Builds
- [ ] Final Integration Tests
- [ ] **Checkpoint**: Validation Script `validate-phase-4.ps1`

---

## 🛠️ Execution Protocol

1.  **Read State**: Check `PHASE_STATE.json`
2.  **Read Law**: Follow `AGENTS.md`
3.  **Execute**: Do work for current phase
4.  **Validate**: Run validation script
5.  **Update**: Commit state & wait

**Note**: This roadmap is a high-level view. The authoritative source for implementation details is `AGENTS.md`.
