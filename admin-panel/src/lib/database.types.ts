/**
 * database.types.ts — Backwards-compatible re-export shim
 *
 * The canonical source of truth for Supabase database types has moved to:
 *   packages/core/src/types/database.types.ts
 *
 * This file remains as a shim so all existing imports in the admin-panel
 * (`import { Database } from '@/lib/database.types'`) continue to work
 * without any changes.
 *
 * For NEW code, prefer the canonical import:
 *   import type { Database, Tables } from '@questerix/core';
 *
 * To regenerate types after a schema change:
 *   npm run typegen          (from workspace root)
 */

// Re-export everything from the canonical package location.
export type { Database, Enums, Json, Tables, TablesInsert, TablesUpdate } from '@questerix/core';

