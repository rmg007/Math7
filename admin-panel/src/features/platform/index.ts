/**
 * @feature Platform
 * @description The multi-tenancy control plane of Questerix.
 * Manages the core entities defining tenant identity and curriculum structure:
 * `apps` (tenants), `subjects` (global curriculum branches), and `app_landing_pages`.
 *
 * ### Component Inventory
 * | File | Role | Risk Level |
 * | :--- | :--- | :--- |
 * | `use-apps.ts` | App CRUD + subdomain validation | 🔴 CRITICAL |
 * | `use-subjects.ts` | Subject CRUD + slug validation | 🟠 HIGH |
 * | `use-landings.ts` | Landing page content management | 🟡 MEDIUM |
 * | `AppsPage` | Admin UI for tenant management | 🟠 HIGH |
 *
 * ### Reference Rules & Guardrails
 *
 * #### 1. Dynamic Singleton Multi-Tenancy
 * - Every row is scoped to a tenant via `app_id` (UUID).
 * - `app_id` is IMMUTABLE after creation.
 * - **Subjects** are GLOBAL (shared across tenants). Do NOT add `app_id` to the `subjects` table.
 *
 * #### 2. Cache Invalidation Patterns
 * - `use-apps.ts` MUST invalidate BOTH `['apps-admin']` and `['apps']` (AppContext).
 * - Missing the `['apps']` invalidation causes stale tenant data bugs in the app shell.
 *
 * #### 3. App Creation Side-Effects
 * - `useCreateApp` automatically creates a landing page stub in `app_landing_pages`.
 * - **DO NOT** remove this side-effect; it is required for student app routing to function.
 *
 * #### 4. Uniqueness Checks
 * - `subdomain` and `slug` checks use `.neq('id', current_id)` when editing to prevent self-conflict.
 * - Checks fail-open (return `true`) on DB error to avoid blocking UI; DB constraints handle hard collisions.
 *
 * #### 5. Subject Lifecycle (status)
 * - Transitions: `draft` -> `published` -> `live`.
 * - E2E lifecycle tests MUST start with `status: 'draft'`.
 *
 * @security Multi-Tenancy Boundary
 */

export * from './hooks/use-apps';
export * from './hooks/use-landings';
export * from './hooks/use-subjects';
