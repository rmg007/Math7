# Phase 12 Implementation Plan: AI Governance & Enterprise Quality

## 📊 Overview
This plan implements the definitive AI Governance framework for Questerix, ensuring content quality, cost predictability, and operational scalability.

## 🏗️ Phase 1: Foundation Layer (Week 1)

### 1. Database Infrastructure
We will extend the existing `ai_assisted_content_generation` schema to support governance primitives.

- **Table: `tenant_quotas`**
  - Columns: `id`, `app_id`, `monthly_token_limit`, `current_token_usage`, `last_reset_date`, `is_throttled`.
  - Purpose: Enforce the "Token Bucket" at the tenant level.
- **Table: `content_validation_rules`**
  - Columns: `id`, `name`, `rule_type` (regex, model_check, standard_match), `params` (JSONB), `is_active`.
  - Purpose: Centralize "Grade-Level Appropriateness" and "Factual Accuracy" checks.
- **Table: `approval_workflows`** (replacing simple status)
  - Columns: `id`, `session_id`, `stage` (AI_VAL, PEER_REVIEW, SME_FINAL), `assigned_to`, `status`.
  - Purpose: Multi-tier approval tracking.

### 2. Core Services (Supabase Edge Functions)
- **Validation Pipeline (`validate-content`)**:
  - Implementation: A new function that receives AI output and runs it through **Gemini Pro** (Validator).
  - Logic: Comparison against **Project Oracle** embeddings to ensure factual alignment.
- **Model Arbiter Logic**:
  - Implements the Flash/Pro/GPT-4o hierarchy.
  - GPT-4o only triggers if `Pro_Validation_Score < 0.8` but `Flash_Confidence > 0.7`.

### 3. Admin Panel Integration
- **Quotas Dashboard**: Real-time visualization of `tenant_quotas`.
- **Validation Badge**: Update `QuestionReviewGrid.tsx` to show "Validation Consensus Score".

---

## 🛠️ Phase 2: Intelligence Layer (Week 2)

### 1. Shadow Deduplication
- **Logic**: Before calling `generate-questions`, we perform a vector search (`match_docs`) using the prompt's intent.
- **Action**: If a similar question exists (>95% similarity in `questions` table), we flag it for the admin before spending tokens.

### 2. Token Bucket Implementation
- **RPC Function: `consume_tokens(p_app_id, p_tokens)`**
  - Uses atomic `UPDATE` with `CHECK (current_usage + p_tokens <= monthly_limit)` to prevent race conditions.

---

## ⚖️ Phase 3: Governance & Compliance (Week 3)

### 1. Content Provenance (Immutable Audit Trail)
- **Audit Extension**: Every question generated gets a `provenance_token` link.
- **Token Data**: `model_version`, `prompt_hash`, `validator_id`, `approval_timestamp`.

---

## 🚨 Risk Mitigation & Edge Cases

| Edge Case | Mitigation |
| :--- | :--- |
| **Oracle Gap** | If `match_docs` has no relevant chunks for a prompt, escalate to **Mandatory Human SME Review**. |
| **Model Outage** | Fallback from Gemini Pro -> Gemini Flash (Legacy Mode) with a "Degraded Validation" warning. |
| **Budget Collision** | Real-time Slack/Email alerts at 80% usage (Phase 10 Slack Bridge). |

## 📐 Impact Analysis
- **Database**: 3 new tables, 2 new RPCs.
- **API**: 1 new Edge Function, updates to `generate-questions`.
- **UI**: 1 new stats view, 2 component updates.

## ✅ Definition of Done (Phase 1)
- [ ] Migrations applied with verified RLS isolation.
- [ ] `validate-content` function returns a consensus score.
- [ ] Admin panel displays current tenant budget usage.
