# FEATURE_GUIDE.md — Auth Feature

> **Purpose of this file**: Explains the _why_, not just the _what_. Before touching any file in `features/auth/`, read this guide. It will prevent the most common agent-introduced regressions.

---

## Overview

The `auth` feature manages the full authentication lifecycle: login, session verification, role-based route guarding, user registration (invite codes), and account management.

**Critical constraint**: This feature is the security perimeter of the entire application. Every component here is a trust boundary. Changes must be treated with maximum caution.

---

## Component Inventory

| File                                  | Role                     | Risk Level  |
| :------------------------------------ | :----------------------- | :---------- |
| `components/auth-guard.tsx`           | Route-level session gate | 🔴 CRITICAL |
| `components/super-admin-guard.tsx`    | Super-admin route gate   | 🔴 CRITICAL |
| `components/standard-admin-guard.tsx` | Admin/Mentor route gate  | 🔴 CRITICAL |
| `pages/LoginPage.tsx`                 | Login form + Remember Me | 🟠 HIGH     |
| `pages/AuthConfirmPage.tsx`           | Email magic-link landing | 🟠 HIGH     |
| `pages/InvitationCodesPage.tsx`       | Invite code management   | 🟡 MEDIUM   |
| `pages/UserManagementPage.tsx`        | User admin table         | 🟡 MEDIUM   |
| `pages/AccountSettingsPage.tsx`       | Current user settings    | 🟢 LOW      |

---

## AuthGuard — The Front Door

**Intent**: Verify that every protected route has a valid, non-evicted session before rendering. Also handles the "Remember Me" eviction pattern.

### The "Remember Me" Eviction Logic

This is the most non-obvious piece of code in the entire codebase. Read carefully before touching it.

```
Browser closed (sessionStorage cleared) + no "Remember Me" flag
    → Evict session → redirect to /login
Browser closed (sessionStorage cleared) + "Remember Me" = true
    → Session survives
Tab refresh / navigation
    → sessionStorage persists → session survives
```

**Implementation keys**:

- `localStorage.getItem('questerix_remember_me')` — "Remember Me" preference (persists across browser closes)
- `sessionStorage.getItem('questerix_session_active')` — "Tab is alive" flag (cleared when browser closes)
- `sessionStorage.setItem('questerix_session_active', '1')` is set **after** reading `wasSessionActive` on every guard check

**Guardrail**: Do NOT change the order of the `const rememberMe` / `const wasSessionActive` reads relative to the `setItem` call. The eviction decision depends on the **pre-check** state. Setting `session_active` before reading `wasSessionActive` would permanently break session eviction.

### Deleted User Handling

After session validation, `AuthGuard` checks `profiles.deleted_at` to block soft-deleted users.

**Guardrail**: On `profileError`, the guard **intentionally does NOT log the user out**. A network error or transient RLS issue should not evict a valid user. Only a confirmed `deleted_at !== null` triggers a forced sign-out.

### Auth State Listener

`onAuthStateChange` is subscribed once on mount and unsubscribed on unmount. This catches:

- External JWT expiry signaled by Supabase
- `signOut()` called from other tabs (via Supabase Realtime)

**Guardrail**: The listener is returned for cleanup — do NOT remove the `return () => subscription.unsubscribe()`. Without it, navigating between routes will leak listeners, causing duplicate redirect firing.

---

## SuperAdminGuard — Elevated Authority

**Intent**: Only `role === 'super_admin'` profiles can access Super-Admin routes. All other roles are redirected to `/` (not to `/login`).

**Why redirect to `/` not `/login`**: The user is authenticated but unauthorized. Sending authenticated users to `/login` would cause a confusing redirect loop. The home dashboard (`/`) is the correct landing for un-authorized authenticated users.

**Guardrail**: Uses `getUser()` (verifies JWT with server), not `getSession()` (reads cached client session). This is intentional — super-admin checks require server-side verification.

---

## Login Flow

### JWT Lifecycle

1. User submits email + password → Supabase Auth API
2. JWT returned → stored in `localStorage` (with Remember Me) or `sessionStorage` (without)
3. `AuthGuard` reads session via `supabase.auth.getSession()`
4. On token refresh, Supabase SDK handles it silently

### RBAC Redirect After Login

After successful login, the app navigates to `/` where the `AppLayout` component reads the user's `role` from `profiles` and routes accordingly:

- `super_admin` → Platform Management
- `admin` → Dashboard
- `mentor` → Mentor Hub

**Guardrail**: Do NOT add role-based redirects inside `LoginPage.tsx`. Keep login concerns (credential submission, error display, Remember Me) separate from routing concerns (which live in `AppLayout`).

---

## Known Edge Cases & Gotchas

### 1. Multi-tab Behavior

If a user opens two tabs and logs out from one, the other tab detects the sign-out via `onAuthStateChange` and redirects. This is correct behavior — do NOT debounce or suppress it.

### 2. Token Expiry During Long Sessions

Supabase silently refreshes tokens. If a refresh fails (network issue), the next route navigation will trigger `AuthGuard` → `getSession()` returns null → redirect to login. This is the correct degraded-state behavior.

### 3. E2E Test Accounts

Playwright tests use `storageState` snapshots pre-seeded in `.auth/`. These bypass the login flow entirely. Any auth state changes **must** be reflected by regenerating auth snapshots (`npx playwright test global-setup.ts --headed`).

---

## RBAC Guardrails Quick Reference

| Role            | Can access                                                             |
| :-------------- | :--------------------------------------------------------------------- |
| `super_admin`   | Everything (SuperAdminGuard + AuthGuard)                               |
| `admin`         | Dashboard, Curriculum, Platform views (AuthGuard + StandardAdminGuard) |
| `mentor`        | Mentor Hub only (AuthGuard)                                            |
| Unauthenticated | `/login` only                                                          |

---

## What NOT to Do

- ❌ Do NOT add `console.log` with session tokens (security risk)
- ❌ Do NOT change `getUser()` to `getSession()` in `SuperAdminGuard` (weakens security)
- ❌ Do NOT remove the `deleted_at` profile check (allows soft-deleted users back in)
- ❌ Do NOT move the Remember Me `setItem` before the `getItem` reads (breaks eviction logic)
- ❌ Do NOT add role redirects in `LoginPage.tsx` (creates architectural coupling)
