import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useKnownIssues } from '@/features/monitoring/hooks/use-known-issues';

describe('useKnownIssues', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useKnownIssues());
    expect(result.current).toBeDefined();
  });
});
