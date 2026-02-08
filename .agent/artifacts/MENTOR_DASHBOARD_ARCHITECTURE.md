# 🏛️ Questerix Unified "Mentor" Architecture

**Objective**: Merge "Teacher" and "Parent" workflows into a single, robust **Mentor Dashboard** using a **Group-Based Architecture**.

## 🧠 The Core Concept: "Universal Groups"
Instead of building separate "Classroom" and "Family" systems, we build **Groups**.
*   **Teacher** = Admin of a Group type `'class'`.
*   **Parent** = Admin of a Group type `'family'`.
*   **Student** = Member of multiple Groups.

This unifies the backend while allowing the Frontend to "skin" the experience (e.g., "My Class" vs "My Kids").

---

## ⚠️ Critical Design Challenge: The Identity Paradox

**The Conflict:** The Questerix Student App uses **device-bound anonymous authentication**. Students (especially young children) do not have email addresses. However, the Mentor system assumes students are identifiable `users` with UUIDs that can be assigned to groups.

**The Problem:** You cannot "invite" an anonymous device via email. A 7-year-old using a tablet in a classroom does not have an inbox to accept an invite.

**The Solution:** Implement a **Reverse-Handshake Protocol (Join Codes)**.

### The Workflow
1. **Mentor** creates a Group (`'class'`). The system generates a short code like `MATH-77`.
2. Teacher writes `MATH-77` on the whiteboard.
3. **Student** (on anonymous tablet) opens the app and enters `MATH-77`.
4. **System** links the `device_id` (or anonymous user UUID) to the `group_members` table.
5. **Mentor** sees "Anonymous Device 1" appear in their dashboard and renames it to "Johnny".

This works offline-first and requires no student email input.

## 1. 🏗️ Database Schema: The Foundation

### 1.1 New Enums & Roles
*   **User Role**: `admin` (System), `mentor` (Teacher/Parent), `student`.
*   **Group Type**: `'class'`, `'family'`.
*   **Assignment Type**: `'curriculum'`, `'custom_task'`, `'goal'`.

### 1.2 The "Group" Topology
> This handles Classroom Management & Guardian-Student Links simultaneously.

| Table: `groups` | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `owner_id` | UUID | The Teacher or Parent (FK to `profiles.id`) |
| `type` | ENUM | `'class'` or `'family'` |
| `name` | VARCHAR | "Mrs. Smith's 5th Grade" or "The Miller Family" |
| `settings` | JSONB | Screen time limits, allowed content, etc. |
| `join_code` | VARCHAR(8) | **NEW:** Human-readable code (e.g., `"MATH-77"`) |
| `code_expires_at` | TIMESTAMP | **NEW:** Optional security rotation |
| `allow_anonymous_join` | BOOLEAN | **NEW:** If true, any device with the code can join |

| Table: `group_members` | Type | Description |
| :--- | :--- | :--- |
| `group_id` | UUID | FK to `groups.id` |
| `user_id` | UUID | The Student (FK to `profiles.id` or anonymous UUID) |
| `nickname` | VARCHAR | "Johnny" (Useful for Parents renaming anonymous devices) |
| `joined_at` | TIMESTAMP | When the member joined |
| `is_anonymous` | BOOLEAN | **NEW:** True if linked via device_id, not email |

### 1.3 The "Assignment" System (Task Engine)
> Handles "Assignment Creation" (Teacher) and "Learning Goals" (Parent).

| Table: `assignments` | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `group_id` | UUID | Assign to whole class (Nullable) |
| `student_id` | UUID | Assign to specific child (Nullable) |
| `target_id` | UUID | Domain/Skill/Question ID |
| `type` | ENUM | `'skill_mastery'`, `'time_goal'`, `'custom'` |
| `due_date` | TIMESTAMP | When assignment is due |
| `status` | ENUM | `'pending'`, `'completed'`, `'late'` |
| `scope` | ENUM | **NEW:** `'mandatory'` (Teacher) vs `'suggested'` (Parent) |
| `completion_trigger` | JSONB | **NEW:** `{ "min_score": 80, "questions_count": 10 }` |

### 1.4 Assignment Conflict Resolution
> **Scenario:** A student is in "Mrs. Smith's Class" (Group A) and "The Miller Family" (Group B). Both assign "Algebra 1".

**The Rule:** The `attempts` table (actual work done) is the **source of truth**. The `assignments` table is merely a pointer.

**Logic:** When a student completes a skill, the system checks *all* pending assignments across *all* groups. If the work satisfies the `completion_trigger`, mark the assignment as complete. The student does not do work twice.

### 1.4 Communication Hub
> Handles Message Student/Parent/Teacher.

| Table: `messages` | Description |
| :--- | :--- |
| `sender_id` | UUID |
| `recipient_group_id`| UUID (Nullable - Message whole class) |
| `recipient_user_id` | UUID (Nullable - Direct Message) |
| `content` | Text |
| `is_read` | Boolean |

---

## 2. 🎨 The "Chameleon" Dashboard (UI/UX)

The Admin Panel (`/`) adapts based on the user's Context.

### 2.1 Visual Toggles
| Feature | Context: **Teacher** (`class` group) | Context: **Parent** (`family` group) |
| :--- | :--- | :--- |
| **Labeling** | "Students", "Classroom" | "Kids", "Family" |
| **Grid View** | Verified List Table (30 rows, sortable) | Profile Cards (Large, avatar-focused) |
| **Metrics** | "Class Average", "Submission Rate" | "Activity Log", "Screen Time" |
| **Actions** | "Bulk Assign", "Print Reports" | "Set Bedtime", "Pause Access" |

### 2.2 Feature Deep Dive

#### 📚 A. Assignment Center (Universal)
*   **Teacher**: Drags a "Algebra 1 Skill" onto the "Period 1" group. System generates 30 assignment records.
*   **Parent**: Clicks "Set Goal" on Child's card -> "Complete 5 math problems by Friday".

#### 🔒 B. Content Controls (Screen Time & Access)
*   Implemented via `groups.settings` JSONB.
*   **Logic**: The Student App checks `assignments` and `group_settings` on launch.
*   If `screen_time_limit_reached`: App locks out non-educational games (if we have them) or simply warns.

#### 📢 C. Audit & Notifications
*   **Teacher**: "John completed the homework" (Notification).
*   **Parent**: "Sarah hasn't logged in for 3 days" (Alert).

---

## 3. 🚀 Implementation Roadmap

### ✅ Phase 1: Core Schema (COMPLETED)
**Status:** Done (2026-02-03)
**Migration:** `20260203000007_create_mentor_hub.sql`

1. ✅ Add `mentor` to user roles.
2. ✅ Create `groups`, `group_members`, `assignments` with Join Code support.
3. ✅ Update RLS policies (see Golden Rule below).
4. ✅ Synchronize TypeScript types (`admin-panel/src/lib/database.types.ts`).

**Notes:**
- Join codes are auto-generated as 6-character alphanumeric codes (excluding confusing characters).
- RLS policies enforce the Golden Rule: Mentors only see their own groups' data.
- `allow_anonymous_join` flag controls whether devices can join without email verification.

---

## 4. 🛡️ Security: The RLS Golden Rule

This architecture requires strict Row-Level Security (RLS) to prevent the "Creepy Neighbor" effect. A parent in Group A must **never** see data from a student who is only in Group B (the Teacher's class), even if the Teacher owns both groups.

### The Policy Statement
> **"A Mentor can only view `attempts` rows where the `student_id` exists in `group_members` for a group DIRECTLY owned by that Mentor."**

### Implications
| Scenario | Access? |
|----------|--------|
| Parent views their own child's attempts | ✅ Yes |
| Teacher views their class student's attempts | ✅ Yes |
| Parent views a classmate of their child | ❌ No |
| Teacher views a student's home activity (Family group) | ❌ No |

This is non-negotiable for **COPPA** (Children's Online Privacy Protection) and **GDPR** compliance.

### ✅ Phase 2: Dashboard UI (COMPLETE)
**Status:** Complete (2026-02-03)

1. ✅ **Sidebar Evolution**: Added "My Groups" navigation link.
2. ✅ **Groups List Page** (`/groups`): Displays user's groups with:
   - Visual distinction between Class (Blue) and Family (Purple).
   - Visible join codes with copy-to-clipboard functionality.
   - Light mode styling with premium card design.
   - Empty state with call-to-action.
3. ✅ **Group Creation** (`/groups/new`): Full-featured form with:
   - Class vs Family type selector.
   - Anonymous join toggle.
   - Auto-generated join codes.
4. ✅ **Member Management** (`/groups/:id`): Full group detail page with:
   - Member list with avatars and nicknames.
   - Inline nickname editing for anonymous devices.
   - Remove member functionality.
   - Stats cards (member count, join code, anonymous settings).
5. ⏳ **Assignment Builder**: Form to assign skills/domains to groups or individual students.

### Phase 3: Advanced
1.  **Messaging**: Chat interface.
2.  **Analytics**: Charts (Recharts/Chart.js) for group progress.

---

## 5. 📋 Implementation Notes (2026-02-03)

### What Was Built
**Database Layer:**
- 4 new enums: `group_type`, `assignment_type`, `assignment_status`, `assignment_scope`.
- 3 new tables with full RLS policies and indexes.
- Automatic timestamp triggers for `groups` and `assignments`.

**Admin Panel UI:**
- New feature module: `src/features/mentorship/`.
- React Query hook for fetching groups (`use-groups.ts`).
- Premium UI with gradient cards, glassmorphism effects, and micro-interactions.
- Responsive design with mobile-first approach.

### Phase 3: Advanced
1. ✅ **Assignment Creation:** UI for mentors to assign skills/domains to groups.
   - *Status:* Complete. Feature fully functional and verified in browser.
2. ✅ **Student App Integration:** Build "Join via Code" screen in Flutter app.
   - *Status:* Implemented. Backend RPC `join_group_by_code` deployed. Frontend "Join Class" dialog added to Settings.
3. ⏳ **Progress Dashboard:** Visual analytics for mentors to track student performance.
4. **Messaging System:** Communication between mentors and students/parents.

### Known Gaps
- TypeScript type errors in `database.types.ts` (pre-existing Supabase generator issue).
- No tests yet for mentor features.
- Messaging system not implemented.

---

*Document Version: 2.2*
*Last Updated: 2026-02-03T13:25*
*Status: Phase 1 & 2 Complete, Phase 3 In Progress*
