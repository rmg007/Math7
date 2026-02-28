/**
 * @questerix/core — Shared Type Bridge
 *
 * This is the SINGLE SOURCE OF TRUTH for all Supabase-generated types.
 * Both the Admin Panel (React) and the Student App (Flutter/Dart) consume types from here.
 *
 * HOW TO UPDATE:
 *   npm run typegen          (from packages/core/)
 *   OR
 *   npm run typegen          (from the workspace root)
 *
 * This runs: supabase gen types typescript --project-id ... > src/types/database.types.ts
 * The generated file then flows downstream to all consumers automatically.
 */

// ────────────────────────────────────────────────────────────────────────────
// Database Types (Supabase auto-generated)
// ────────────────────────────────────────────────────────────────────────────
export type { Database, Json } from './types/database.types';

// Convenience helpers that mirror @supabase/supabase-js table shape utilities
export type {
    Enums, Tables,
    TablesInsert,
    TablesUpdate
} from './types/database.types';

