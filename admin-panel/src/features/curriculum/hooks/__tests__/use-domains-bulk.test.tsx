/**
 * use-domains-bulk.test.tsx
 *
 * Tests: Bulk mutations and domain ordering — completely untested paths
 *  - useBulkDeleteDomains
 *  - useBulkUpdateDomainsStatus
 *  - useUpdateDomainOrder
 *  - useBulkCreateDomains
 *
 * Also covers: useUpdateDomain (single update mutation — also missing from use-domains.test.tsx)
 *
 * Test IDs: AP-CURR-010 .. AP-CURR-017
 */
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBulkCreateDomains,
  useBulkDeleteDomains,
  useBulkUpdateDomainsStatus,
  useUpdateDomain,
  useUpdateDomainOrder,
} from '../use-domains';

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock('@/hooks/use-app');
vi.mock('@/lib/supabase', () => {
  const createMockChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      is: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      single: vi.fn(() => chain),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    return chain;
  };
  const mockFrom = createMockChain();
  return {
    supabase: { from: vi.fn(() => mockFrom) },
  };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
const MOCK_APP_ID = '550e8400-e29b-41d4-a716-446655440000';
const DOMAIN_IDS = ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient: qc,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

function mockApp(overrides: Record<string, unknown> = {}) {
  vi.mocked(useApp).mockReturnValue({
    currentApp: {
      app_id: MOCK_APP_ID,
      created_at: new Date().toISOString(),
      display_name: 'Test App',
      grade_level: 'K-12',
      grade_number: 1,
      is_active: true,
      subdomain: 'test',
      subject_id: 'subject-1',
      updated_at: new Date().toISOString(),
      ai_token_limit: 0,
      branding: {},
      description: '',
    },
    apps: [],
    isLoading: false,
    setCurrentApp: vi.fn(),
    refreshApps: vi.fn(),
    isSidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    userRole: null,
    isSuperAdmin: false,
    ...overrides,
  });
}

function getMockChain(): any {
  return supabase.from('domains');
}

// ── useUpdateDomain (single) ──────────────────────────────────────────────────
describe('useUpdateDomain — AP-CURR-010', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-010: updates domain fields and filters by app_id', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: { domain_id: DOMAIN_IDS[0] }, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useUpdateDomain(), { wrapper });
    await result.current.mutateAsync({
      domain_id: DOMAIN_IDS[0],
      title: 'Updated Domain Title',
      status: 'live',
    });

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated Domain Title', status: 'live' })
    );
    expect(updateChain.eq).toHaveBeenCalledWith('domain_id', DOMAIN_IDS[0]);
    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col]) => col === 'app_id')).toBe(true);
  });
});

// ── useBulkDeleteDomains ──────────────────────────────────────────────────────
describe('useBulkDeleteDomains — AP-CURR-011', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-011: soft-deletes multiple domains with deleted_at timestamp', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useBulkDeleteDomains(), { wrapper });
    await result.current.mutateAsync(DOMAIN_IDS);

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(updateChain.in).toHaveBeenCalledWith('domain_id', DOMAIN_IDS);
    // Tenant scoping: must also filter by app_id
    expect(updateChain.eq).toHaveBeenCalledWith('app_id', MOCK_APP_ID);
  });

  it('AP-CURR-011b: super admin can bulk-delete without app_id filter', async () => {
    mockApp({ isSuperAdmin: true });
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useBulkDeleteDomains(), { wrapper });
    await result.current.mutateAsync(DOMAIN_IDS);

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    // Super admin: app_id filter should NOT be added
    expect(eqCalls.some(([col]) => col === 'app_id')).toBe(false);
  });

  it('AP-CURR-011c: throws when no app and not super admin', async () => {
    mockApp({ currentApp: null, isSuperAdmin: false });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useBulkDeleteDomains(), { wrapper });
    await expect(result.current.mutateAsync(DOMAIN_IDS)).rejects.toThrow('No app selected');
  });
});

// ── useBulkUpdateDomainsStatus ────────────────────────────────────────────────
describe('useBulkUpdateDomainsStatus — AP-CURR-012', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-012: updates status to "published" for multiple domains', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useBulkUpdateDomainsStatus(), { wrapper });
    await result.current.mutateAsync({ ids: DOMAIN_IDS, status: 'published' });

    expect(mockChain.update).toHaveBeenCalledWith({ status: 'published' });
    expect(updateChain.in).toHaveBeenCalledWith('domain_id', DOMAIN_IDS);
  });

  it('AP-CURR-012b: updates status to "draft" for rollback', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useBulkUpdateDomainsStatus(), { wrapper });
    await result.current.mutateAsync({ ids: DOMAIN_IDS, status: 'draft' });

    expect(mockChain.update).toHaveBeenCalledWith({ status: 'draft' });
  });

  it('AP-CURR-012c: scopes to app_id for tenant admin', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useBulkUpdateDomainsStatus(), { wrapper });
    await result.current.mutateAsync({ ids: DOMAIN_IDS, status: 'live' });

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col, val]) => col === 'app_id' && val === MOCK_APP_ID)).toBe(true);
  });
});

// ── useUpdateDomainOrder ──────────────────────────────────────────────────────
describe('useUpdateDomainOrder — AP-CURR-013', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-013: issues one update per domain with correct sort_order', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();

    // Each call to update returns a new chain so we can spy per-domain
    const updateChains: any[] = [];
    mockChain.update.mockImplementation(() => {
      const updateChain = {
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(onFulfilled)
        ),
      };
      updateChains.push(updateChain);
      return updateChain;
    });

    const { result } = renderHook(() => useUpdateDomainOrder(), { wrapper });
    const updates = [
      { domain_id: DOMAIN_IDS[0], sort_order: 1 },
      { domain_id: DOMAIN_IDS[1], sort_order: 2 },
    ];
    await result.current.mutateAsync(updates);

    expect(mockChain.update).toHaveBeenCalledTimes(2);
    expect(mockChain.update).toHaveBeenNthCalledWith(1, { sort_order: 1 });
    expect(mockChain.update).toHaveBeenNthCalledWith(2, { sort_order: 2 });

    // Each domain update must be filtered by domain_id
    expect(updateChains[0].eq).toHaveBeenCalledWith('domain_id', DOMAIN_IDS[0]);
    expect(updateChains[1].eq).toHaveBeenCalledWith('domain_id', DOMAIN_IDS[1]);
  });

  it('AP-CURR-013b: tenant admin update includes app_id filter per domain', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();

    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useUpdateDomainOrder(), { wrapper });
    await result.current.mutateAsync([{ domain_id: DOMAIN_IDS[0], sort_order: 1 }]);

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col, val]) => col === 'app_id' && val === MOCK_APP_ID)).toBe(true);
  });

  it('AP-CURR-013c: throws aggregate error when any update fails', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();

    let callCount = 0;
    mockChain.update.mockImplementation(() => {
      callCount++;
      const err = callCount === 2 ? { message: 'constraint violation' } : null;
      return {
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
          Promise.resolve({ data: null, error: err }).then(onFulfilled)
        ),
      };
    });

    const { result } = renderHook(() => useUpdateDomainOrder(), { wrapper });
    await expect(
      result.current.mutateAsync([
        { domain_id: DOMAIN_IDS[0], sort_order: 1 },
        { domain_id: DOMAIN_IDS[1], sort_order: 2 },
      ])
    ).rejects.toMatchObject({ message: 'constraint violation' });
  });
});

// ── useBulkCreateDomains ──────────────────────────────────────────────────────
describe('useBulkCreateDomains — AP-CURR-014', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-014: inserts multiple domains, each stamped with app_id', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: [
            { domain_id: DOMAIN_IDS[0], title: 'Domain A', app_id: MOCK_APP_ID },
            { domain_id: DOMAIN_IDS[1], title: 'Domain B', app_id: MOCK_APP_ID },
          ],
          error: null,
        }).then(onFulfilled)
      ),
    };
    mockChain.insert.mockReturnValue(insertChain);

    const { result } = renderHook(() => useBulkCreateDomains(), { wrapper });
    const domains = [
      { title: 'Domain A', slug: 'domain-a', sort_order: 1, status: 'draft' },
      { title: 'Domain B', slug: 'domain-b', sort_order: 2, status: 'draft' },
    ];
    await result.current.mutateAsync(domains);

    const [insertPayload] = mockChain.insert.mock.calls[0];
    // Every domain in the batch must be stamped with app_id
    expect(insertPayload).toHaveLength(2);
    insertPayload.forEach((d: any) => {
      expect(d.app_id).toBe(MOCK_APP_ID);
    });
    expect(insertPayload[0].title).toBe('Domain A');
    expect(insertPayload[1].title).toBe('Domain B');
  });

  it('AP-CURR-014b: throws when no app is selected', async () => {
    mockApp({ currentApp: null });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useBulkCreateDomains(), { wrapper });
    await expect(
      result.current.mutateAsync([{ title: 'D', slug: 'd', sort_order: 1 }])
    ).rejects.toThrow('No app selected');
  });

  it('AP-CURR-014c: propagates Supabase error on partial failure', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: null,
          error: { message: 'duplicate key', code: '23505' },
        }).then(onFulfilled)
      ),
    };
    mockChain.insert.mockReturnValue(insertChain);

    const { result } = renderHook(() => useBulkCreateDomains(), { wrapper });
    await expect(
      result.current.mutateAsync([{ title: 'Domain A', slug: 'domain-a', sort_order: 1 }])
    ).rejects.toMatchObject({ message: 'duplicate key' });
  });
});
