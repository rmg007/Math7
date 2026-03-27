import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { QuestionForm } from '../question-form';

// Mock UI components that might cause issues in JSDOM or fail due to context
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock hooks
vi.mock('@/hooks/use-app', () => ({
  useApp: () => ({
    currentApp: { app_id: 'app-1', display_name: 'Test App' },
    isAppLoading: false,
    isSuperAdmin: true,
  }),
}));

vi.mock('../../hooks/use-questions', () => ({
  useQuestion: () => ({ data: null, isLoading: false, error: null }),
  useCreateQuestion: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateQuestion: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../hooks/use-skills', () => ({
  useSkills: () => ({ data: [], isLoading: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as any),
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: undefined }),
  };
});

// Avoid canvas errors
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn();
}

describe('QuestionForm (Basic Render Coverage)', () => {
  it('renders question form container', () => {
    render(
      <BrowserRouter>
        <QuestionForm />
      </BrowserRouter>
    );
    expect(screen.getAllByText(/Assessment Matrix/i).length).toBeGreaterThan(0);
  });
});
