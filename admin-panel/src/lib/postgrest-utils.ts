/**
 * Escapes special characters in PostgREST ilike searches
 * PostgREST uses SQL LIKE patterns where:
 * - % matches any sequence of characters
 * - _ matches any single character
 * - \ is the escape character
 */
export function escapePostgrestSearch(input: string): string {
  if (!input) return '';
  
  // Escape %, _, and \ by prefixing with backslash
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Builds a safe ilike filter for PostgREST searches
 */
export function buildIlikeFilter(column: string, search: string): string {
  const escaped = escapePostgrestSearch(search);
  return `${column}.ilike.%${escaped}%`;
}
