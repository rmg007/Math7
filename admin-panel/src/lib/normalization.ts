/**
 * Utility functions for normalizing user input throughout the Admin Panel.
 * Ensures data consistency (trimming, casing) before storage.
 */

/**
 * Normalizes a string by trimming whitespace.
 */
export function normalizeString(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim();
}

/**
 * Normalizes a string for use as an identifier (slug, subdomain, etc.)
 * by trimming whitespace and converting to lowercase.
 */
export function normalizeIdentifier(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase();
}

/**
 * Normalizes an object of form data by applying normalization to its fields.
 */
export function normalizeFormData<T extends Record<string, unknown>>(
  data: T,
  config: {
    trim?: (keyof T)[];
    lowercase?: (keyof T)[];
  }
): T {
  const result = { ...data };

  if (config.trim) {
    config.trim.forEach((key) => {
      const val = result[key];
      if (typeof val === 'string') {
        (result as Record<string, unknown>)[key as string] = val.trim();
      }
    });
  }

  if (config.lowercase) {
    config.lowercase.forEach((key) => {
      const val = result[key];
      if (typeof val === 'string') {
        (result as Record<string, unknown>)[key as string] = val.trim().toLowerCase();
      }
    });
  }

  return result;
}
