import { ToastProvider } from '@/components/ui/toast';
import { AppProvider } from '@/contexts/AppContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

import { Mock } from 'vitest';

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

export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>{children}</AppProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};
