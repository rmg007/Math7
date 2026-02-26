import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDomain } from '../use-domains';
import { useQuestion } from '../use-questions';
import { useSkill } from '../use-skills';

// Mock dependencies
vi.mock('@/hooks/use-app');
vi.mock('@/lib/supabase', () => {
  const createMockChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(() => chain),
      maybeSingle: vi.fn(() => chain),
      then: vi.fn((onFulfilled) =>
        Promise.resolve({ data: { id: 'test-id' }, error: null }).then(onFulfilled)
      ),
    };
    return chain;
  };

  const mockFrom = createMockChain();

  return {
    supabase: {
      from: vi.fn(() => mockFrom),
    },
  };
});

describe('Hook Regression: Single Entity Fetch Independence', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // MOCK useApp returning NULL to simulate the "Switching App Context" or "Not Loaded" state
    vi.mocked(useApp).mockReturnValue({
      currentApp: null,
      apps: [],
      isLoading: true,
      setCurrentApp: vi.fn(),
      refreshApps: vi.fn(),
      isSidebarCollapsed: false,
      toggleSidebar: vi.fn(),
      userRole: null,
      isSuperAdmin: false,
    });
  });

  const validId = '550e8400-e29b-41d4-a716-446655440000';

  it('useDomain should fetch data even when currentApp is null', async () => {
    const mockChain = supabase.from('domains') as any;
    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ data: { domain_id: validId }, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useDomain(validId), { wrapper });

    // Should NOT be disabled even though currentApp is null
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(supabase.from).toHaveBeenCalledWith('domains');
  });

  it('useSkill should fetch data even when currentApp is null', async () => {
    const mockChain = supabase.from('skills') as any;
    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ data: { skill_id: validId }, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useSkill(validId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(supabase.from).toHaveBeenCalledWith('skills');
  });

  it('useQuestion should fetch data even when currentApp is null', async () => {
    const mockChain = supabase.from('questions') as any;
    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ data: { question_id: validId }, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useQuestion(validId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(supabase.from).toHaveBeenCalledWith('questions');
  });

  it('hooks should have stable query keys independent of app context', async () => {
    // Render each hook to populate the query cache, then assert stable keys
    const { result: dr } = renderHook(() => useDomain(validId), { wrapper });
    const { result: sr } = renderHook(() => useSkill(validId), { wrapper });
    const { result: qr } = renderHook(() => useQuestion(validId), { wrapper });

    await waitFor(() => expect(dr.current.isSuccess).toBe(true));
    await waitFor(() => expect(sr.current.isSuccess).toBe(true));
    await waitFor(() => expect(qr.current.isSuccess).toBe(true));

    // Check Domain query key
    const domainQuery = queryClient.getQueryCache().find({ queryKey: ['domain', validId] });
    expect(domainQuery).toBeDefined();
    expect(domainQuery?.queryKey).toEqual(['domain', validId]);

    // Check Skill query key
    const skillQuery = queryClient.getQueryCache().find({ queryKey: ['skill', validId] });
    expect(skillQuery).toBeDefined();
    expect(skillQuery?.queryKey).toEqual(['skill', validId]);

    // Check Question query key
    const questionQuery = queryClient.getQueryCache().find({ queryKey: ['question', validId] });
    expect(questionQuery).toBeDefined();
    expect(questionQuery?.queryKey).toEqual(['question', validId]);
  });
});
