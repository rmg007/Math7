import { isValidUUID, normalizeIdentifier, sanitizeHtml } from '@/lib/utils';
import { describe, expect, it } from 'vitest';
import { formatIdentifier } from '../../lib/utils';

// Phase 5: Utility Resilience
describe('Utility Functions - Prevention Guards', () => {
  // Task 5.3: Data casing corruption prevention
  // Task 5.4: normalizeIdentifier handles null/undefined
  it('should normalize identifiers (trim + lowercase + null safe)', () => {
    expect(normalizeIdentifier(' TEST_CODE ')).toBe('test_code');
    expect(normalizeIdentifier('user@EXAMPLE.com')).toBe('user@example.com');
    expect(normalizeIdentifier(' ')).toBe('');
    expect(normalizeIdentifier(null)).toBe('');
    expect(normalizeIdentifier(undefined)).toBe('');
    // Ensure no crash on numeric-like strings (though typed as string)
    expect(normalizeIdentifier('12345')).toBe('12345');
  });

  // Regression check for existing util
  it('should format identifiers correctly', () => {
    expect(formatIdentifier('mcq_multi')).toBe('Multiple Select');
    expect(formatIdentifier('some_random_id')).toBe('Some Random Id');
    expect(formatIdentifier(null)).toBe('');
  });

  describe('sanitizeHtml', () => {
    it('should remove unsafe tags', () => {
      const unsafe = '<script>alert(1)</script><p>Hello</p><img src=x onerror=alert(1)>';
      const sanitized = sanitizeHtml(unsafe);
      expect(sanitized).toBe('<p>Hello</p>');
    });

    it('should preserve allowed tags', () => {
      const safe = '<b>Bold</b> <i>Italic</i> <p>Para</p> <ul><li>Item</li></ul>';
      expect(sanitizeHtml(safe)).toBe(safe);
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as unknown as string)).toBe('');
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(null)).toBe(false);
    });
  });
});
