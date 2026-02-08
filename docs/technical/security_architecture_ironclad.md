# Operation Ironclad: Security Architecture

> **Status**: Implemented (Phase 10)
> **Date**: February 4, 2026

## Overview

Operation Ironclad was a comprehensive security initiative designed to harden the Questerix platform against data tampering, unauthorized access, and cross-tenant leakage. It introduced a 3-tier security model enforced at the Database, Logic, and Client layers.

## Tier 1: The Bedrock (Database Hardening)

The database layer serves as the ultimate source of truth and enforcement.

### 1. Multi-Tenant Scoping (`app_id`)
To support the "Dynamic Singleton" architecture where multiple apps (Math7, PhysicsPhun, etc.) share a single database, we introduced explicit scoping.

*   **Profiles**: Added `app_id`. Users belong to a specific app.
*   **Attempts**: Added `app_id`. Data is siloed per app.
*   **Trigger**: `handle_new_user` now automatically extracts `app_id` from the Auth Metadata (sent by client during `signUp` or `signInAnonymously`) and stamps it on the profile.

### 2. Recursive RLS Policies
Row-Level Security (RLS) policies were rewritten to be recursive and strict.

*   **Attempts Policy**:
    ```sql
    CREATE POLICY "Students can insert own attempts" ON public.attempts
    FOR INSERT WITH CHECK (
      auth.uid() = user_id AND
      (
         -- If profile has app_id, attempt must match it
         (SELECT app_id FROM public.profiles WHERE id = auth.uid()) IS NULL
         OR
         app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid())
      )
    );
    ```
    This prevents a user from one app inserting data into another app's scope, even if they have a valid token.

### 3. Curriculum Isolation
*   **Domains**: Added `subject_id`. Domains now belong to specific subjects, allowing cleaner filtering and preventing content bleed between subjects.

## Tier 2: The Gatekeeper (Server-Side Logic)

Complex state transitions that require privilege elevation or atomic guarantees are handled via "Gatekeeper RPCs" (`SECURITY DEFINER` functions).

### 1. Secure Identity Recovery (`recover_student_identity`)
*   **Problem**: Anonymous students losing devices need to recover their progress.
*   **Solution**: A hashed recovery key system.
*   **Mechanism**:
    1.  User generates a recovery phrase (client side).
    2.  Hash (Argon2) is stored in `student_recovery_keys` via RPC (future expansion).
    3.  To recover, user calls `recover_student_identity(phrase)`.
    4.  RPC verifies hash, ensures key is unused/unexpired.
    5.  RPC performs "Identity Reparenting": updates `user_id` on all `attempts`, `sessions`, and `skill_progress` to the new user.
    6.  Old user data is logically merged into the new session.

### 2. Group Join Workflow (`join_group_via_code`)
*   **Problem**: Public join codes allow strangers to enter private classrooms.
*   **Solution**: An approval-gated join flow.
*   **Mechanism**:
    1.  RPC checks if group `requires_approval`.
    2.  If `FALSE`: Adds member immediately.
    3.  If `TRUE`: Creates a `group_join_requests` row (Pending status).
    4.  Mentor approves request -> Trigger/RPC promotes to `group_members`.

### 3. Cheat-Proof Mastery (`calculate_mastery_on_attempt`)
*   **Mechanism**: A database trigger on `attempts` that recalculates `skill_progress` automatically.
*   **Benefit**: Clients cannot tamper with their mastery level directly. They can only submit atomic attempts. The server decides the progress.

## Tier 3: The Client Enforcer (Student App)

The Flutter application was hardened to prevent local tampering and ensure context awareness.

### 1. HMAC Data Integrity (`AppSignatureService`)
*   **Threat**: Smart students editing the local SQLite database to fake high scores before syncing.
*   **Solution**: HMAC-SHA256 signing of critical columns (`question_id`, `response`, `is_correct`, `timestamp`).
*   **Implementation**:
    *   `flutter_secure_storage` holds a randomized, device-specific `ironclad_hmac_secret`.
    *   On attempt submission, `AppSignatureService.signAttempt()` generates a signature.
    *   This signature is stored in `attempts.localSignature`.
    *   On load/sync, the app can verify if the row was tampered with by external tools (DB Browser for SQLite).

### 2. Context Injection (`AppConfigService`)
*   **Service**: Detects current generic subdomain (e.g., `math7.questerix.com` -> `math7`) or flavor.
*   **Boot**: Fetches configuration (`app_id`, `theme`) from `app_landing_pages`.
*   **Auth**: Injects this `app_id` into the `Ref` context for `SessionRepository`.
*   **Result**: All anonymous sign-ins are strictly scoped to the correct tenant from the moment of creation.

---

## Artifact Inventory

### Migrations
*   `20260204000001_operation_ironclad.sql` (Tables & Columns)
*   `20260204000002_ironclad_rpcs.sql` (Functions)
*   `20260204000003_trigger_update.sql` (Auth Trigger)
*   `20260204000004_fix_domains_schema.sql` (Subject ID)

### Code Modules
*   **Flutter**: `lib/features/security/app_signature_service.dart`
*   **Flutter**: `lib/core/config/app_config_service.dart`

