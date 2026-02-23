# Technical Anti-Patterns

This document lists prohibited patterns and "traps" that developers and AI agents must avoid to maintain system integrity and Single Source of Truth (SSOT).

## 1. The "Lazy Python Script" Trap

**Severity:** 🔴 CRITICAL

**Description:**
Creating one-off Python scripts (e.g., `index_docs.py`, `rag_update.py`) to perform tasks that are already handled by the core system infrastructure.

**Why it's bad:**

- **Violates SSOT:** Creates competing ways to do the same thing.
- **Drift:** Python scripts usually lack the full context, config, and logic of the main application.
- **Maintenance Nightmare:** Scripts are rarely maintained and quickly break.
- **Security Risk:** Scripts often bypass security checks (RLS, auth) or mishandle secrets.

**Correct Approach:**

- **ALWAYS** check `scripts/` and `packages/` for existing tools first.
- **USE** the TypeScript-based `scripts/knowledge-base` for all RAG and indexing operations.
- **EXTEND** existing TypeScript tools instead of rewriting logic in Python.

**Example:**
❌ BAD: `python scripts/update_rag.py`
✅ GOOD: `cd scripts/knowledge-base && npx tsx indexer.ts`

---

## 2. The "Any" Type Escape Hatch

**Severity:** 🟠 HIGH

**Description:**
Using `any` in TypeScript code to bypass type checking, especially for database rows or RPC responses.

**Why it's bad:**

- Defeats the purpose of TypeScript.
- Hides bugs that will crash the app at runtime.
- Breaks refactoring tools.

**Correct Approach:**

- Use generated types from `database.types.ts`.
- Use `unknown` with runtime validation (Zod) if the type is truly unknown.
- Create discriminated unions for polymorphic data.

---

## 3. Disabling RLS for "Development Speed"

**Severity:** 🔴 CRITICAL

**Description:**
Turning off Row Level Security (RLS) on tables to fix permission errors quickly.

**Why it's bad:**

- Exposes user data to the public.
- Extremely easy to forget to re-enable before production.
- Masks fundamental architecture flaws (e.g., circular dependencies in policies).

**Correct Approach:**

- Debug the policy using `auth.uid()` and `security_definer` functions carefully.
- Use a bypass only if strictly necessary and documented with a `⚠ WARNING` comment and a ticket to fix it.
