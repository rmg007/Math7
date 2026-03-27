/**
 * use-skills-bulk.test.tsx
 *
 * Tests: Bulk skill mutations — untested paths
 *  - useBulkDeleteSkills
 *  - useBulkUpdateSkillsStatus
 *  - useBulkCreateSkills
 *
 * Test IDs: AP-CURR-060 .. AP-CURR-068
 */
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBulkCreateSkills,
  useBulkDeleteSkills,
  useBulkUpdateSkillsStatus,
} from '../use-skills-bulk';

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
const SKILL_IDS = ['550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012'];

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
      features: {},
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
  return supabase.from('skills');
}

// ── useBulkDeleteSkills ───────────────────────────────────────────────────────
describe('useBulkDeleteSkills — AP-CURR-060', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-060: soft-deletes multiple skills with deleted_at and app_id filter', async () => {
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

    const { result } = renderHook(() => useBulkDeleteSkills(), { wrapper });
    await result.current.mutateAsync(SKILL_IDS);

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(updateChain.in).toHaveBeenCalledWith('skill_id', SKILL_IDS);
    expect(updateChain.eq).toHaveBeenCalledWith('app_id', MOCK_APP_ID);
  });

  it('AP-CURR-061: super admin bypasses app_id filter', async () => {
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

    const { result } = renderHook(() => useBulkDeleteSkills(), { wrapper });
    await result.current.mutateAsync(SKILL_IDS);

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col]) => col === 'app_id')).toBe(false);
  });

  it('AP-CURR-062: throws when no app and not super admin', async () => {
    mockApp({ currentApp: null, isSuperAdmin: false });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useBulkDeleteSkills(), { wrapper });
    await expect(result.current.mutateAsync(SKILL_IDS)).rejects.toThrow('No app selected');
  });
});

// ── useBulkUpdateSkillsStatus ─────────────────────────────────────────────────
describe('useBulkUpdateSkillsStatus — AP-CURR-063', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-063: updates status for multiple skills', async () => {
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

    const { result } = renderHook(() => useBulkUpdateSkillsStatus(), { wrapper });
    await result.current.mutateAsync({ skill_ids: SKILL_IDS, status: 'published' });

    expect(mockChain.update).toHaveBeenCalledWith({ status: 'published' });
    expect(updateChain.in).toHaveBeenCalledWith('skill_id', SKILL_IDS);
  });

  it('AP-CURR-064: scopes to app_id for tenant admin', async () => {
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

    const { result } = renderHook(() => useBulkUpdateSkillsStatus(), { wrapper });
    await result.current.mutateAsync({ skill_ids: SKILL_IDS, status: 'live' });

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col, val]) => col === 'app_id' && val === MOCK_APP_ID)).toBe(true);
  });

  it('AP-CURR-065: super admin bypasses app_id filter', async () => {
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

    const { result } = renderHook(() => useBulkUpdateSkillsStatus(), { wrapper });
    await result.current.mutateAsync({ skill_ids: SKILL_IDS, status: 'published' });

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col]) => col === 'app_id')).toBe(false);
  });

  it('AP-CURR-065b: throws when no app and not super admin', async () => {
    mockApp({ currentApp: null, isSuperAdmin: false });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useBulkUpdateSkillsStatus(), { wrapper });
    await expect(
      result.current.mutateAsync({ skill_ids: SKILL_IDS, status: 'draft' })
    ).rejects.toThrow('No app selected');
  });
});

// ── useBulkCreateSkills ───────────────────────────────────────────────────────
describe('useBulkCreateSkills — AP-CURR-066', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-066: inserts multiple skills each stamped with app_id', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: [
            { skill_id: SKILL_IDS[0], title: 'Skill A', app_id: MOCK_APP_ID },
            { skill_id: SKILL_IDS[1], title: 'Skill B', app_id: MOCK_APP_ID },
          ],
          error: null,
        }).then(onFulfilled)
      ),
    };
    mockChain.insert.mockReturnValue(insertChain);

    const { result } = renderHook(() => useBulkCreateSkills(), { wrapper });
    const skills = [
      { title: 'Skill A', slug: 'skill-a', sort_order: 1, status: 'draft' },
      { title: 'Skill B', slug: 'skill-b', sort_order: 2, status: 'draft' },
    ];
    await result.current.mutateAsync(skills);

    const [insertPayload] = mockChain.insert.mock.calls[0];
    expect(insertPayload).toHaveLength(2);
    insertPayload.forEach((s: any) => {
      expect(s.app_id).toBe(MOCK_APP_ID);
    });
    expect(insertPayload[0].title).toBe('Skill A');
    expect(insertPayload[1].title).toBe('Skill B');
  });

  it('AP-CURR-067: throws when no app is selected', async () => {
    mockApp({ currentApp: null });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useBulkCreateSkills(), { wrapper });
    await expect(
      result.current.mutateAsync([{ title: 'S', slug: 's', sort_order: 1 }])
    ).rejects.toThrow('No app selected');
  });

  it('AP-CURR-068: propagates Supabase error on partial failure', async () => {
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

    const { result } = renderHook(() => useBulkCreateSkills(), { wrapper });
    await expect(
      result.current.mutateAsync([{ title: 'Skill A', slug: 'skill-a', sort_order: 1 }])
    ).rejects.toMatchObject({ message: 'duplicate key' });
  });

  it('AP-CURR-069: invalidates skills and skills-paginated but NOT dashboard-stats or publish-preview', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const mockChain = getMockChain();
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: [{ skill_id: SKILL_IDS[0], title: 'Skill A', app_id: MOCK_APP_ID }],
          error: null,
        }).then(onFulfilled)
      ),
    };
    mockChain.insert.mockReturnValue(insertChain);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBulkCreateSkills(), { wrapper });
    await result.current.mutateAsync([{ title: 'Skill A', slug: 'skill-a', sort_order: 1 }]);

    const predicates = invalidateSpy.mock.calls.map((call) => (call[0] as any)?.predicate);

    const isInvalidated = (key: string) => predicates.some((p) => p({ queryKey: [key] }));

    expect(isInvalidated('skills')).toBe(true);
    expect(isInvalidated('skills-paginated')).toBe(true);
    expect(isInvalidated('dashboard-stats')).toBe(false);
    expect(isInvalidated('publish-preview')).toBe(false);
  });
});

// ── Cache invalidation (Delete & Status) ─────────────────────────────────────

describe('useBulkDeleteSkills — cache invalidation — AP-CURR-069b', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-069b: invalidates skills, skills-paginated, dashboard-stats but NOT publish-preview', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBulkDeleteSkills(), { wrapper });
    await result.current.mutateAsync(SKILL_IDS);

    const predicates = invalidateSpy.mock.calls.map((call) => (call[0] as any)?.predicate);
    const isInvalidated = (key: string) => predicates.some((p) => p({ queryKey: [key] }));

    expect(isInvalidated('skills')).toBe(true);
    expect(isInvalidated('skills-paginated')).toBe(true);
    expect(isInvalidated('dashboard-stats')).toBe(true);
    expect(isInvalidated('publish-preview')).toBe(false);
  });
});

describe('useBulkUpdateSkillsStatus — cache invalidation — AP-CURR-069c', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-069c: invalidates skills, skills-paginated, dashboard-stats, AND publish-preview', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBulkUpdateSkillsStatus(), { wrapper });
    await result.current.mutateAsync({ skill_ids: SKILL_IDS, status: 'published' });

    const predicates = invalidateSpy.mock.calls.map((call) => (call[0] as any)?.predicate);
    const isInvalidated = (key: string) => predicates.some((p) => p({ queryKey: [key] }));

    expect(isInvalidated('skills')).toBe(true);
    expect(isInvalidated('skills-paginated')).toBe(true);
    expect(isInvalidated('dashboard-stats')).toBe(true);
    expect(isInvalidated('publish-preview')).toBe(true);
  });
});
