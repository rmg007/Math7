import { ToastProvider } from '@/components/ui/toast';
import { AppProvider } from '@/contexts/AppContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

import { Mock, vi } from 'vitest';

export interface MockSupabaseChain {
  select: Mock;
  eq: Mock;
  neq: Mock;
  in: Mock;
  or: Mock;
  order: Mock;
  single: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
  range: Mock;
  maybeSingle: Mock;
  ilike: Mock;
  is: Mock;
  then: Mock;
}

export const createMockSupabaseChain = (initialData: any = null, initialError: any = null): MockSupabaseChain => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    range: vi.fn(),
    ilike: vi.fn(),
    is: vi.fn(),
    then: vi.fn((onFulfilled: (value: { data: any; error: any; count?: number }) => any) =>
      Promise.resolve({
        data: initialData,
        error: initialError,
        count: Array.isArray(initialData) ? initialData.length : (initialData === null ? 0 : 1),
      }).then(onFulfilled)
    ),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.neq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.or.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.single.mockReturnValue(chain);
  chain.maybeSingle.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.range.mockReturnValue(chain);
  chain.ilike.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);

  return chain as unknown as MockSupabaseChain;
};

export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};
