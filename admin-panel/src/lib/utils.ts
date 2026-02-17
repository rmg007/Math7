import { clsx, type ClassValue } from 'clsx';
import DOMPurify from 'dompurify';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility for merging Tailwind CSS classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes an identifier string (slug, code, email) to be safe for DB storage.
 * Trims whitespace and converts to lowercase.
 * Handles null/undefined gracefully.
 */
export function normalizeIdentifier(text: string | null | undefined): string {
  if (!text) return '';
  // Remove all whitespace if it's an identifier? Or just trim?
  // Identifiers usually shouldn't have spaces inside?
  // Task said "trims + lowercases". ' My ID ' -> 'my id' or 'my_id'?
  // Existing formatIdentifier does capitalization.
  // This one is for storage/comparison.
  return text.trim().toLowerCase();
}

/**
 * Utility functions for formatting raw database strings into human-readable text.
 */
export function formatIdentifier(text: string | null | undefined): string {
  if (!text) return '';

  const customMap: Record<string, string> = {
    mcq_multi: 'Multiple Select',
    mcq_single: 'Multiple Choice',
    text_input: 'Text Input',
    reorder_steps: 'Reorder Steps',
    super_admin: 'Super Admin',
  };

  if (customMap[text.toLowerCase()]) {
    return customMap[text.toLowerCase()];
  }

  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving basic formatting.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      'sub',
      'sup',
      'p',
      'br',
      'span',
      'div',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['class', 'style'],
  }) as string;
}

/**
 * Generic sleep function for UI testing and demos.
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
