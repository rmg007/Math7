/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    useApps,
    useBulkCreateApps,
    useBulkDeleteApps,
    useBulkUpdateAppsStatus,
    useCreateApp,
    useDeleteApp,
    useUpdateApp,
} from '../use-apps';

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
const VALID_UUID_2 = '550e8400-e29b-41d4-a716-446655440002';
const INVALID_ID = 'not-a-uuid';

const mockApps = [
  { app_id: VALID_UUID, display_name: 'App 1', subdomain: 'app1', is_active: true },
  { app_id: VALID_UUID_2, display_name: 'App 2', subdomain: 'app2', is_active: true },
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

// ── useApps ───────────────────────────────────────────────────────────────────
describe('useApps', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('fetches apps sorted by display_name', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockApps, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useApps(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('apps');
    expect(result.current.data).toEqual(mockApps);
  });

  it('propagates Supabase error to isError state', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: { message: 'network error' } }).then(onFulfilled)
    );

    const { result } = renderHook(() => useApps(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('network error');
  });
});

// ── useCreateApp ──────────────────────────────────────────────────────────────
describe('useCreateApp', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('inserts a new app and also inserts its landing page', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then
      .mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockApps[0], error: null }).then(onFulfilled)
      )
      .mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

    const { result } = renderHook(() => useCreateApp(), { wrapper });

    const newApp = { display_name: 'New App', subdomain: 'new', grade_level: 'K-12' };
    await result.current.mutateAsync(newApp as any);

    expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining(newApp));
    expect(supabase.from).toHaveBeenCalledWith('app_landing_pages');
  });

  it('still resolves when landing page insert fails (non-fatal)', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then
      .mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockApps[0], error: null }).then(onFulfilled)
      )
      .mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: { message: 'FK violation' } }).then(onFulfilled)
      );

    const { result } = renderHook(() => useCreateApp(), { wrapper });
    const data = await result.current.mutateAsync({ display_name: 'App X', subdomain: 'appx' } as any);

    // Landing page error is swallowed; app data returned
    expect(data).toEqual(mockApps[0]);
  });

  it('throws when Supabase app insert returns error', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: { message: 'unique_violation' } }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCreateApp(), { wrapper });
    await expect(
      result.current.mutateAsync({ display_name: 'Dup', subdomain: 'dup' } as any)
    ).rejects.toMatchObject({ message: 'unique_violation' });
  });

  it('throws "Failed to create app" when insert returns null data', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCreateApp(), { wrapper });
    await expect(
      result.current.mutateAsync({ display_name: 'Ghost', subdomain: 'ghost' } as any)
    ).rejects.toThrow('Failed to create app');
  });
});

// ── useUpdateApp ──────────────────────────────────────────────────────────────
describe('useUpdateApp', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('updates an existing app by app_id', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockApps[0], error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useUpdateApp(), { wrapper });
    await result.current.mutateAsync({ id: VALID_UUID, display_name: 'Updated Name' });

    expect(mockChain.update).toHaveBeenCalledWith({ display_name: 'Updated Name' });
    expect(mockChain.eq).toHaveBeenCalledWith('app_id', VALID_UUID);
  });

  it('throws for invalid UUID format', async () => {
    const { wrapper: w } = makeWrapper();
    const { result } = renderHook(() => useUpdateApp(), { wrapper: w });

    await expect(
      result.current.mutateAsync({ id: INVALID_ID, display_name: 'X' })
    ).rejects.toThrow(`Invalid app ID format: ${INVALID_ID}`);
  });

  it('throws when app is not found (null data, no error)', async () => {
    const { wrapper: w } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useUpdateApp(), { wrapper: w });
    await expect(
      result.current.mutateAsync({ id: VALID_UUID, display_name: 'X' })
    ).rejects.toThrow(`App with ID ${VALID_UUID} not found for update.`);
  });

  it('propagates Supabase error', async () => {
    const { wrapper: w } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: { message: 'rls denied' } }).then(onFulfilled)
    );

    const { result } = renderHook(() => useUpdateApp(), { wrapper: w });
    await expect(
      result.current.mutateAsync({ id: VALID_UUID, display_name: 'X' })
    ).rejects.toMatchObject({ message: 'rls denied' });
  });
});

// ── useDeleteApp ──────────────────────────────────────────────────────────────
describe('useDeleteApp', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('deletes an app by app_id', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useDeleteApp(), { wrapper });
    await result.current.mutateAsync(VALID_UUID);

    expect(supabase.from).toHaveBeenCalledWith('apps');
    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('app_id', VALID_UUID);
  });

  it('throws for non-UUID id', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteApp(), { wrapper });

    await expect(result.current.mutateAsync(INVALID_ID)).rejects.toThrow(
      `Invalid app ID format: ${INVALID_ID}`
    );
  });

  it('propagates Supabase error', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: { message: 'foreign key violation' } }).then(onFulfilled)
    );

    const { result } = renderHook(() => useDeleteApp(), { wrapper });
    await expect(result.current.mutateAsync(VALID_UUID)).rejects.toMatchObject({
      message: 'foreign key violation',
    });
  });
});

// ── useBulkUpdateAppsStatus ───────────────────────────────────────────────────
describe('useBulkUpdateAppsStatus', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sets is_active = true for multiple apps', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useBulkUpdateAppsStatus(), { wrapper });
    await result.current.mutateAsync({ ids: [VALID_UUID, VALID_UUID_2], is_active: true });

    expect(mockChain.update).toHaveBeenCalledWith({ is_active: true });
    expect(mockChain.in).toHaveBeenCalledWith('app_id', [VALID_UUID, VALID_UUID_2]);
  });

  it('sets is_active = false (deactivate)', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useBulkUpdateAppsStatus(), { wrapper });
    await result.current.mutateAsync({ ids: [VALID_UUID], is_active: false });

    expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
  });

  it('propagates error on failure', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: { message: 'rls blocked' } }).then(onFulfilled)
    );

    const { result } = renderHook(() => useBulkUpdateAppsStatus(), { wrapper });
    await expect(
      result.current.mutateAsync({ ids: [VALID_UUID], is_active: false })
    ).rejects.toMatchObject({ message: 'rls blocked' });
  });
});

// ── useBulkDeleteApps ─────────────────────────────────────────────────────────
describe('useBulkDeleteApps', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('deletes multiple apps by app_id list', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useBulkDeleteApps(), { wrapper });
    await result.current.mutateAsync([VALID_UUID, VALID_UUID_2]);

    expect(supabase.from).toHaveBeenCalledWith('apps');
    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.in).toHaveBeenCalledWith('app_id', [VALID_UUID, VALID_UUID_2]);
  });

  it('propagates Supabase error', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: { message: 'cannot delete active app' } }).then(onFulfilled)
    );

    const { result } = renderHook(() => useBulkDeleteApps(), { wrapper });
    await expect(result.current.mutateAsync([VALID_UUID])).rejects.toMatchObject({
      message: 'cannot delete active app',
    });
  });
});

// ── useBulkCreateApps ─────────────────────────────────────────────────────────
describe('useBulkCreateApps', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('inserts multiple apps and creates landing pages for each', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then
      .mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockApps, error: null }).then(onFulfilled)
      )
      .mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

    const { result } = renderHook(() => useBulkCreateApps(), { wrapper });
    const payload = [
      { display_name: 'App 1', subdomain: 'app1' },
      { display_name: 'App 2', subdomain: 'app2' },
    ];
    await result.current.mutateAsync(payload as any);

    // Two insert calls: one for apps, one for landing pages
    expect(mockChain.insert).toHaveBeenCalledTimes(2);
    expect(mockChain.insert).toHaveBeenNthCalledWith(1, payload);
    const lpPayload = (mockChain.insert.mock.calls as any[])[1][0];
    expect(lpPayload).toHaveLength(2);
    expect(lpPayload[0].app_id).toBe(VALID_UUID);
    expect(lpPayload[0].meta_title).toContain('App 1');
    expect(lpPayload[1].app_id).toBe(VALID_UUID_2);
  });

  it('still resolves when landing page bulk insert fails (non-fatal)', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then
      .mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockApps, error: null }).then(onFulfilled)
      )
      .mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: { message: 'lp error' } }).then(onFulfilled)
      );

    const { result } = renderHook(() => useBulkCreateApps(), { wrapper });
    const data = await result.current.mutateAsync([{ display_name: 'A', subdomain: 'a' }] as any);

    expect(data).toEqual(mockApps);
  });

  it('propagates error when app insert fails', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: { message: 'bulk insert failed' } }).then(onFulfilled)
    );

    const { result } = renderHook(() => useBulkCreateApps(), { wrapper });
    await expect(
      result.current.mutateAsync([{ display_name: 'A', subdomain: 'a' }] as any)
    ).rejects.toMatchObject({ message: 'bulk insert failed' });
  });
});
