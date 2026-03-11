/**
 * use-questions-bulk.test.tsx
 *
 * Tests: Bulk mutations for questions
 *  - useBulkCreateQuestions
 *  - useBulkDeleteQuestions
 *  - useBulkUpdateQuestionsStatus
 *
 * Test IDs: AP-CURR-021 .. AP-CURR-029
 */
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '@/lib/database.types';
import {
  useBulkCreateQuestions,
  useBulkDeleteQuestions,
  useBulkUpdateQuestionsStatus,
} from '../use-questions-bulk';

type QuestionInsert = Database['public']['Tables']['questions']['Insert'];

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
const QUESTION_IDS = [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
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
  return supabase.from('questions');
}

// ── useBulkCreateQuestions ────────────────────────────────────────────────────
describe('useBulkCreateQuestions — AP-CURR-021', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-021: inserts multiple questions, each stamped with app_id', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: [
            {
              question_id: QUESTION_IDS[0],
              question_text: 'Q1',
              type: 'multiple_choice',
              app_id: MOCK_APP_ID,
            },
            {
              question_id: QUESTION_IDS[1],
              question_text: 'Q2',
              type: 'boolean',
              app_id: MOCK_APP_ID,
            },
          ],
          error: null,
        }).then(onFulfilled)
      ),
    };
    mockChain.insert.mockReturnValue(insertChain);

    const { result } = renderHook(() => useBulkCreateQuestions(), { wrapper });
    // Bridge pattern: Supabase is fully mocked; payload shape is intentionally minimal
    const questions = [
      { question_text: 'Q1', type: 'multiple_choice', app_id: MOCK_APP_ID },
      { question_text: 'Q2', type: 'boolean', app_id: MOCK_APP_ID },
    ] as unknown as QuestionInsert[];
    await result.current.mutateAsync(questions);

    const [insertPayload] = mockChain.insert.mock.calls[0];
    // Every question must be stamped with app_id
    expect(insertPayload).toHaveLength(2);
    (insertPayload as Array<Record<string, unknown>>).forEach((q) => {
      expect(q.app_id).toBe(MOCK_APP_ID);
    });
    expect(insertPayload[0].question_text).toBe('Q1');
    expect(insertPayload[1].question_text).toBe('Q2');
  });

  it('AP-CURR-021b: throws when no app is selected', async () => {
    mockApp({ currentApp: null });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useBulkCreateQuestions(), { wrapper });
    await expect(
      result.current.mutateAsync([{ question_text: 'Q', type: 'multiple_choice' } as any])
    ).rejects.toThrow('No app selected');
  });

  it('AP-CURR-021c: propagates Supabase error on insert failure', async () => {
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

    const { result } = renderHook(() => useBulkCreateQuestions(), { wrapper });
    await expect(
      result.current.mutateAsync([{ question_text: 'Q', type: 'multiple_choice' } as any])
    ).rejects.toMatchObject({ message: 'duplicate key' });
  });

  it('AP-CURR-021d: invalidates questions, questions-paginated, and dashboard-stats on success', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const mockChain = getMockChain();
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: [
            {
              question_id: QUESTION_IDS[0],
              question_text: 'Q1',
              app_id: MOCK_APP_ID,
            },
          ],
          error: null,
        }).then(onFulfilled)
      ),
    };
    mockChain.insert.mockReturnValue(insertChain);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBulkCreateQuestions(), { wrapper });
    await result.current.mutateAsync([{ question_text: 'Q1', type: 'multiple_choice' } as any]);

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => (call[0] as any)?.queryKey);
    expect(invalidatedKeys).toContainEqual(['questions']);
    expect(invalidatedKeys).toContainEqual(['questions-paginated']);
    expect(invalidatedKeys).toContainEqual(['dashboard-stats']);
    // publish-preview must NOT be invalidated by useBulkCreateQuestions
    expect(invalidatedKeys).not.toContainEqual(['publish-preview']);
  });
});

// ── useBulkDeleteQuestions ────────────────────────────────────────────────────
describe('useBulkDeleteQuestions — AP-CURR-022', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-022: soft-deletes multiple questions with deleted_at timestamp', async () => {
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

    const { result } = renderHook(() => useBulkDeleteQuestions(), { wrapper });
    await result.current.mutateAsync(QUESTION_IDS);

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(updateChain.in).toHaveBeenCalledWith('question_id', QUESTION_IDS);
    // Tenant scoping: must filter by app_id
    expect(updateChain.eq).toHaveBeenCalledWith('app_id', MOCK_APP_ID);
  });

  it('AP-CURR-022b: propagates Supabase error on delete failure', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: { message: 'delete failed', code: '42501' } }).then(
          onFulfilled
        )
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useBulkDeleteQuestions(), { wrapper });
    await expect(result.current.mutateAsync(QUESTION_IDS)).rejects.toMatchObject({
      message: 'delete failed',
    });
  });

  it('AP-CURR-022c: throws when no app and not super admin', async () => {
    mockApp({ currentApp: null, isSuperAdmin: false });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useBulkDeleteQuestions(), { wrapper });
    await expect(result.current.mutateAsync(QUESTION_IDS)).rejects.toThrow('No app selected');
  });

  it('AP-CURR-022d: super admin can bulk-delete without app_id filter', async () => {
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

    const { result } = renderHook(() => useBulkDeleteQuestions(), { wrapper });
    await result.current.mutateAsync(QUESTION_IDS);

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    // Super admin: app_id filter must NOT be added
    expect(eqCalls.some(([col]) => col === 'app_id')).toBe(false);
  });

  it('AP-CURR-022e: invalidates questions, questions-paginated, and dashboard-stats on success', async () => {
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

    const { result } = renderHook(() => useBulkDeleteQuestions(), { wrapper });
    await result.current.mutateAsync(QUESTION_IDS);

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => (call[0] as any)?.queryKey);
    expect(invalidatedKeys).toContainEqual(['questions']);
    expect(invalidatedKeys).toContainEqual(['questions-paginated']);
    expect(invalidatedKeys).toContainEqual(['dashboard-stats']);
    // useBulkDeleteQuestions does NOT invalidate publish-preview
    expect(invalidatedKeys).not.toContainEqual(['publish-preview']);
  });
});

// ── useBulkUpdateQuestionsStatus ──────────────────────────────────────────────
describe('useBulkUpdateQuestionsStatus — AP-CURR-023', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('AP-CURR-023: updates status to "live" for multiple questions', async () => {
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

    const { result } = renderHook(() => useBulkUpdateQuestionsStatus(), { wrapper });
    await result.current.mutateAsync({ question_ids: QUESTION_IDS, status: 'live' });

    expect(mockChain.update).toHaveBeenCalledWith({ status: 'live' });
    expect(updateChain.in).toHaveBeenCalledWith('question_id', QUESTION_IDS);
  });

  it('AP-CURR-023b: updates status to "draft" for rollback', async () => {
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

    const { result } = renderHook(() => useBulkUpdateQuestionsStatus(), { wrapper });
    await result.current.mutateAsync({ question_ids: QUESTION_IDS, status: 'draft' });

    expect(mockChain.update).toHaveBeenCalledWith({ status: 'draft' });
  });

  it('AP-CURR-023c: scopes to app_id for tenant admin', async () => {
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

    const { result } = renderHook(() => useBulkUpdateQuestionsStatus(), { wrapper });
    await result.current.mutateAsync({ question_ids: QUESTION_IDS, status: 'live' });

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col, val]) => col === 'app_id' && val === MOCK_APP_ID)).toBe(true);
  });

  it('AP-CURR-023d: propagates Supabase error', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: { message: 'status update failed' } }).then(
          onFulfilled
        )
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useBulkUpdateQuestionsStatus(), { wrapper });
    await expect(
      result.current.mutateAsync({ question_ids: QUESTION_IDS, status: 'live' })
    ).rejects.toMatchObject({ message: 'status update failed' });
  });

  it('AP-CURR-023e: throws when no app and not super admin', async () => {
    mockApp({ currentApp: null, isSuperAdmin: false });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useBulkUpdateQuestionsStatus(), { wrapper });
    await expect(
      result.current.mutateAsync({ question_ids: QUESTION_IDS, status: 'live' })
    ).rejects.toThrow('No app selected');
  });

  it('AP-CURR-023f: super admin can update status without app_id filter', async () => {
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

    const { result } = renderHook(() => useBulkUpdateQuestionsStatus(), { wrapper });
    await result.current.mutateAsync({ question_ids: QUESTION_IDS, status: 'live' });

    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col]) => col === 'app_id')).toBe(false);
  });

  it('AP-CURR-023g: invalidates questions, questions-paginated, dashboard-stats, and publish-preview on success', async () => {
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

    const { result } = renderHook(() => useBulkUpdateQuestionsStatus(), { wrapper });
    await result.current.mutateAsync({ question_ids: QUESTION_IDS, status: 'live' });

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => (call[0] as any)?.queryKey);
    expect(invalidatedKeys).toContainEqual(['questions']);
    expect(invalidatedKeys).toContainEqual(['questions-paginated']);
    expect(invalidatedKeys).toContainEqual(['dashboard-stats']);
    expect(invalidatedKeys).toContainEqual(['publish-preview']);
  });
});
