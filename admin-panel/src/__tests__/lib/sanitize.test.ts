import { sanitizeHtml } from '@/lib/sanitize';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn(),
  },
}));

import DOMPurify from 'dompurify';

describe('sanitize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeHtml', () => {
    it('should call DOMPurify.sanitize with correct options', () => {
      const mockHtml = '<p>Test content</p>';
      const expectedSanitized = '<p>Test content</p>';

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(mockHtml);

      expect(DOMPurify.sanitize).toHaveBeenCalledWith(mockHtml, {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'code', 'pre'
        ],
      });
      expect(result).toBe(expectedSanitized);
    });

    it('should return empty string for null input', () => {
      const result = sanitizeHtml(null);
      expect(result).toBe('');
      expect(DOMPurify.sanitize).not.toHaveBeenCalled();
    });

    it('should return empty string for undefined input', () => {
      const result = sanitizeHtml(undefined);
      expect(result).toBe('');
      expect(DOMPurify.sanitize).not.toHaveBeenCalled();
    });

    it('should return empty string for empty string input', () => {
      vi.mocked(DOMPurify.sanitize).mockReturnValue('');
      const result = sanitizeHtml('');
      expect(result).toBe('');
      expect(DOMPurify.sanitize).toHaveBeenCalledWith('', {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'code', 'pre'
        ],
      });
    });

    it('should handle string input with whitespace', () => {
      const mockHtml = '   <p>Test</p>   ';
      const expectedSanitized = '<p>Test</p>';

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(mockHtml);

      expect(result).toBe(expectedSanitized);
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(mockHtml, expect.any(Object));
    });

    it('should pass through DOMPurify sanitized content', () => {
      const dangerousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const expectedSanitized = '<p>Safe content</p>';

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(dangerousHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle complex HTML structures', () => {
      const complexHtml = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> and <em>italic</em> text</p>';
      const expectedSanitized = complexHtml; // Assuming all tags are allowed

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(complexHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle HTML with line breaks', () => {
      const htmlWithBreaks = '<p>Line 1<br>Line 2</p>';
      const expectedSanitized = htmlWithBreaks;

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(htmlWithBreaks);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle HTML with lists', () => {
      const listHtml = '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>Ordered 1</li></ol>';
      const expectedSanitized = listHtml;

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(listHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle HTML with code blocks', () => {
      const codeHtml = '<pre><code>const x = 1;</code></pre><p>Inline <code>code</code></p>';
      const expectedSanitized = codeHtml;

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(codeHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle HTML with blockquotes', () => {
      const quoteHtml = '<blockquote>This is a quote</blockquote><p>Regular text</p>';
      const expectedSanitized = quoteHtml;

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(quoteHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle underlined text', () => {
      const underlineHtml = '<p>Text with <u>underline</u></p>';
      const expectedSanitized = underlineHtml;

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(underlineHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle all heading levels', () => {
      const headingsHtml = '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><h5>Heading 5</h5><h6>Heading 6</h6>';
      const expectedSanitized = headingsHtml;

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(headingsHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should strip disallowed tags', () => {
      const htmlWithDisallowed = '<p>Safe</p><script>alert("xss")</script><div>Not allowed</div>';
      const expectedSanitized = '<p>Safe</p>alert("xss")Not allowed';

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(htmlWithDisallowed);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle very long HTML strings', () => {
      const longHtml = '<p>' + 'A'.repeat(10000) + '</p>';
      const expectedSanitized = longHtml;

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(longHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle HTML with special characters', () => {
      const specialHtml = '<p>Special chars: &lt;&gt;&amp;"\'</p>';
      const expectedSanitized = '<p>Special chars: &lt;&gt;&amp;"\'</p>';

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(specialHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle malformed HTML', () => {
      const malformedHtml = '<p>Unclosed paragraph<div>Nested div</p>';
      const expectedSanitized = '<p>Unclosed paragraph<div>Nested div</div></p>';

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(malformedHtml);

      expect(result).toBe(expectedSanitized);
    });

    it('should handle empty tags', () => {
      const emptyTagsHtml = '<p></p><div></div><span></span>';
      const expectedSanitized = '<p></p>';

      vi.mocked(DOMPurify.sanitize).mockReturnValue(expectedSanitized as any);

      const result = sanitizeHtml(emptyTagsHtml);

      expect(result).toBe(expectedSanitized);
    });
  });
});
