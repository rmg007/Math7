# 🧪 Impact Analysis & Testing Strategy: Mentor Features

## 💥 Impact Analysis: "Ripple Effects"

Implementing the **Universal Group Model** will impact the ecosystem as follows:

### 1. 📱 Student App (Flutter) - **High Impact**
The Student App is currently "Self-Paced". This feature introduces "Directed Learning".
*   **Home Screen**: Must evolve to show **"My Assignments"** or **"Due Soon"** at the top.
*   **Notification System**: Needs to listen for "New Assignment" or "Message from Teacher" events.
*   **Auth**: Student profile now needs to optionally display "Linked to: Mr. Smith's Class".
*   **Data Fetching**: New Repo methods needed to fetch `assignments` table.
*   *Risk*: If logic fails, students might not see homework.
*   *Mitigation*: "Fall-back" design. If Assignments fail to load, the standard "Practice" mode still works.

### 2. 🖥️ Admin/Mentor Panel (React) - **Very High Impact**
This transforms the app from a "CMS" to a "SaaS Product".
*   **Routing**: New `/dashboard/mentor/*` routes.
*   **State Management**: Requires fetching Group Context.
*   *Risk*: Complexity in "Role Switching" (if a Super Admin wants to test Teacher view).
*   *Mitigation*: Strict Role Guards and explicit "Impersonation Mode" later.

### 3. 📄 Landing Pages - **Low Impact**
*   Marketing only. Needs new sections: "For Teachers" and "For Parents".

### 4. 🗄️ Database - **Medium Impact (Additive)**
*   New tables (`groups`, `assignments`) layer *on top* of existing schemas.
*   **Zero Risk** to existing Content (`domains`/`skills`).
*   **RLS Complexity**: This is the hardest part. Policies must accurately handle "Teacher -> Group -> Student" transitive permission.

---

## 🛡️ The Testing Plan: "Trust but Verify"

We will add a specific **Phase 4b: Mentor Feature Verification** to the workflow.

### Tier 1: Security & Policy Tests (The "Bank Vault" Check)
*   **Goal**: Ensure a Teacher CANNOT see students from another class.
*   **Method**: `supabase test` (pgTAP) or specialized Dart "Policy Contract" tests.
    *   `test('Teacher A cannot read Student B in Group C')`
    *   `test('Parent can only assign content to their own child')`

### Tier 2: Flow Verification (E2E)
*   **Tool**: Playwright (Admin Panel).
*   **Scenarios**:
    1.  **" The Classroom Setup"**:
        *   Login as Teacher -> Create Group "Math 101" -> Generate Invite Code.
    2.  **"The Assignment Loop"**:
        *   Create Assignment "Algebra Basics" -> Verify it appears in "Pending" state.
    3.  **"The Parent Trap"** (Invalid Access):
        *   Login as Parent -> Try to access a URL for a Class Group -> Expect 403 Forbidden.

### Tier 3: Student Integration (Flutter)
*   **Tool**: Flutter Integration Test.
*   **Scenario**:
    *   Mock "Supabase Assignment Response".
    *   Verify "Due Date" badge appears on the Widget.

## 📋 Acceptance Criteria (Definition of Done)
1.  [ ] **Schema**: `groups` and `assignments` tables created with verifiable RLS.
2.  [ ] **Admin**: Teachers can create a group and see the "Empty State".
3.  [ ] **Security**: Negative Test passed (Unauthorized access blocked).
4.  [ ] **Student**: (Later Phase) UI shows the assigned task.

---

### 🏁 User Decision
*   This plan ensures we don't break the existing "Self-Study" mode.
*   It places strict automated guards around data privacy (GDPR compliance for minors).
