/**
 * @feature Auth
 * @description The security perimeter of the Questerix platform.
 * Manages the full authentication lifecycle: login, session verification,
 * role-based route guarding (RBAC), user registration, and account management.
 *
 * ### Component Inventory
 * | Component | Role | Risk Level |
 * | :--- | :--- | :--- |
 * | `AuthGuard` | Route-level session gate | 🔴 CRITICAL |
 * | `SuperAdminGuard` | Super-admin route gate | 🔴 CRITICAL |
 * | `StandardAdminGuard` | Admin/Mentor route gate | 🔴 CRITICAL |
 * | `LoginPage` | Login form + Remember Me | 🟠 HIGH |
 *
 * ### Reference Rules & Guardrails
 *
 * #### 1. AuthGuard - "Remember Me" Eviction Logic
 * - Tab refresh persists via `sessionStorage` 'questerix_session_active'.
 * - Browser closure evicts session UNLESS `localStorage` 'questerix_remember_me' is '1'.
 * - **DO NOT** change the read/write order in `AuthGuard`. Eviction depends on pre-check state.
 *
 * #### 2. SuperAdminGuard
 * - Uses `getUser()` (server-side JWT verification), NOT `getSession()`.
 * - Redirects unauthorized users to `/`, NOT `/login` (to avoid loops).
 *
 * #### 3. Soft-Delete Handling
 * - `AuthGuard` checks `profiles.deleted_at`.
 * - Only confirmed positive `deleted_at` triggers sign-out.
 * - Transient RLS/Network errors MUST NOT evict the user.
 *
 * #### 4. Login Flow
 * - Role-based redirects live in `AppLayout` (via `use-auth`), NOT in `LoginPage`.
 * - LoginPage should only handle submission, errors, and Remember Me preference.
 *
 * @security TRUST BOUNDARY
 */

export * from './components/auth-guard';
export * from './components/standard-admin-guard';
export * from './components/super-admin-guard';
