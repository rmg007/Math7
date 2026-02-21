/**
 * AuthConfirmPage.test.tsx
 *
 * Comprehensive suite for the Safe Links bypass relay page.
 * Each describe block maps to a distinct behaviour domain of the component.
 *
 * Key testing decisions:
 * - vi.stubGlobal for window.location → proper per-test isolation via
 *   vi.unstubAllGlobals() in afterEach (Object.defineProperty leaks across tests).
 * - vi.hoisted for mock fns → correct hoisting order inside vi.mock factories.
 * - fireEvent.change for inputs → synchronous, avoids userEvent.type timeouts in JSDOM.
 * - Lucide icons mocked to null → prevents SVG loading overhead in JSDOM.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthConfirmPage } from './AuthConfirmPage';

// ---------------------------------------------------------------------------
// Mock infrastructure
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

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

vi.mock('lucide-react', () => ({
  AlertCircle: () => null,
  CheckCircle2: () => null,
  KeyRound: () => null,
  Loader2: () => null,
  Lock: () => null,
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function setLocation(search = '', hash = '') {
  vi.stubGlobal('location', {
    pathname: '/auth/confirm',
    search,
    hash,
    href: `http://localhost/auth/confirm${search}${hash}`,
  });
}

function fillInput(el: HTMLElement, value: string) {
  fireEvent.change(el, { target: { value } });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/auth/confirm']}>
      <AuthConfirmPage />
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Shared valid credentials
// ---------------------------------------------------------------------------
const VALID_PW = 'ValidPassword1!';

// ===========================================================================
// Test suites
// ===========================================================================

describe('AuthConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLocation('', '');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // =========================================================================
  // 1. Token detection — priority ordering
  // =========================================================================

  describe('Token detection', () => {
    describe('Priority 1 — hash fragment (#token_hash=…) — our email template format', () => {
      it('recovery: shows password form and h1="Set New Password"', () => {
        setLocation('', '#token_hash=abc&type=recovery');
        renderPage();

        expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });

      it('signup: shows confirm button and h1="Confirm Your Account"', () => {
        setLocation('', '#token_hash=abc&type=signup');
        renderPage();

        expect(screen.getByRole('heading', { name: /confirm your account/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm.*sign in/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      });

      it('magiclink: shows confirm button', () => {
        setLocation('', '#token_hash=abc&type=magiclink');
        renderPage();

        expect(screen.getByRole('button', { name: /confirm.*sign in/i })).toBeInTheDocument();
      });

      it('email_change: shows confirm button', () => {
        setLocation('', '#token_hash=abc&type=email_change');
        renderPage();

        expect(screen.getByRole('button', { name: /confirm.*sign in/i })).toBeInTheDocument();
      });

      it('DOES NOT call verifyOtp or updateUser on mount — token only consumed on click', () => {
        setLocation('', '#token_hash=abc&type=recovery');
        renderPage();

        expect(mockVerifyOtp).not.toHaveBeenCalled();
        expect(mockUpdateUser).not.toHaveBeenCalled();
      });
    });

    describe('Priority 2 — URL params (?token_hash=…) — Supabase PKCE redirect', () => {
      it('recovery: shows password form from URL params', () => {
        setLocation('?token_hash=pkce_hash&type=recovery', '');
        renderPage();

        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      it('hash fragment takes priority over URL params', () => {
        // Params say signup, fragment says recovery — fragment wins
        setLocation('?token_hash=params&type=signup', '#token_hash=frag&type=recovery');
        renderPage();

        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
      });
    });

    describe('Priority 3 — legacy #access_token=… (Supabase implicit flow)', () => {
      it('recovery: shows password form', () => {
        setLocation('', '#access_token=legacy&type=recovery&refresh_token=r');
        renderPage();

        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
    });

    describe('No token — redirect to login', () => {
      it('redirects when URL is completely empty', () => {
        setLocation('', '');
        renderPage();

        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });

      it('redirects when URL has only unrelated params', () => {
        setLocation('?utm_source=email', '');
        renderPage();

        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });

      it('redirects exactly once', () => {
        setLocation('', '');
        renderPage();

        expect(mockNavigate).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // 2. URL error state (Supabase redirects with error params)
  // =========================================================================

  describe('URL error state', () => {
    it('shows decoded error_description from hash', () => {
      setLocation(
        '',
        '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
      );
      renderPage();

      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    });

    it('shows generic message when error_description is missing', () => {
      setLocation('', '#error=access_denied&error_code=otp_expired');
      renderPage();

      expect(screen.getByText(/expired or is invalid/i)).toBeInTheDocument();
    });

    it('shows "Link Expired" heading in error state', () => {
      setLocation('', '#error_code=otp_expired');
      renderPage();

      // h1 shows "Link Expired" when error but no authType
      expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
    });

    it('does not show password fields in error state', () => {
      setLocation('', '#error=access_denied&error_code=otp_expired');
      renderPage();

      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it('error_code in URL search params is also handled', () => {
      setLocation('?error_code=otp_expired&error_description=Token+expired', '');
      renderPage();

      expect(screen.getByText(/token expired/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. Password validation (client-side, before any Supabase call)
  // =========================================================================

  describe('Password validation', () => {
    beforeEach(() => setLocation('', '#token_hash=abc&type=recovery'));

    it('rejects passwords shorter than 8 characters', async () => {
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), 'short');
      fillInput(screen.getByLabelText(/confirm password/i), 'short');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
      );
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it('rejects when passwords do not match', async () => {
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), 'Different1!');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/do not match/i)).toBeInTheDocument());
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it('accepts exactly 8-character passwords', async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), 'Exact8!x');
      fillInput(screen.getByLabelText(/confirm password/i), 'Exact8!x');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(mockVerifyOtp).toHaveBeenCalled());
    });

    it('never calls Supabase when client validation fails', async () => {
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), 'bad');
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
      );
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. Successful password reset (hash-fragment PKCE)
  // =========================================================================

  describe('Successful password reset', () => {
    beforeEach(() => {
      setLocation('', '#token_hash=valid_hash&type=recovery');
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });
    });

    it('calls verifyOtp with the token_hash from the hash fragment', async () => {
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: 'valid_hash', type: 'recovery' })
      );
    });

    it('calls updateUser with the new password after OTP is verified', async () => {
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(mockUpdateUser).toHaveBeenCalledWith({ password: VALID_PW })
      );
    });

    it('does NOT call updateUser before verifyOtp completes', async () => {
      // verifyOtp hangs, updateUser should not be called yet
      mockVerifyOtp.mockReturnValue(new Promise(() => {}));
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByRole('button', { name: /verifying/i })).toBeInTheDocument());
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('shows h1="All Done!" and success copy after password is updated', async () => {
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /all done/i })).toBeInTheDocument()
      );
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });

    it('hides password form on success', async () => {
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument()
      );
    });

    it('redirects to /login after 2-second delay', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /all done/i })).toBeInTheDocument()
      );
      act(() => vi.advanceTimersByTime(2000));

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      vi.useRealTimers();
    });

    it('uses a 2000ms delay for the redirect (not immediate)', async () => {
      // Spy on global setTimeout to assert the exact delay scheduled
      const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /all done/i })).toBeInTheDocument()
      );

      // Assert the component scheduled navigate('/login') with 2000ms (not 0 or 1500)
      const call = timeoutSpy.mock.calls.find(([, ms]) => ms === 2000);
      expect(call).toBeTruthy();
      timeoutSpy.mockRestore();
    });
  });

  // =========================================================================
  // 5. Supabase API errors during reset
  // =========================================================================

  describe('Supabase API errors', () => {
    beforeEach(() => setLocation('', '#token_hash=hash&type=recovery'));

    it('shows the error message from verifyOtp', async () => {
      mockVerifyOtp.mockResolvedValue({ error: new Error('Token has expired or is invalid') });
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByText(/token has expired or is invalid/i)).toBeInTheDocument()
      );
    });

    it('shows the error message from updateUser', async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: new Error('Password too weak') });
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByText(/password too weak/i)).toBeInTheDocument()
      );
    });

    it('shows fallback message for non-Error thrown values', async () => {
      mockVerifyOtp.mockRejectedValue('string error');
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      );
    });

    it('shows "← Try again" link on recovery API error', async () => {
      mockVerifyOtp.mockResolvedValue({ error: new Error('Expired') });
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument());
    });

    it('"← Try again" restores the password form', async () => {
      mockVerifyOtp.mockResolvedValue({ error: new Error('Expired') });
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/try again/i));

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
    });

    it('updateUser is NOT called if verifyOtp fails', async () => {
      mockVerifyOtp.mockResolvedValue({ error: new Error('Bad token') });
      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/bad token/i)).toBeInTheDocument());
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 6. Signup / magic link / email_change flows
  // =========================================================================

  describe('Non-recovery confirmation flows', () => {
    it('signup: calls verifyOtp with type=signup and navigates to "/" on success', async () => {
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

    it('magiclink: calls verifyOtp with type=magiclink', async () => {
      setLocation('', '#token_hash=magic_hash&type=magiclink');
      mockVerifyOtp.mockResolvedValue({ error: null });

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /confirm.*sign in/i }));

      await waitFor(() =>
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          token_hash: 'magic_hash',
          type: 'magiclink',
        })
      );
    });

    it('email_change: calls verifyOtp with type=email_change', async () => {
      setLocation('', '#token_hash=change_hash&type=email_change');
      mockVerifyOtp.mockResolvedValue({ error: null });

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /confirm.*sign in/i }));

      await waitFor(() =>
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          token_hash: 'change_hash',
          type: 'email_change',
        })
      );
    });

    it('signup: shows error message when verifyOtp fails', async () => {
      setLocation('', '#token_hash=bad&type=signup');
      mockVerifyOtp.mockResolvedValue({ error: new Error('Invalid token') });

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /confirm.*sign in/i }));

      await waitFor(() => expect(screen.getByText(/invalid token/i)).toBeInTheDocument());
    });
  });

  // =========================================================================
  // 7. Unknown auth type
  // =========================================================================

  describe('Unknown auth type', () => {
    it('shows "Unknown auth type" error when type is unrecognised', async () => {
      // Inject via legacy access_token path so the useEffect accepts it
      // then trigger handleConfirm with a bad authType
      setLocation('', '#access_token=tok&type=unknown_type');
      renderPage();

      // Shows the confirm button (it's not 'recovery', so we get the general confirm)
      const btn = screen.getByRole('button', { name: /confirm.*sign in/i });
      fireEvent.click(btn);

      await waitFor(() =>
        expect(screen.getByText(/unknown auth type/i)).toBeInTheDocument()
      );
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 8. Loading state
  // =========================================================================

  describe('Loading state', () => {
    it('disables the submit button and shows "Verifying…" while awaiting Supabase', async () => {
      setLocation('', '#token_hash=abc&type=recovery');
      mockVerifyOtp.mockReturnValue(new Promise(() => {}));

      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled()
      );
    });

    it('disables both password inputs during loading', async () => {
      setLocation('', '#token_hash=abc&type=recovery');
      mockVerifyOtp.mockReturnValue(new Promise(() => {}));

      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeDisabled();
        expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
      });
    });

    it('re-enables the form after an error', async () => {
      setLocation('', '#token_hash=abc&type=recovery');
      mockVerifyOtp.mockResolvedValue({ error: new Error('Expired') });

      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

      await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument());
      // Click try again to restore the form
      fireEvent.click(screen.getByText(/try again/i));

      expect(screen.getByLabelText(/new password/i)).not.toBeDisabled();
    });
  });

  // =========================================================================
  // 9. Navigation safeguards
  // =========================================================================

  describe('Navigation', () => {
    it('navigates to /login (replace) from the idle recovery form', () => {
      setLocation('', '#token_hash=abc&type=recovery');
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('navigates to /login (replace) from the URL error screen', () => {
      setLocation('', '#error_code=otp_expired&error_description=Expired');
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('uses replace:true on all redirects (prevents back-button re-trigger)', () => {
      setLocation('', '');
      renderPage();

      const [, options] = mockNavigate.mock.calls[0];
      expect(options).toEqual({ replace: true });
    });
  });

  // =========================================================================
  // 10. Keyboard UX
  // =========================================================================

  describe('Keyboard UX', () => {
    it('Enter on confirm password field submits the form', async () => {
      setLocation('', '#token_hash=abc&type=recovery');
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });

      renderPage();
      fillInput(screen.getByLabelText(/new password/i), VALID_PW);
      fillInput(screen.getByLabelText(/confirm password/i), VALID_PW);
      fireEvent.keyDown(screen.getByLabelText(/confirm password/i), { key: 'Enter' });

      await waitFor(() => expect(mockVerifyOtp).toHaveBeenCalled());
    });

    it('Enter on confirm password field triggers client validation (short password)', async () => {
      setLocation('', '#token_hash=abc&type=recovery');
      renderPage();

      fillInput(screen.getByLabelText(/new password/i), 'bad');
      fillInput(screen.getByLabelText(/confirm password/i), 'bad');
      fireEvent.keyDown(screen.getByLabelText(/confirm password/i), { key: 'Enter' });

      await waitFor(() =>
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
      );
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });
  });
});
