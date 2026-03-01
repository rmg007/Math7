# ⚖️ AetherFlow Governance: Architectural Guardrails

> **Strategic Note**: These are the "Hard Rules" of the game. They are tech-stack agnostic and exist to prevent common project regressions, data leaks, and "Silent Failures" as a platform scales to 5 million users.

---

## 🛡️ 1. Security-at-the-Origin (RLS-First)

**Rule**: No data entity (Table, Collection, Document) is created without an associated access policy.

- **Forbidden**: A "bypass-all" policy or trusting a user-provided ID blindly in a payload.
- **Mandatory**: Verification. Every new entity must have an automated test that attempts unauthorized access (Negative Testing).
- **Agnostic Logic**: `ALLOW (Operation) IF (Subject.Identity matches Object.TenantContext)`.

---

## 🧩 2. The Isolation Dividend (Module Boundaries)

**Rule**: Modules (Features) must be "Island-Native." They communicate via a shared "Core" or an "Event Bridge," never via direct cross-feature imports.

- **Forbidden**: A `Feature A` component importing from a `Feature B` component.
- **Mandatory**: Direct communication happens only via a defined `contract` or a shared `store`.
- **Agnostic Logic**: `Module A <--> Contract <--> Module B`.

---

## 🚀 3. Speed-as-a-Feature (Verification Velocity)

**Rule**: The developer's inner feedback loop (Code → Test → Result) must be < 10 seconds.

- **Forbidden**: Forcing a full UI-login flow for Every. Single. Test.
- **Mandatory**: Use **Session Persistence Snapshots**. Pre-authenticate once, cache the session-token, and reuse it for 99% of the suite.
- **Agnostic Logic**: Bypass redundant layers during verification to focus on the target logic.

---

## 🧠 4. Cognitive Load Reduction (Agent-Native)

**Rule**: The codebase must be "AI-Readable" and "Agent-Safe."

- **Forbidden**: Magic strings, hidden side-effects, or documentation that only describes _syntax_ (which the AI already knows).
- **Mandatory**: **Intent Documentation** (`FEATURE_GUIDE.md`). Every module must describe its "Stakeholders" and "Fail-Safe States."
- **Agnostic Logic**: Documentation exists to provide the **Context of Why** that code cannot infer on its own.

---

## 🚦 5. The "No-Profile" Automation (Environment Purity)

**Rule**: All automation scripts (Build, Deploy, Test) must run in a "Clean-Room" environment.

- **Forbidden**: Relying on a specific developer's local shell profile, aliases, or "It works on my machine" configurations.
- **Mandatory**: Use **Explicit Environment Injection** and `--no-profile` (or equivalent) in all CLI automation.
- **Agnostic Logic**: The script must be the master of its own dependency world.

---

## 🛠️ 6. Error Integrity (Zero-Silence Policy)

**Rule**: Errors must be "Promoted," never "Swallowed."

- **Forbidden**: Empty `catch` blocks or `try-except` chains that merely log "Error occurred" without context.
- **Mandatory**: **Contextual Re-Throwing** or **Triage Promotion** into a monitored error store.
- **Agnostic Logic**: An error is a piece of knowledge. If you hide it, you lose the opportunity to fix a systemic failure.

---

## 📈 7. Scalability-by-Design (Stateless UI)

**Rule**: The client layer is a "Skin," not a "Brain."

- **Forbidden**: Storing business logic or authority-decisions in the UI layer.
- **Mandatory**: The UI asks the **Metadata Registry** for its "Persona" (Colors, Features, Labels). The UI itself should be agnostic to the specific business vertical.
- **Agnostic Logic**: Separation of **Dynamic Metadata** from **Static Code**.

---

> [!IMPORTANT]
> **Adherence Check**: Any PR or architectural change that violates one of these 7 guardrails must be rejected during the "Forensic Audit" phase.
