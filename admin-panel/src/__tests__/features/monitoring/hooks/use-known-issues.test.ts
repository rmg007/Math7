import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useKnownIssues } from '@/admin-panel/src/features/monitoring/hooks/use-known-issues';

describe('useKnownIssues', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useKnownIssues());
    expect(result.current).toBeDefined();
  });

});
