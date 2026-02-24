/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
    useCreateLandingPage,
    useLandingPage,
    useLandingPages,
    useUpdateLandingPage,
} from '../use-landings';

// Helper to create a thenable mock chain
const createMockChain = () => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),

    then: vi.fn((onFulfilled: (value: any) => any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    ),
  };
  return chain;
};

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

// ── Shared fixtures ───────────────────────────────────────────────────────────
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440001';
const APP_ID = '550e8400-e29b-41d4-a716-446655440002';

const mockLandings = [
  { landing_page_id: VALID_UUID, app_id: APP_ID, meta_title: 'Landing 1' },
];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient: qc,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useLandingPages', () => {
  const { wrapper } = makeWrapper();

  it('fetches all landing pages', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockLandings, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useLandingPages(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('app_landing_pages');
    expect(result.current.data).toEqual(mockLandings);
  });
});

describe('useLandingPage', () => {
  const { wrapper } = makeWrapper();

  it('fetches a single landing page by app_id', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockLandings[0], error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useLandingPage(APP_ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockChain.eq).toHaveBeenCalledWith('app_id', APP_ID);
    expect(result.current.data).toEqual(mockLandings[0]);
  });

  it('does not fetch if appId is empty', async () => {
    const { result } = renderHook(() => useLandingPage(''), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('useUpdateLandingPage', () => {
  const { wrapper } = makeWrapper();

  it('updates a landing page', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockLandings[0], error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useUpdateLandingPage(), { wrapper });
    await result.current.mutateAsync({ id: VALID_UUID, meta_title: 'Updated Title' });

    expect(mockChain.update).toHaveBeenCalledWith({ meta_title: 'Updated Title' });
    expect(mockChain.eq).toHaveBeenCalledWith('landing_page_id', VALID_UUID);
  });
});

describe('useCreateLandingPage', () => {
  const { wrapper } = makeWrapper();

  it('creates a landing page', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockLandings[0], error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCreateLandingPage(), { wrapper });
    const newLanding = { app_id: APP_ID, meta_title: 'New Landing' };
    await result.current.mutateAsync(newLanding as any);

    expect(mockChain.insert).toHaveBeenCalledWith(newLanding);
  });
});
