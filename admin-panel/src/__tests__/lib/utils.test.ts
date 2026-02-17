import { normalizeIdentifier } from '@/lib/utils';
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
});
