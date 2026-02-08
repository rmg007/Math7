# AppShell Project Roadmap

> **Status**: ACTIVE
> **Current Phase**: Phase 5 (Multi-Tenant Platform / Questerix Transformation)

This document visualizes the execution path defined in `AGENTS.md`.

---

## 📅 Timeline & Dependencies

graph TD
    P_1[Phase -1: Env Validation] -->|PASSED| P0[Phase 0: Project Bootstrap]
    
    subgraph Foundation
        P0 --> P1[Phase 1: Data Model + Contracts]
    end
    
    subgraph Parallel Development
        P1 --> P2[Phase 2: Student App Core Loop]
        P1 --> P3[Phase 3: Admin Panel MVP]
    end
    
    subgraph Transformation
        P2 --> P4[Phase 4: Hardening]
        P3 --> P4
        P4 --> P5[Phase 5: Multi-Tenant Architecture]
        P5 --> P6[Phase 6: Shared Domain]
        P6 --> P7[Phase 7: Transformation]
    end

    subgraph Feature Expansion
        P7 --> P8[Phase 8: Mentorship]
        P8 --> P9[Phase 9: Landing Pages]
    end

    subgraph Security Pivot
        P9 --> P10[Phase 10: Operation Ironclad]
    end

    subgraph Content Revolution
        P10 --> P11[Phase 11: AI-Assisted Content Generation]
    end
    
    style P_1 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P0 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P1 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P2 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P3 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P4 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P5 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P6 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P7 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P8 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P9 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P10 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P11 fill:#fff3cd,stroke:#ffc107,stroke-width:2px
```

---

## 📍 Milestones

### ✅ Phase -1 to 4 (Completed)
*Refer to archive or git history for details.*

### ✅ Phase 5: Multi-Tenant Platform (Completed)
- [x] Multi-tenant Subjects/Apps schema
- [x] App Landing Pages content system

### ✅ Phase 6: Shared Domain (Completed)
- [x] Extracted `math7_domain` package
- [x] Code Scalpel Refactor

### ✅ Phase 7: Transformation (Completed)
- [x] WCAG 2.1 AA Compliance Certification
- [x] Comprehensive Widget Test Grid (58+ tests)
- [x] Git History Scrubbing

### ✅ Phase 8: Mentorship & Social (Completed)
- [x] Mentor Groups schema (`groups`, `group_members`)
- [x] Join via Code (RPC)
- [x] Progress Matrix Dashboard

### ✅ Phase 9: Landing Pages & Branding (Completed)
- [x] Tenant-aware Routing
- [x] Verification & Stabilization

### ✅ Phase 10: Operation Ironclad (Completed)
- [x] **Schema**: `student_recovery_keys` & `group_join_requests` tables
- [x] **Schema**: Multi-tenant scoping (`app_id`) & Recursive RLS
- [x] **RPC**: `recover_student_identity` & `join_group_via_code`
- [x] **Client**: HMAC Data Integrity (`AppSignatureService`)
- [x] **Client**: Context Injection (`AppConfigService`)

### ✅ Phase 11: Project Oracle (Completed)
- [x] Vector store implemented with pgvector
- [x] Documentation-aware semantic search (Oracle Docs RAG)
- [x] CI/CD auto-indexing pipeline

### 🤖 Phase 12: AI Content Generation (ACTIVE)
**Goal**: Leverage AI (Gemini Flash / OpenAI) to scale curriculum generation while maintaining human content sovereignty.

#### Step 1: Infrastructure & Parsing
- [x] Python-based document processing (`content-engine`)
- [x] Browser-side text extraction (`pdf.js` integration)
- [x] Supabase Edge Function (`generate-questions`)

#### Step 2: Generation & Review Pipeline
- [x] Admin Panel: AI Question Generation Dashboard
- [x] Admin Panel: Human-in-the-Loop Review Grid
- [x] Export to CSV functionality

#### Step 3: Integration & Bulk Import
- [ ] **Implementation**: Connect CSV export to Questions Bulk Import
- [ ] **Workflow**: Review -> Edit -> Approve -> Bulk Import


---

## 🛠️ Execution Protocol

1.  **Read State**: Check `PHASE_STATE.json`
2.  **Read Law**: Follow `AGENTS.md`
3.  **Execute**: Do work for current phase
4.  **Validate**: Run validation script
5.  **Update**: Commit state & wait

**Note**: This roadmap is a high-level view. The authoritative source for implementation details is `AGENTS.md`.
