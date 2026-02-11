import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DOMPurify from 'dompurify';

/**
 * Standard utility for merging Tailwind CSS classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility functions for formatting raw database strings into human-readable text.
 */
export function formatIdentifier(text: string | null | undefined): string {
  if (!text) return '';
  
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

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving basic formatting.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'sub', 'sup', 
      'p', 'br', 'span', 'div', 
      'ul', 'ol', 'li',
      'code', 'pre'
    ],
    ALLOWED_ATTR: ['class', 'style']
  }) as string;
}

/**
 * Generic sleep function for UI testing and demos.
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
