# implementation_plan.md - Questerix UI/UX Master Fix Plan

## Objective
Address the 17 identified UI/UX inconsistencies and critical functional gaps across the Questerix Admin Panel to provide a premium, cohesive, and fully functional management experience.

---

## Phase 1: Critical Utility & Data Visibility
**Goal**: Ensure users can see all content and access existing "hidden" features.

1.  **Repair Table Responsiveness**
    *   [x] Audit all table containers (Domains, Skills, Questions, Error Logs, Invitation Codes).
    *   [x] Replace `overflow-hidden` with `overflow-x-auto` on parent wrappers.
    *   [x] Ensure "Actions" columns use sticky positioning or have guaranteed visibility.
2.  **Fix Questions Page Functional Gaps**
    *   [x] **Data Join Fix**: Update `useQuestions` hook to correctly map `skills.title` to the UI column (currently searching for `skills.name`).
    *   [x] **Action Visibility**: Ensure the "Edit" link is clearly visible in the table row (recovering it from clipping).
3.  **Invitation Code Management**
    *   [x] Confirm visibility of "Copy" and "Deactivate" actions in the data table.
    *   [x] Standardize row height to prevent button vertical clipping.

## Phase 2: Navigation & Structural Hierarchy
**Goal**: Organize the flat list of 14+ pages into a logical, hierarchical system.

1.  **Sidebar Accordion Refactor**
    *   [x] Group items into collapsible sections:
        *   **Curriculum**: Domains, Skills, Questions, Subjects, AI Generator.
        *   **Deployment**: Publish, Version History.
        *   **Monitoring**: Error Logs, Known Issues, AI Governance.
        *   **Platform**: Apps, Landing Pages, User Management, Invitation Codes.
        *   **System**: Settings.
2.  **Unified Page Header Component**
    *   [x] Create a reusable `AdminHeader` component.
    *   [x] Standardize title sizes, breadcrumb support, and "Add" button placement.
    *   [x] Remove inconsistent ad-hoc title coloring (e.g., raw red/purple titles).

## Phase 3: Professional Formatting & Data Mapping
**Goal**: Replace "Developer-speak" with "User-speak" and render rich content.

1.  **Human-Readable Map**
    *   [x] Create a utility for raw identifiers: `Multiple_choice` -> `Multiple Choice`, `super_admin` -> `Super Admin`.
    *   [x] Apply this to Question types, User roles, and App categories.
2.  **Rich Text Rendering**
    *   [x] Integrate `ReactMarkdown` in the **AI Governance** feature to properly render Security Notes.
3.  **Unified Status Badge System**
    *   [x] Create a `StatusBadge` primitive.
    *   [x] Centralize color logic: `Draft` (gray), `Active` (green), `Published` (blue), `Exhausted` (red).

## Phase 4: UX Polish & Consistency
**Goal**: Smooth out the empty states and layout inconsistencies.

1.  **Premium Empty States**
    *   [x] Replace "No items found" text with an `EmptyState` component featuring an icon, description, and primary CTA.
2.  **Filter Bar Standardization**
    *   [x] Align filter layouts (Search | Status | Category) to the same grid across all Curriculum pages (Domains, Skills, Questions).
    *   [x] Extended to Platform pages (Apps, User Management) for premium UI consistency.
3.  **Z-Index & Overlays**
    *   [ ] Fix z-index of floating widgets to ensure they don't obscure table actions or summary cards.
4.  **Pagination Audit**
    *   [x] Add standard pagination to Invitation Codes, Apps, and User Management for consistent UI feel.

## Phase 5: Security & Governance Compliance
**Goal**: Verify architectural integrity and protect multi-tenant boundaries.

1.  **Harden RLS Tenant Isolation**
    *   [x] Remediation for VUL-018: Restricted `admin` role access to specific `app_id` boundaries.
    *   [x] Verified `Super Admin` global access vs `Admin` scoped access.
2.  **Audit AI Security Logs**
    *   [x] Integration of Security Notes with Markdown rendering for transparency.

---

## Success Metrics
- [x] 0% Clipping on 13.3" laptop screens.
- [x] No raw underscores visible in the UI.
- [x] Sidebar requires no scrolling on standard viewports.
- [x] 100% rendering of Markdown and HTML content.
