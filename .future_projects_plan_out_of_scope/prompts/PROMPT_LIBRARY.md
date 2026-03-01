# ⚡ The AetherFlow Prompt Library (Day 0 Bootstrapping)

> **Strategic Note**: These prompts are designed to be used by a Human Developer when starting a new project with an AI Agent. They "prime" the agent to follow AetherFlow principles from the very first line of code.

---

## 🏗️ Prompt 1: The "Deep Context" Injection

**Use case**: Use this as the very first message in a new chat/session to set the architectural foundation.

```text
Act as a Principal Staff Architect. We are starting a new project following the "AetherFlow Blueprint."

Our core architectural pillars are:
1. Dynamic Singleton: One codebase, multiple tenant contexts resolved at runtime via headers/metadata.
2. Data-Layer Authority: Security (RLS) and integrity are enforced at the data origin, never just the UI.
3. Forensic Pit Crew: We use a parallel scanner/orchestrator to verify every change.
4. Agent-Native Design: We write code for both humans and AI (Intent Documentation + Machine-Readable Skeletons).

Before we write code, I want you to:
- Propose a directory structure that isolates "Features" from "Shared Core."
- Plan a "Health-First" CI gate following the 8-tier quality framework.
- Describe how you will resolve multi-tenant context without hardcoding environment variables.

Wait for my response before proceeding.
```

---

## 🛡️ Prompt 2: The "RLS-First" Table Creation

**Use case**: Use this when asking the agent to create a new database table or entity.

```text
I need to add a new entity: [ENTITY_NAME].

Following AetherFlow governance:
1. Define the schema with mandatory tenant-isolation columns (e.g., app_id).
2. Write the OLS (Origin-Level Security) / RLS policies immediately.
3. Include an "Audit Checklist" in the comment block: Who can SELECT, INSERT, UPDATE, DELETE, and why?
4. If a policy is omitted (e.g., DELETE is forbidden), document the business rationale in the SQL migration.

Do not create the table without the security policies.
```

---

## 🧠 Prompt 3: The "Intent Documentation" (FEATURE_GUIDE)

**Use case**: Use this when a feature reaches "Beta" to ensure it's documented for future agents.

```text
Let's formalize the INTENT for the [FEATURE_NAME] module. Create a FEATURE_GUIDE.md inside the module folder.

Structure it for an AI Brain:
- Business Goal: What problem does this solve?
- Stakeholders: Who (Role/Tenant) interacts with this?
- Guardrails: What are the "Impossible States" or hard constraints we MUST enforce?
- Failure Modes: What happens if the network or data-source is unavailable?
- Data Lifecycle: How does a record move from 'Draft' to 'Live'?

Focus on WHY we built it this way, not just HOW the code works.
```

---

## 🧪 Prompt 4: The "Deterministic Test" Request

**Use case**: Use this when implementing a new test suite.

```text
We need a test suite for [MODULE_NAME].

Requirements:
- Use "Persistence Snapshots" (storageState) to bypass UI logins.
- Ensure the test is "Deterministic": It must wipe/seed its own specific data or use an isolated tenant.
- Tag the test: Use @logic for pure logic, @responsive for layout-heavy checks, and @smoke for critical paths.
- Performance: Aim for a maximum execution time of 5 seconds per test file.
```

---

## 🚦 Prompt 5: The "Forensic Audit" Pre-Release

**Use case**: Run this before a major merge or deployment.

```text
Perform a "Forensic Audit" of our current state.
- Scan for "Silent Failures" (e.g., empty catch blocks, missing RLS policies).
- Check for "Type-Drift" between the data layer and the UI layer.
- Verify our "8-Tier Quality" coverage. Which tiers are currently at 0%?
- Propose an implementation plan to fill the gaps.
```

---

> [!TIP]
> **Pro Tip for Humans**: You can copy the entire content of `architecture/MANIFESTO.md` and `architecture/STRATEGY_8_TIER.md` and paste them into a long-context window (like Gemini or Claude) alongside these prompts for maximum alignment.
