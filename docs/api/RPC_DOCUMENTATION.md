# Questerix RPC API Documentation

## Overview
This document outlines the Remote Procedure Call (RPC) functions available in the Questerix Supabase database. These functions encapsulate business logic, data consistency checks, and complex transactional updates.

**Authentication:** All functions require an authenticated user session (`auth.uid()`) unless otherwise noted.
**Priority:** High (Core Functionality)

---

## 1. Curriculum Management

### `publish_curriculum`
* **Description:** Publishes the current state of the curriculum. Performs validation checks for orphaned skills or questions before publishing. Increments the curriculum version.
* **Authorization:** **Admin Only** (checked via `is_admin()`).
* **Parameters:** None.
* **Returns:** `void`
* **Throws:**
    * `Unauthorized: Only admins can publish`
    * `Cannot publish: orphaned skills detected`
    * `Cannot publish: orphaned questions detected`
    * `Cannot publish: empty domains detected`

---

## 2. Progress & Attempts (Transactional)

### `submit_attempt_and_update_progress`
* **Description:** The primary method for students to submit answers. It atomically records the attempt AND updates the user's progress (mastery, streaks, points) for that skill. Prevents race conditions using row-level locking.
* **Authorization:** Authenticated User.
* **Parameters:**
    * `attempts_json` (JSONB Array): List of attempt objects.
    * **Schema:**
      ```json
      [
        {
          "id": "uuid",
          "skill_id": "uuid",        // Required for progress aggregation
          "question_id": "uuid",
          "response": "string|json",
          "is_correct": boolean,
          "score_awarded": integer,
          "time_spent_ms": integer,
          "created_at": "ISO-8601 Timestamp" (optional, default: NOW())
        }
      ]
      ```
* **Returns:** `SETOF public.skill_progress` (The updated progress records for the affected skills).
* **Side Effects:**
    * Inserts/Updates `public.attempts`.
    * Calculates streaks (resets on wrong answer).
    * Calculates mastery level (0-100).
    * Updates `public.skill_progress`.

### `batch_submit_attempts`
* **Description:** A simpler batch submission function primarily for offline sync where complex progress calculation might be handled separately or lazily.
* **Authorization:** Authenticated User.
* **Parameters:**
    * `attempts_json` (JSONB Array): Same structure as above, `skill_id` is optional here as it strictly inserts attempts.
* **Returns:** `SETOF public.attempts` (The inserted/updated attempt records).

### `get_user_progress_summary`
* **Description:** Returns a high-level summary of the user's aggregate performance.
* **Authorization:** Authenticated User.
* **Parameters:** None.
* **Returns:** `JSONB`
    * **Schema:**
      ```json
      {
        "totalAttempts": integer,
        "totalCorrect": integer,
        "totalPoints": integer,
        "averageMastery": integer,
        "totalSkillsPractice": integer
      }
      ```

---

## 3. Session Management

### `start_session`
* **Description:** Starts a new learning session.
* **Authorization:** Authenticated User.
* **Parameters:**
    * `session_type` (TEXT, default: 'practice'): e.g., 'practice', 'quiz', 'review'.
* **Returns:** `public.sessions` record.

### `end_session`
* **Description:** Ends an active session, calculating duration.
* **Authorization:** Authenticated User.
* **Parameters:**
    * `session_id` (UUID): The ID of the session to close.
* **Returns:** `public.sessions` record.

---

## 4. Account Management

### `delete_own_account`
* **Description:** Soft-deletes the user's profile and marks all related data (attempts, sessions, progress) as deleted. Anonymizes the email address.
* **Authorization:** Authenticated User.
* **Parameters:** None.
* **Returns:** `void`

### `deactivate_own_account`
* **Description:** Soft-deletes the user's profile but retains data/email linkage for potential reactivation by an admin.
* **Authorization:** Authenticated User.
* **Parameters:** None.
* **Returns:** `void`

---

## rate Limiting Guidelines (Recommended)

While not enforced at the database level, the following client-side and Edge Function rate limits are recommended:

* **Submission RPCs (`submit_attempt...`):**
    * Burst: 5 requests / second
    * Sustained: 20 requests / minute
    * **Rationale:** Prevents abuse of the points system and potential database contention on `skill_progress` locks.
* **Session RPCs:**
    * Strict debounce on `start_session` (e.g., prevent starting multiple sessions within 5 seconds).
