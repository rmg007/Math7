import { describe, expect, it } from 'vitest';
import { normalizeFormData, normalizeIdentifier, normalizeString } from '../normalization';

describe('Normalization Utilities', () => {
  describe('normalizeString', () => {
    it('should trim whitespace from both ends', () => {
      expect(normalizeString('  hello world  ')).toBe('hello world');
    });

    it('should return empty string for null or undefined', () => {
      expect(normalizeString(null)).toBe('');
      expect(normalizeString(undefined)).toBe('');
    });
  });

  describe('normalizeIdentifier', () => {
    it('should trim and lowercase the string', () => {
      expect(normalizeIdentifier('  My-Subdomain  ')).toBe('my-subdomain');
    });

    it('should return empty string for null or undefined', () => {
      expect(normalizeIdentifier(null)).toBe('');
      expect(normalizeIdentifier(undefined)).toBe('');
    });
  });

  describe('normalizeFormData', () => {
    it('should apply trim and lowercase to specific fields', () => {
      const data = {
        title: '  A Great Title  ',
        slug: '  A-COOL-SLUG  ',
        other: '  leave me alone  ',
      };

      const normalized = normalizeFormData(data, {
        trim: ['title'],
        lowercase: ['slug'],
      });

      expect(normalized.title).toBe('A Great Title');
      expect(normalized.slug).toBe('a-cool-slug');
      expect(normalized.other).toBe('  leave me alone  ');
    });

    it('should handle missing fields gracefully', () => {
      const data = { title: ' test ' };
      const normalized = normalizeFormData(data, {
        trim: ['title' as keyof typeof data],
        lowercase: ['title' as keyof typeof data],
      });
      expect(normalized.title).toBe('test');
    });
  });
});
