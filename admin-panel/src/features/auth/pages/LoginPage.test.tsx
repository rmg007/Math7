/**
 * LoginPage.test.tsx
 *
 * Comprehensive unit tests for the LoginPage component covering:
 * - Login form: success, wrong credentials, anti-enumeration error message
 * - Forgot password form: success state, empty email validation
 * - Register form: invalid invite code rejection, SecurityLogger calls
 * - Password visibility toggle (login + register)
 * - Session redirect (already logged-in user sent to dashboard)
 *
 * Key testing decisions:
 * - vi.hoisted used for Supabase mock functions (correct hoisting in vi.mock factories)
 * - fireEvent used over userEvent.type (synchronous, avoids JSDOM async quirks with react-hook-form)
 * - SecurityLogger mock validates auth security events are fired
 * - All tests clean up mocks via beforeEach vi.clearAllMocks()
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

// ---------------------------------------------------------------------------
// Mock infrastructure
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const { mockSignInWithPassword, mockSignUp, mockGetSession, mockResetPasswordForEmail, mockRpc } =
  vi.hoisted(() => ({
    mockSignInWithPassword: vi.fn(),
    mockSignUp: vi.fn(),
    mockGetSession: vi.fn(),
    mockResetPasswordForEmail: vi.fn(),
    mockRpc: vi.fn(),
  }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      getSession: mockGetSession,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
    rpc: mockRpc,
  },
}));

const { mockSecurityLog, mockSecurityLogLogin } = vi.hoisted(() => ({
  mockSecurityLog: vi.fn(),
  mockSecurityLogLogin: vi.fn(),
}));

vi.mock('@/services/SecurityLogger', () => ({
  SecurityLogger: {
    log: mockSecurityLog,
    logLogin: mockSecurityLogLogin,
  },
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Eye: () => <div data-testid="eye-icon" />,
    EyeOff: () => <div data-testid="eye-off-icon" />,
    Rocket: () => <div />,
    Loader2: () => <div />,
    AlertCircle: () => <div />,
    CheckCircle2: () => <div />,
    ArrowLeft: () => <div />,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  return render(<LoginPage />);
}

function fillLoginForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: password } });
}

async function switchToRegister() {
  fireEvent.click(screen.getByRole('button', { name: /don't have an account\? register/i }));
  await waitFor(() => screen.getByRole('button', { name: /create account/i }));
}

async function switchToForgotPassword() {
  fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
  await waitFor(() => screen.getByRole('button', { name: /send reset link/i }));
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_EMAIL = 'admin@example.com';
const VALID_PASSWORD = 'ValidPass1!'; // 8+ chars
const FAKE_USER_ID = '00000000-0000-0000-0000-000000000001';

// ===========================================================================
// 1. Initial render / session redirect
// ===========================================================================

describe('LoginPage — Initial render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('renders the sign-in form by default', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('redirects to dashboard if user already has an active session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: FAKE_USER_ID } } },
    });
    renderPage();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('does NOT redirect if session is null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderPage();
    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
  });
});

// ===========================================================================
// 2. Login form — success path
// ===========================================================================

describe('LoginPage — Login success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSecurityLog.mockResolvedValue(undefined);
    mockSecurityLogLogin.mockResolvedValue(undefined);
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: FAKE_USER_ID }, session: {} },
      error: null,
    });
  });

  it('calls signInWithPassword with the submitted email and password', async () => {
    renderPage();
    fillLoginForm(VALID_EMAIL, VALID_PASSWORD);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    );
  });

  it('calls SecurityLogger.logLogin on successful sign-in', async () => {
    renderPage();
    fillLoginForm(VALID_EMAIL, VALID_PASSWORD);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockSecurityLogLogin).toHaveBeenCalledWith(FAKE_USER_ID));
  });

  it('navigates to "/" on successful sign-in', async () => {
    renderPage();
    fillLoginForm(VALID_EMAIL, VALID_PASSWORD);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('does NOT call SecurityLogger.log(failed_login) on success', async () => {
    renderPage();
    fillLoginForm(VALID_EMAIL, VALID_PASSWORD);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockSecurityLogLogin).toHaveBeenCalled());
    const failedLoginCalls = mockSecurityLog.mock.calls.filter(
      ([payload]: [{ eventType: string }]) => payload?.eventType === 'failed_login'
    );
    expect(failedLoginCalls).toHaveLength(0);
  });
});

// ===========================================================================
// 3. Login form — failure paths (anti-enumeration)
// ===========================================================================

describe('LoginPage — Login failure & anti-enumeration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSecurityLog.mockResolvedValue(undefined);
  });

  it('shows error message on wrong credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });
    renderPage();
    fillLoginForm(VALID_EMAIL, 'WrongPass1!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
    );
  });

  it('calls SecurityLogger.log with eventType=failed_login on auth failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });
    renderPage();
    fillLoginForm(VALID_EMAIL, 'WrongPass1!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(mockSecurityLog).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'failed_login' })
      )
    );
  });

  it('does NOT navigate on auth failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });
    renderPage();
    fillLoginForm(VALID_EMAIL, 'WrongPass1!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('rejects password shorter than 8 characters (client-side Zod)', async () => {
    renderPage();
    fillLoginForm(VALID_EMAIL, 'short');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    );
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('rejects invalid email format (client-side Zod)', async () => {
    renderPage();
    // Use a value that lacks domain — Zod z.string().email() will reject it,
    // browser native validation on type="email" is bypassed in JSDOM.
    // We submit the form directly to ensure react-hook-form runs its resolver.
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'notanemail' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: VALID_PASSWORD },
    });
    // Use submit event on the form element directly — fireEvent.click on a submit button
    // does NOT trigger form.onSubmit in JSDOM; fireEvent.submit(form) does.
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    if (!form) throw new Error('Login form not found in DOM');
    fireEvent.submit(form);

    await waitFor(() =>
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    );
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 4. Forgot password form
// ===========================================================================

describe('LoginPage — Forgot password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('shows the forgot password form when "Forgot password?" is clicked', async () => {
    renderPage();
    await switchToForgotPassword();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('calls resetPasswordForEmail with the entered email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    renderPage();
    await switchToForgotPassword();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: VALID_EMAIL },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        VALID_EMAIL,
        expect.objectContaining({ redirectTo: 'https://admin.questerix.com/auth/confirm' })
      )
    );
  });

  it('always redirects to production /auth/confirm (not window.location.origin)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    renderPage();
    await switchToForgotPassword();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: VALID_EMAIL } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => expect(mockResetPasswordForEmail).toHaveBeenCalled());
    const [, options] = mockResetPasswordForEmail.mock.calls[0];
    expect(options.redirectTo).toBe('https://admin.questerix.com/auth/confirm');
    expect(options.redirectTo).not.toContain('localhost');
  });

  it('shows generic success state after reset email is sent (anti-enumeration)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    renderPage();
    await switchToForgotPassword();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'unknown@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    );
    // Generic success — no indication whether email exists or not
    expect(screen.queryByText(/email not found/i)).not.toBeInTheDocument();
  });

  it('shows error if email field is empty', async () => {
    renderPage();
    await switchToForgotPassword();

    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/please enter your email/i)).toBeInTheDocument()
    );
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('shows Supabase error if resetPasswordForEmail returns an error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: new Error('Rate limit exceeded') });
    renderPage();
    await switchToForgotPassword();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: VALID_EMAIL } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument()
    );
  });

  it('returns to login when "Back to Sign In" is clicked', async () => {
    renderPage();
    await switchToForgotPassword();

    fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    );
  });
});

// ===========================================================================
// 5. Register form — invitation code flow
// ===========================================================================

describe('LoginPage — Register with invitation code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSecurityLog.mockResolvedValue(undefined);
  });

  it('switches to registration form when "Register" is clicked', async () => {
    renderPage();
    await switchToRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/invitation code/i)).toBeInTheDocument();
  });

  it('rejects invalid invitation code and calls SecurityLogger.log(failed_register_invite)', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    renderPage();
    await switchToRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: VALID_EMAIL } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: VALID_PASSWORD } });
    fireEvent.change(screen.getByLabelText(/invitation code/i), {
      target: { value: 'INVALID-CODE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid or expired invitation code/i)).toBeInTheDocument()
    );
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(mockSecurityLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'failed_register_invite' })
    );
  });

  it('calls validate_invitation_code RPC before attempting sign-up', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    renderPage();
    await switchToRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: VALID_EMAIL } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: VALID_PASSWORD } });
    fireEvent.change(screen.getByLabelText(/invitation code/i), { target: { value: 'BAD-CODE' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    // validate_invitation_code must be first RPC call
    expect(mockRpc.mock.calls[0][0]).toBe('validate_invitation_code');
  });

  it('proceeds to signUp only when invitation code is valid', async () => {
    // Step 1: validate returns true
    // Step 2: signUp succeeds
    // Step 3: validate_and_use returns true
    mockRpc
      .mockResolvedValueOnce({ data: true, error: null }) // validate_invitation_code
      .mockResolvedValueOnce({ data: true, error: null }); // validate_and_use_invitation_code
    mockSignUp.mockResolvedValue({
      data: { user: { id: FAKE_USER_ID } },
      error: null,
    });
    renderPage();
    await switchToRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: VALID_EMAIL } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: VALID_PASSWORD } });
    fireEvent.change(screen.getByLabelText(/invitation code/i), {
      target: { value: 'VALID-CODE-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
  });

  it('shows error when signUp fails after valid code', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: new Error('Email already registered'),
    });
    renderPage();
    await switchToRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: VALID_EMAIL } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: VALID_PASSWORD } });
    fireEvent.change(screen.getByLabelText(/invitation code/i), {
      target: { value: 'VALID-CODE-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
    );
    expect(mockSecurityLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'failed_register' })
    );
  });

  it('shows error when validate_and_use_invitation_code fails (Step 3 fragile point)', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: true, error: null }) // validate_invitation_code passes
      .mockResolvedValueOnce({ data: false, error: null }); // validate_and_use fails
    mockSignUp.mockResolvedValue({
      data: { user: { id: FAKE_USER_ID } },
      error: null,
    });
    mockSecurityLog.mockResolvedValue(undefined);
    renderPage();
    await switchToRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: VALID_EMAIL } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: VALID_PASSWORD } });
    fireEvent.change(screen.getByLabelText(/invitation code/i), {
      target: { value: 'RACED-CODE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/failed to use invitation code/i)).toBeInTheDocument()
    );
    expect(mockSecurityLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'failed_register_consume' })
    );
  });

  it('does not call signUp if password is too short (< 8 chars)', async () => {
    renderPage();
    await switchToRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: VALID_EMAIL } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/invitation code/i), {
      target: { value: 'SOME-CODE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    );
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 6. Password visibility toggle (existing — updated to match new labelIds)
// ===========================================================================

describe('LoginPage — Password visibility toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('toggles password visibility in login form', () => {
    renderPage();
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput.getAttribute('type')).toBe('password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('toggles password visibility in register form', async () => {
    renderPage();
    await switchToRegister();

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput.getAttribute('type')).toBe('password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('text');
  });
});
