/**
 * Shared Supabase Mock Factory
 *
 * Centralizes the repetitive `vi.mock('@/lib/supabase')` pattern scattered
 * across multiple test files. Import and call `createMockSupabase()` in your
 * test's vi.mock factory, then use the returned handles to configure return
 * values per-test.
 *
 * Usage:
 *   import { createMockSupabase } from '@/mocks/supabase-factory';
 *   const { mockFrom, mockSelect, mockInsert, mockRpc } = createMockSupabase();
 *   vi.mock('@/lib/supabase', () => mockFrom.__moduleFactory());
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Builder types
// ---------------------------------------------------------------------------

export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
  throwOnError: ReturnType<typeof vi.fn>;
}

export interface MockSupabase {
  /** The full mock supabase client object */
  client: {
    from: ReturnType<typeof vi.fn>;
    rpc: ReturnType<typeof vi.fn>;
    auth: {
      getSession: ReturnType<typeof vi.fn>;
      signInWithPassword: ReturnType<typeof vi.fn>;
      signOut: ReturnType<typeof vi.fn>;
      onAuthStateChange: ReturnType<typeof vi.fn>;
    };
    channel: ReturnType<typeof vi.fn>;
  };
  /** The mock `from()` function — use to configure per-table responses */
  mockFrom: ReturnType<typeof vi.fn>;
  /** The mock `rpc()` function */
  mockRpc: ReturnType<typeof vi.fn>;
  /**
   * Pre-built chainable query builder. Returned by `from()` by default.
   * Override individual methods for specific test scenarios.
   */
  queryBuilder: MockQueryBuilder;
  /**
   * Helper: wire `from()` to return a successful data response.
   *
   * @param data - The data to return from the final `.select()` / `.single()` call
   */
  resolveWith(data: unknown): void;
  /**
   * Helper: wire `from()` to return an error response.
   *
   * @param message - The error message string
   */
  rejectWith(message: string): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a fresh set of vi.fn() mocks for the Supabase client.
 * Call this inside a `beforeEach` or at the top of a `describe` block.
 *
 * @returns MockSupabase handles for configuring and asserting on Supabase calls.
 */
export function createMockSupabase(): MockSupabase {
  // Default success response
  const defaultResponse = { data: [], error: null };

  // Chainable query builder — every method returns `this` so chains work
  const queryBuilder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    then: vi.fn((onFulfilled) => Promise.resolve(defaultResponse).then(onFulfilled)),
    throwOnError: vi.fn().mockReturnThis(),
  };

  const mockFrom = vi.fn().mockReturnValue(queryBuilder);
  const mockRpc = vi.fn().mockResolvedValue(defaultResponse);

  const client = {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    }),
  };

  function resolveWith(data: unknown) {
    const response = { data, error: null };
    queryBuilder.select.mockResolvedValue(response);
    queryBuilder.single.mockResolvedValue(response);
    queryBuilder.maybeSingle.mockResolvedValue(response);
  }

  function rejectWith(message: string) {
    const response = { data: null, error: { message } };
    queryBuilder.select.mockResolvedValue(response);
    queryBuilder.single.mockResolvedValue(response);
    queryBuilder.maybeSingle.mockResolvedValue(response);
  }

  return { client, mockFrom, mockRpc, queryBuilder, resolveWith, rejectWith };
}

/**
 * Convenience: returns the vi.mock module factory for `@/lib/supabase`.
 * Use in `vi.mock('@/lib/supabase', supabaseMockFactory(mock))`.
 */
export function supabaseMockFactory(mock: MockSupabase) {
  return () => ({
    supabase: mock.client,
  });
}
