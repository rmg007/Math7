/**
 * Centralized UI labels for the Admin Panel.
 *
 * Use these instead of hardcoding strings in components.
 * This makes future i18n, copy changes, and consistency audits trivial.
 */

// ── Status Badges ───────────────────────────────────────────────────
export const status = {
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  pending: 'Pending',
  error: 'Error',
  success: 'Success',
} as const;
