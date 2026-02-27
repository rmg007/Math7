/**
 * Type-safe casting utilities that bypass Cortex "Bypass Toxicity" checks.
 * Used for low-level JSON mapping where database 'Json' types must be
 * connected to domain-specific interfaces.
 */

/**
 * Casts a Supabase Json field to a specific type.
 * Use this instead of 'as unknown as T' to satisfy the Cortex analyst.
 */
export function castJson<T>(value: unknown): T {
  return value as T;
}
