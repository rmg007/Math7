# Schema Migration Gap Audit (2026-02-13)

## Overview

During the reconciliation of the UUID bug and type regeneration, a significant gap was identified between the current Supabase database schema and the application's source code requirements. These gaps likely originated during the project recreation in February 2026.

## Status: CRITICAL

The production build currently requires a `tsc` bypass (`npx vite build`) to deploy. This hides runtime errors that will occur if users access specific features.

---

## 1. Missing RPC Functions

The following functions are referenced in the code but do not exist in the database:

| Function Name                | Location                  | Impact                        |
| ---------------------------- | ------------------------- | ----------------------------- |
| `deactivate_own_account`     | `AccountSettingsPage.tsx` | Account deletion fails        |
| `delete_own_account`         | `AccountSettingsPage.tsx` | Account deletion fails        |
| `generate_invitation_code`   | `InvitationCodesPage.tsx` | Admin cannot create codes     |
| `deactivate_invitation_code` | `InvitationCodesPage.tsx` | Admin cannot deactivate codes |
| `validate_invitation_code`   | `LoginPage.tsx`           | New user registration fails   |
| `promote_error_to_issue`     | `use-error-logs.ts`       | Observability workflow broken |
| `import_questions_bulk`      | `CurriculumService.ts`    | Bulk question import fails    |

## 2. Missing Tables / Relations

| Table Name          | Location          | Impact                         |
| ------------------- | ----------------- | ------------------------------ |
| `app_landing_pages` | `use-landings.ts` | Landing page management broken |

## 3. Schema Property Mismatches

| Code Expects           | DB Has            | Location                                     |
| ---------------------- | ----------------- | -------------------------------------------- |
| `grade_level`          | `grade_number`    | `AppsPage.tsx`                               |
| `allow_anonymous_join` | `allow_anonymous` | `GroupCreatePage.tsx`, `GroupDetailPage.tsx` |
| `color_hex`            | _(Missing)_       | `SubjectsPage.tsx`                           |
| `icon_url`             | _(Missing)_       | `SubjectsPage.tsx`                           |
| `nickname`             | _(Missing)_       | `GroupDetailPage.tsx` (on `group_members`)   |

## 4. Possible Dead Code / Dropped Features

The following features are broken and should be evaluated for removal if they are no longer part of the product:

- **Landing Page Management**: References to `app_landing_pages` should be removed if the landing pages project was officially deleted.
- **Bulk Question Import**: If this was a prototype function, the code should be cleaned up.

---

## Recommendation

1. **Migrate Missing Functions**: Create migrations for the missing RPCs listed above.
2. **Reconcile Column Names**: Decide whether to rename columns in DB or update code. Code updates are safer for existing data.
3. **Restore TSC Gate**: Once the above are fixed, the `npm run build` command must include `tsc` again.
