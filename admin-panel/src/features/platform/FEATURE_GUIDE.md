# FEATURE_GUIDE.md — Platform Feature

> **Purpose of this file**: Explains the _why_, not just the _what_. Before touching any file in `features/platform/`, read this guide. It will prevent the most common agent-introduced regressions.

---

## Overview

The `platform` feature is the **multi-tenancy control plane**. It manages the core entities that define each tenant's identity and curriculum structure: `apps` (tenants), `subjects` (curriculum branches), and `app_landing_pages` (public-facing marketing pages).

**Critical constraint**: Data written here flows directly into the student-facing app via the `AppContext`. Bugs in this feature can silently corrupt a tenant's entire learning environment.

---

## Component Inventory

| File                     | Role                             | Risk Level  |
| :----------------------- | :------------------------------- | :---------- |
| `hooks/use-apps.ts`      | App CRUD + subdomain validation  | 🔴 CRITICAL |
| `hooks/use-subjects.ts`  | Subject CRUD + slug validation   | 🟠 HIGH     |
| `hooks/use-landings.ts`  | Landing page content management  | 🟡 MEDIUM   |
| `pages/AppsPage.tsx`     | Admin UI for tenant management   | 🟠 HIGH     |
| `pages/SubjectsPage.tsx` | Admin UI for curriculum subjects | 🟠 HIGH     |
| `pages/LandingsPage.tsx` | Admin UI for landing page editor | 🟡 MEDIUM   |

---

## The Multi-Tenancy Model

Questerix uses a **Dynamic Singleton** pattern. There is one shared database, but each row is scoped to a tenant via `app_id`.

### The `apps` table is the root authority

Every `app` row represents one tenant. The key fields are:

| Field          | Purpose                                                                  |
| :------------- | :----------------------------------------------------------------------- |
| `app_id`       | UUID primary key — the tenant identifier used across every related table |
| `subdomain`    | Used for DNS routing — must be globally unique (enforced in DB + UI)     |
| `is_active`    | Controls whether the tenant's student app responds to requests           |
| `display_name` | Human-readable tenant name                                               |

**Guardrail**: `app_id` is **never null and never changes** after creation. If you see any code that attempts to mutate `app_id`, that is a critical bug.

### Subjects are global (not scoped to a tenant)

`subjects` are curriculum branches (e.g., "Mathematics", "Science"). They are **NOT scoped to a tenant** — they are shared across all apps. An app-to-subject relationship is created separately in the `app_subjects` join table.

**Guardrail**: Do NOT add an `app_id` column to the `subjects` table. Subjects are intentionally global to allow tenant reuse.

---

## Cache Architecture — The Dual Invalidation Pattern

The `apps` hook maintains **two separate React Query caches** that must stay in sync:

| Query Key        | Consumer       | Purpose                                    |
| :--------------- | :------------- | :----------------------------------------- |
| `['apps-admin']` | `AppsPage.tsx` | Admin management table                     |
| `['apps']`       | `AppContext`   | Tenant resolution for the entire app shell |

**Every mutation in `use-apps.ts` MUST invalidate both keys.** Missing either invalidation causes a stale-data split-brain condition:

```typescript
// Correct pattern — always both
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
  queryClient.invalidateQueries({ queryKey: ['apps'] }); // AppContext
};
```

**Guardrail**: If you add a new mutation to `use-apps.ts`, it MUST invalidate both `apps-admin` AND `apps`. Missing the `['apps']` invalidation is the #1 source of stale tenant data bugs.

---

## App Creation — The Landing Page Side-Effect

When an app is created, `useCreateApp` **automatically creates a landing page stub** in `app_landing_pages`. This side-effect is:

1. **Not atomic** — if the landing page creation fails, the app remains created (no rollback)
2. **Non-blocking** — errors are logged but do not throw
3. **Intentional** — every app must have a landing page record to function correctly in the student app routing

**Guardrail**: Do NOT remove the landing page auto-creation from `useCreateApp`. Without it, newly created apps will fail to render their public landing page (the student app will get a 404 on the landing page route).

---

## Subdomain Uniqueness

`useCheckAppSubdomain` provides a live uniqueness check for the subdomain field during form editing. It queries Supabase and returns `true` (available) if no conflict exists.

**Key behavior**: On database error, it returns `true` (available) to avoid blocking form submission. This is a deliberate UX tradeoff — the DB constraint will catch any actual collision at save time.

**Guardrail**: The check uses `.neq('app_id', app_id)` when editing an existing app so the current app's own subdomain doesn't conflict with itself. Do NOT remove this exclusion.

---

## Subject Lifecycle

Subjects have a `status` field with three states:

```
draft → published → live
```

| State       | Meaning                                            |
| :---------- | :------------------------------------------------- |
| `draft`     | Visible only to admins. Not available to students. |
| `published` | Content is complete. Awaiting go-live approval.    |
| `live`      | Active in the student app.                         |

**Guardrail**: E2E tests that test the publish lifecycle (e.g., `curriculum-lifecycle.e2e.spec.ts`) MUST start with `status: 'draft'`. Creating subjects as `live` bypasses the transition logic and causes those tests to fail.

### Slug Uniqueness

`useCheckSubjectSlug` works identically to `useCheckAppSubdomain` — live uniqueness check with fail-open on error, excluding the current subject_id when editing.

---

## `AppsPage.tsx` and `SubjectsPage.tsx` — Size Warning

These pages are **~50KB each** (the two largest files in the codebase). They contain:

- Inline dialog components (create / edit / delete confirmation)
- Bulk selection logic
- Column definitions for data tables
- Form validation schemas (Zod)

**Guardrail**: Do NOT extract inline subcomponents into separate files without updating all test selectors that reference `data-testid` attributes. The Playwright tests are tightly coupled to the `data-testid` attribute values in these pages.

---

## What NOT to Do

- ❌ Do NOT scope `subjects` to a single `app_id` (they are intentionally global)
- ❌ Do NOT add mutations to `use-apps.ts` without invalidating BOTH `['apps-admin']` AND `['apps']`
- ❌ Do NOT remove the landing page auto-creation from `useCreateApp`
- ❌ Do NOT change `app_id` after creation — it is an immutable tenant identifier
- ❌ Do NOT remove the `.neq()` exclusion from subdomain/slug uniqueness checks
- ❌ Do NOT rename `data-testid` attributes in pages without updating E2E selectors
