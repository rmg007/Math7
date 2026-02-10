# Admin UI Standardization Plan

This document outlines the systematic plan to achieve a 100% premium and consistent user experience across the Questerix Admin Panel, following the February 2026 UI/UX overhaul.

## 🎯 Completed: Core List Standardization
All primary list pages now feature the standardized two-row filter bar layout:
- [x] **Subjects Page** (`SubjectsPage.tsx`)
- [x] **Apps Page** (`AppsPage.tsx`)
- [x] **User Management** (`UserManagementPage.tsx`)
- [x] **Invitation Codes** (`InvitationCodesPage.tsx`)
- [x] **Sessions History** (`SessionsPage.tsx`)
- [x] **Governance Page** (`GovernancePage.tsx`)
- [x] **Error Logs** (`ErrorLogsPage.tsx`)
- [x] **Known Issues** (`KnownIssuesPage.tsx`)
- [x] **Version History** (`VersionHistoryPage.tsx`)
- [x] **Curriculum Lists** (`DomainList`, `SkillList`, `QuestionList`)
- [x] **Groups Page** (`GroupsPage.tsx`) - *Added search and standardized layout.*

---

## 🚀 Phase 1: Header & Page Layout Standardization
Finalize the conversion of all pages to use the unified `AdminHeader` and glassmorphic design tokens.

### 1.1 Publish Page Refinement
- **File**: `src/features/curriculum/pages/publish-page.tsx`
- **Actions**:
  - Replace manual title layout with `AdminHeader`.
  - Refine status cards (Current Version, Live Content) to use the premium glassmorphism style.
  - Standardize the validation issue list styling.

### 1.2 Group Detail Page Cleanup
- **File**: `src/features/mentorship/pages/GroupDetailPage.tsx`
- **Actions**:
  - Replace manual breadcrumbs/title with `AdminHeader`.
  - Ensure the multi-tab navigation (Members, Assignments, Progress) uses consistent spacing and active states.
  - Standardize the "Join Code" copy widget styling.

### 1.3 Account Settings Overhaul
- **File**: `src/features/auth/pages/AccountSettingsPage.tsx`
- **Actions**:
  - Implement `AdminHeader`.
  - Update profile and security sections into consistent `Card` groups with consistent typography and colors.
  - Standardize danger zone buttons (Deactivate/Delete).

### 1.4 Creation & Edit Pages
- **Files**: `DomainCreatePage`, `SkillCreatePage`, `QuestionCreatePage`, etc.
- **Actions**:
  - Implement a standardized "Back to List" header pattern for all forms.
  - Ensure consistent form spacing and action button placement (fixed footer on mobile, right-aligned on desktop).

---

## 🎨 Phase 2: Component & State Consistency
Ensure micro-interactions and empty states are uniform across the application.

### 2.1 Standardized Loading & Spinners
- **Files**: All pages with data fetching.
- **Actions**:
  - Replace inline "Loading..." text with unified `Skeleton` loaders or the central `Loading` spinner component.

### 2.2 Empty State Governance
- **Files**: `UserManagementPage`, `SessionsPage`, `KnownIssuesPage`, `LandingsPage`.
- **Actions**:
  - Implement the `EmptyState` component consistently when no data is returned from filtering or initial load.

### 2.3 Select Component Styling
- **Files**: Filter bars with Select dropdowns.
- **Actions**:
  - All Select triggers should use the minimalist badge style:
    ```tsx
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FILTER:</span>
      <Select ... />
    </div>
    ```

---

## 🛠️ Phase 3: Technical Integrity & Quality
Final sweep to ensure the implementation is robust and follows the "Zero-Any" policy.

### 3.1 Type Safety Sweep
- **Actions**:
  - Audit `GroupsPage.tsx` and recently standardized pages for any legacy `any` types or unsafe non-null assertions (`!`).
  - Ensure all hook results are properly typed using `LandingPage`, `Group`, `Session`, etc.

### 3.2 Responsive Verification
- **Actions**:
  - Verify that the new two-row filter bars stack correctly on mobile (usually flex-col on small screens).
  - Check Table overflow-x behavior for all newly standardized lists.

---

## 📈 Success Metrics
- 100% of pages use `AdminHeader`.
- 100% of lists have a `Results` badge.
- 0 instances of inline "Loading..." strings.
- 0 linting errors in the `src/features` directory.
