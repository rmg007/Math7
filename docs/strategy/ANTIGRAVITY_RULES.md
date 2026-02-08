---
title: "Antigravity Coding Rules"
app_scope: meta
doc_type: prompt
complexity: critical
priority: high
status: active
summary: "Core system instructions for AI agent coding behavior in Questerix projects."
tags:
  - agent-rules
  - coding-standards
  - workflow
last_validated_by: human
last_validated_at: 2026-02-03
version: "1.0"
---

# Antigravity Coding Rules

> **Source of Truth**: This document defines the core rules for AI agent behavior in Questerix.

---

## Non-Negotiable Rules

1. **No freelancing**. Do not introduce new libraries, patterns, or architecture choices not explicitly approved.
2. **Work in phases**. Complete a phase fully, run validations, and stop at the checkpoint.
3. **Security and data integrity first**. Never rely on UI-only restrictions for admin access.
4. **Deterministic and audit-friendly**. Prefer explicitness over cleverness.

---

## Knowledge Base Usage Protocol

### Before Starting Any Task

1. **Read `llms.txt`** in the `Questerix-Docs-Backup` repository
2. **Identify relevant documents** by matching `app_scope` and `tags`
3. **Load HIGH priority docs** that match your task context
4. **Reference documentation** before implementing new patterns

### When Updating Documentation

1. **Follow `FRONTMATTER_TEMPLATE.md`** for all new documents
2. **Validate against `SCHEMA.yml`** before committing
3. **Run `generate-llms-txt.ps1`** after adding/modifying documents
4. **Critical documents require PR** - do not directly commit to `complexity: critical` docs

---

## Technology Stack Locks

### Platform
- **Student App**: Flutter (tablet-first)
- **Admin Panel**: React + Shadcn/UI (Tailwind CSS)
- **Backend**: Supabase

### State Management
- **Flutter**: Riverpod ONLY (no mixing with Provider/BLoC)
- **React**: React Query v5 for server state + React Context for UI state

### Testing
- Critical-path tests only (Auth, Sync, Data validation)
- UI: Functional + accessibility requirements

---

## Task Finalization Protocol

Upon completion of any functional task, execute autonomously:

1. **Empirical Validation**: Run unit tests covering happy path + 2 edge cases
2. **Static Analysis**: Self-review for logic issues and security vulnerabilities
3. **Refactor for Production**: Eliminate tech debt, robust error handling
4. **Documentation Sync**: Update relevant docs to reflect implementation

**Output**: Present completed code + test results + documentation updates.

---

## Proposal Pattern for Critical Changes

For changes to `complexity: critical` documents:

1. Create a branch: `ai-proposal/[description]`
2. Make changes on the branch
3. Push and create PR with diff explanation
4. Wait for human approval before merging

This ensures human oversight on the most important documentation.
