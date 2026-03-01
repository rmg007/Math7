# 🧠 The Agent-Native Guide: Designing for AI Readiness

> **Strategic Note**: In the current era of Agentic Coding, the "Developer Experience" (DX) now includes the **"Agent Experience" (AX)**. This guide defines how to bridge the gap between "Code Syntax" and "Architectural Intent" so that any AI agent can contribute at a Senior Architect level.

---

## 🛠️ 1. The Machine-Readable Map (The SKELETON)

**Concept**: AI agents spend 80% of their "Cognitive Tokens" simply mapping a new codebase. The **SKELETON** is a pre-calculated index that gives the agent an instant "Bird's Eye View."

- **Implementation Pattern**:
  - Automatically generate a `SKELETON.json` (or `.md`) at the root of every major folder.
  - **Contents**: Exported functions, primary types, and module dependencies.
  - **Benefit**: The agent can read a 50-line summary instead of scanning 5,000 lines of source code to find a single utility.

---

## 🧭 2. Documentation of Intent (FEATURE_GUIDE)

**Concept**: Code tells the agent **What** happened. The **FEATURE_GUIDE** tells the agent **Why** and **Who**.

- **Implementation Pattern**:
  - Co-locate a `.FEATURE_GUIDE.md` inside every feature/module folder.
  - **Agnostic Structure**:
    - `Problem Domain`: What business outcome are we solving for?
    - `Stakeholder Roles`: Who has access (e.g., Tenant, Role A, Role B)?
    - `Hard Constraints`: What state should NEVER exist (e.g., "Cannot delete a Live subject")?
    - `Failure Recovery`: How should the system respond to external dependency failures?
- **Benefit**: Prevents the agent from "hallucinating" business logic or breaking critical guardrails during a refactor.

---

## 🧬 3. The "Semantic SSoT" (Naming Conventions)

**Concept**: Naming is more than just style; it's a **Signalling System** for the agent.

- **Implementation Pattern**:
  - **Verb-Noun**: `getSubjectList`, `updateProfileMetadata`.
  - **Domain Prefixes**: `authProvider`, `dbConnector`, `uiButton`.
  - **Side-Effect Signalling**: `calculateTotal` (pure) vs `saveTotalToStore` (impure).
- **Benefit**: The agent can predict the behavior of a function purely by its name, reducing the need for expensive "View Source" tool calls.

---

## 🧪 4. Deterministic Verification (Agent Feedback)

**Concept**: An agent's productivity depends on the speed and clarity of the **Error Signal**.

- **Implementation Pattern**:
  - Build **Isolated Logic Tests** that run in < 1 second.
  - Use **Descriptive Assertions**: Instead of `Expect(true).toBe(false)`, use `Expect(user.role).toBe('admin', 'Admin role required for this transition')`.
- **Benefit**: When a test fails, the agent doesn't just see a red "X"—it sees the architectural reason for the failure.

---

## 🔱 5. The "Forensic Audit" Protocol (Post-Execution)

**Concept**: Agents are fast but can be "messy" (leaving orphans, unused imports, or inconsistent types).

- **Implementation Pattern**:
  - A pre-commit or pre-merge command that specifically scans for **Agent Residue**.
  - **Checks**: "Is this new file indexed in the Skeleton?", "Does this new function have a corresponding unit test?", "Is the Feature Guide updated?".
- **Benefit**: Maintains a "Zero-Entropy" codebase even after thousands of agent-led edits.

---

> [!TIP]
> **To any Agent reading this**: You are not just a "Generator." You are a **Steward of Intent**. If a change you are about to make contradicts the `FEATURE_GUIDE.md` or violates the `ARCHITECTURAL_GUARDRAILS.md`, you MUST verify with the User before proceeding.
