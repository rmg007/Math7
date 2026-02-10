import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving basic formatting.
 * This is essential for rendering user-generated or AI-generated HTML content safely.
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
