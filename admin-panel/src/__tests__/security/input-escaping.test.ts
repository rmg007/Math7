import { describe, expect, it } from 'vitest';
import { buildIlikeFilter, escapePostgrestSearch } from '../../lib/postgrest-utils';

describe('Input Escaping Security', () => {
  // Task 1.5: SQL wildcard injection prevention
  it('should escape PostgREST wildcard characters (%, _, \\)', () => {
    expect(escapePostgrestSearch('admin%')).toBe('admin\\%');
    expect(escapePostgrestSearch('admin_user')).toBe('admin\\_user');
    expect(escapePostgrestSearch('admin\\test')).toBe('admin\\\\test');
    expect(escapePostgrestSearch('%_\\')).toBe('\\%\\_\\\\');

    // Regression: Normal strings should remain untouched
    expect(escapePostgrestSearch('normal-string')).toBe('normal-string');
    expect(escapePostgrestSearch('')).toBe('');
  });

  // Task 1.6: Search data exfiltration prevention
  it('should build injection-safe ilike filter strings', () => {
    // Normal search case
    expect(buildIlikeFilter('email', 'test@example.com')).toBe('email.ilike.%test@example.com%');

    // Attack Vector: SQL Injection attempt via search field
    // Input: "foo%') OR role = 'admin' --"
    // Expected: Treated as literal string, wildcards escaped
    const injectionPayload = "foo%') OR role = 'admin' --";
    const expected = "email.ilike.%foo\\%') OR role = 'admin' --%";

    expect(buildIlikeFilter('email', injectionPayload)).toBe(expected);
  });
});
