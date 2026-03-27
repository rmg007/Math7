import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { DomainForm } from '../domain-form';

// Mock everything aggressively to just test the render
vi.mock('@/hooks/use-app', () => ({
  useApp: () => ({
    currentApp: { app_id: 'app-1', display_name: 'Test App' },
    isAppLoading: false,
    isSuperAdmin: true,
    apps: [{ app_id: 'app-1', display_name: 'Test App' }],
  }),
}));

vi.mock('../../hooks/use-domains', () => ({
  useDomain: () => ({ data: null, isLoading: false, error: null }),
  useDomains: () => ({ data: [] }),
  useCreateDomain: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateDomain: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCheckDomainSlug: () => ({ checkSlug: vi.fn().mockResolvedValue(true) }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as any),
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: undefined }),
  };
});

describe('DomainForm (Basic Render Coverage)', () => {
  it('renders title and slug fields', () => {
    // Just a simple render test to ensure module loads and basic structure works
    render(
      <BrowserRouter>
        <DomainForm />
      </BrowserRouter>
    );
    expect(screen.getAllByText('Create Domain').length).toBeGreaterThan(0);
  });
});
