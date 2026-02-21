import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthConfirmPage } from './AuthConfirmPage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// vi.hoisted ensures these are defined before vi.mock factories run
const { mockVerifyOtp, mockUpdateUser } = vi.hoisted(() => ({
  mockVerifyOtp: vi.fn(),
  mockUpdateUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: mockVerifyOtp,
      updateUser: mockUpdateUser,
    },
  },
}));

// Suppress Lucide icon rendering overhead in JSDOM
vi.mock('lucide-react', () => ({
  AlertCircle: () => null,
  CheckCircle2: () => null,
  KeyRound: () => null,
  Loader2: () => null,
  Lock: () => null,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fill a password input via fireEvent (fast, sync — avoids userEvent.type timeouts) */
function fillInput(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}

/**
 * Set window.location to a given search + hash.
 * Uses vi.stubGlobal so it is properly reset by vi.unstubAllGlobals in afterEach.
 */
function setLocation(search = '', hash = '') {
  vi.stubGlobal('location', {
    pathname: '/auth/confirm',
    search,
    hash,
    href: `http://localhost/auth/confirm${search}${hash}`,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/auth/confirm']}>
      <AuthConfirmPage />
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLocation('', ''); // no-token baseline
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Token detection — Safe Links hash-fragment format (our email template)
  // -------------------------------------------------------------------------

  describe('Safe Links bypass — hash fragment token', () => {
    it('reads token_hash and type=recovery from URL hash fragment', () => {
      setLocation('', '#token_hash=abc123&type=recovery');
      renderPage();

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument();
    });

    it('does NOT call verifyOtp on page load — token consumed only on button click', () => {
      setLocation('', '#token_hash=abc123&type=recovery');
      renderPage();

      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('shows confirm-account button for non-recovery hash fragment types (signup)', () => {
      setLocation('', '#token_hash=abc123&type=signup');
      renderPage();

      expect(screen.getByRole('button', { name: /confirm.*sign in/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it('shows confirm-account button for magiclink type', () => {
      setLocation('', '#token_hash=abc123&type=magiclink');
      renderPage();

      expect(screen.getByRole('button', { name: /confirm.*sign in/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Token detection — PKCE URL params (Supabase redirect fallback)
  // -------------------------------------------------------------------------

  describe('PKCE URL params token', () => {
    it('reads token_hash and type from URL search params', () => {
      setLocation('?token_hash=pkce_hash&type=recovery', '');
      renderPage();

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument();
    });

    it('prefers hash fragment over URL params when both are present', () => {
      // Hash: type=recovery, Params: type=signup — hash wins
      setLocation('?token_hash=params_hash&type=signup', '#token_hash=frag_hash&type=recovery');
      renderPage();

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Legacy access_token hash (Supabase implicit flow)
  // -------------------------------------------------------------------------

  describe('Legacy implicit flow — access_token in fragment', () => {
    it('shows password fields for legacy access_token recovery flow', () => {
      setLocation('', '#access_token=legacy&type=recovery&refresh_token=rtoken');
      renderPage();

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // No token — redirect to login
  // -------------------------------------------------------------------------

  describe('No token present', () => {
    it('redirects to /login when no token is found', () => {
      setLocation('', '');
      renderPage();

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('redirects to /login when URL has unrelated params only', () => {
      setLocation('?foo=bar', '');
      renderPage();

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  // -------------------------------------------------------------------------
  // Error in URL (e.g. Safe Links burned the OTP via old template)
  // -------------------------------------------------------------------------

  describe('Error state from URL', () => {
    it('shows decoded error message when error_code is in URL hash', () => {
      setLocation(
        '',
        '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
      );
      renderPage();

      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
    });

    it('shows generic error message when error_description is absent', () => {
      setLocation('', '#error=access_denied&error_code=otp_expired');
      renderPage();

      expect(screen.getByText(/expired or is invalid/i)).toBeInTheDocument();
    });

    it('does NOT show password input fields in the error state', () => {
      setLocation('', '#error=access_denied&error_code=otp_expired');
      renderPage();

      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Password validation (client-side, before any Supabase call)
  // -------------------------------------------------------------------------

  describe('Password validation', () => {
    beforeEach(() => setLocation('', '#token_hash=abc123&type=recovery'));

    it('shows error when new password is too short (< 8 chars)', async () => {
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'short');
      fillInput(screen.getByLabelText(/confirm password/i), 'short');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument());
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it("shows error when passwords don't match", async () => {
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'ValidPass1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'DifferentPass1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/do not match/i)).toBeInTheDocument());
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it('does NOT call Supabase at all when client validation fails', async () => {
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'abc');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument());
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Successful password reset
  // -------------------------------------------------------------------------

  describe('Successful password reset', () => {
    beforeEach(() => {
      setLocation('', '#token_hash=valid_hash&type=recovery');
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });
    });

    it('calls verifyOtp with token_hash from hash fragment', async () => {
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          token_hash: 'valid_hash',
          type: 'recovery',
        })
      );
    });

    it('calls updateUser with the new password after OTP verified', async () => {
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPassword1!' })
      );
    });

    it('shows success state after password is updated', async () => {
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/all done/i)).toBeInTheDocument());
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });

    it('redirects to /login after the 2-second delay on success', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/all done/i)).toBeInTheDocument());
      act(() => vi.advanceTimersByTime(2000));

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------
  // Supabase API errors
  // -------------------------------------------------------------------------

  describe('Supabase API errors', () => {
    beforeEach(() => setLocation('', '#token_hash=bad_hash&type=recovery'));

    it('shows error message when verifyOtp fails', async () => {
      mockVerifyOtp.mockResolvedValue({ error: new Error('Token has expired or is invalid') });
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByText(/token has expired or is invalid/i)).toBeInTheDocument()
      );
    });

    it('shows error message when updateUser fails', async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: new Error('Password too weak') });
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/password too weak/i)).toBeInTheDocument());
    });

    it('shows "try again" link after an API error on the recovery flow', async () => {
      mockVerifyOtp.mockResolvedValue({ error: new Error('Expired') });
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument());
    });

    it('clicking "try again" restores the password form', async () => {
      mockVerifyOtp.mockResolvedValue({ error: new Error('Expired') });
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/try again/i));

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Non-recovery flows (signup, magiclink)
  // -------------------------------------------------------------------------

  describe('Signup / magic link confirmation', () => {
    it('calls verifyOtp with type=signup and navigates home on success', async () => {
      setLocation('', '#token_hash=signup_hash&type=signup');
      mockVerifyOtp.mockResolvedValue({ error: null });
      vi.useFakeTimers({ shouldAdvanceTime: true });

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /confirm.*sign in/i }));

      await waitFor(() =>
        expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: 'signup_hash', type: 'signup' })
      );

      act(() => vi.advanceTimersByTime(1500));
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      vi.useRealTimers();
    });

    it('shows error when signup verifyOtp fails', async () => {
      setLocation('', '#token_hash=bad_signup_hash&type=signup');
      mockVerifyOtp.mockResolvedValue({ error: new Error('Invalid token') });

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /confirm.*sign in/i }));

      await waitFor(() => expect(screen.getByText(/invalid token/i)).toBeInTheDocument());
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe('Loading state', () => {
    it('disables button and shows "Verifying…" while waiting for Supabase', async () => {
      setLocation('', '#token_hash=abc&type=recovery');
      mockVerifyOtp.mockReturnValue(new Promise(() => {})); // never resolves

      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled()
      );
    });

    it('disables password inputs while loading', async () => {
      setLocation('', '#token_hash=abc&type=recovery');
      mockVerifyOtp.mockReturnValue(new Promise(() => {}));

      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeDisabled();
        expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  describe('Back to Sign In navigation', () => {
    it('navigates to /login from the idle form', () => {
      setLocation('', '#token_hash=abc&type=recovery');
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('navigates to /login from the error screen', () => {
      setLocation('', '#error_code=otp_expired&error_description=Expired');
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard UX
  // -------------------------------------------------------------------------

  describe('Keyboard UX', () => {
    it('submits when Enter is pressed in the confirm password field', async () => {
      setLocation('', '#token_hash=abc&type=recovery');
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'NewPassword1!');
      fillInput(screen.getByLabelText(/confirm password/i), 'NewPassword1!');
      fireEvent.keyDown(screen.getByLabelText(/confirm password/i), { key: 'Enter' });

      await waitFor(() => expect(mockVerifyOtp).toHaveBeenCalled());
    });
  });
});
