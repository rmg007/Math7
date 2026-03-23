import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from '../auth-guard';

// ─── Hoisted mock fns (referenced inside vi.mock factories) ─────────────────
// vi.mock() is hoisted to the top of the file by Vitest, so any variables
// referenced inside the factory MUST be created with vi.hoisted() to ensure
// they exist at hoist time. Regular `const` declarations are NOT available.

const { mockGetSession, mockSignOut, mockOnAuthStateChange, mockFrom, mockNavigate } = vi.hoisted(
  () => ({
    mockGetSession: vi.fn(),
    mockSignOut: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
    mockFrom: vi.fn(),
    mockNavigate: vi.fn(),
  })
);

// ─── Module Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
}));

vi.mock('@/lib/error-tracker', () => ({
  setUser: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockSubscription = { unsubscribe: vi.fn() };

function setupSubscription() {
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: mockSubscription },
  });
}

function buildMockQueryBuilder(profileData: { deleted_at: string | null } | null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profileData, error: null }),
  };
  mockFrom.mockReturnValue(builder);
  return builder;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSubscription();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('shows loading spinner while verifying session', () => {
    // Never resolves — stays in loading state
    mockGetSession.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('VERIFYING SESSION')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when no session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when session is valid and profile is not deleted', async () => {
    const mockSession = { user: { id: 'user-123', email: 'test@example.com' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    localStorage.setItem('questerix_remember_me', '1');
    buildMockQueryBuilder({ deleted_at: null });

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
  });

  it('signs out and redirects when profile is soft-deleted', async () => {
    const mockSession = { user: { id: 'user-123', email: 'test@example.com' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    localStorage.setItem('questerix_remember_me', '1');
    mockSignOut.mockResolvedValue({ error: null });
    buildMockQueryBuilder({ deleted_at: '2024-01-01T00:00:00Z' });

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('evicts session when "Remember Me" is absent and session was not active', async () => {
    const mockSession = { user: { id: 'user-123', email: 'test@example.com' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    // No rememberMe, no wasSessionActive in sessionStorage

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('allows access when session is active in sessionStorage (tab still open)', async () => {
    const mockSession = { user: { id: 'user-123', email: 'test@example.com' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    sessionStorage.setItem('questerix_session_active', '1');
    buildMockQueryBuilder({ deleted_at: null });

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('allows access even when profile fetch fails (transient network error)', async () => {
    const mockSession = { user: { id: 'user-123', email: 'test@example.com' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    localStorage.setItem('questerix_remember_me', '1');

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network timeout' },
      }),
    };
    mockFrom.mockReturnValue(builder);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('redirects to /login on SIGNED_OUT auth state change', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    // Wrap in an object: TypeScript CFA tracks property mutations in callbacks
    // but treats `let` as always-null after initial assignment through closures.
    const capture: { fn: ((event: string, session: null) => void) | null } = { fn: null };
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: null) => void) => {
      capture.fn = cb;
      return { data: { subscription: mockSubscription } };
    });

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    capture.fn?.('SIGNED_OUT', null);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('unsubscribes from auth listener on unmount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const { unmount } = render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));

    unmount();

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });
});
