/**
 * Utility functions for formatting raw database strings into human-readable text.
 */

/**
 * Formats a snake_case string into a title-cased string with spaces.
 * Example: 'multiple_choice' -> 'Multiple Choice'
 * Example: 'super_admin' -> 'Super Admin'
 */
export function formatIdentifier(text: string | null | undefined): string {
  if (!text) return '';
  
  // Custom mappings for specific terms that don't follow generic rules
  const customMap: Record<string, string> = {
    'mcq_multi': 'Multiple Select',
    'mcq_single': 'Multiple Choice',
    'text_input': 'Text Input',
    'reorder_steps': 'Reorder Steps',
    'super_admin': 'Super Admin',
  };

  if (customMap[text.toLowerCase()]) {
    return customMap[text.toLowerCase()];
  }

  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
