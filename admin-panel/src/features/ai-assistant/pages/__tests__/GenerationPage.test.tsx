import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { GenerationPage } from '../GenerationPage';

vi.mock('@/hooks/use-app', () => ({
  useApp: () => ({
    currentApp: { app_id: 'app-1', display_name: 'Test App' },
    isAppLoading: false,
    isSuperAdmin: true,
  }),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as any),
    useNavigate: () => vi.fn(),
  };
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('GenerationPage (Basic Render Coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    // Basic render to make sure component doesn't crash on mount
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <GenerationPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
    expect(screen.getAllByText(/AI Question Generator/i).length).toBeGreaterThan(0);
  });
});
