import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from './LoginPage';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

vi.mock('@/services/SecurityLogger', () => ({
  SecurityLogger: {
    log: vi.fn(),
    logLogin: vi.fn(),
  },
}));

// Mock icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Eye: () => <div data-testid="eye-icon" />,
    EyeOff: () => <div data-testid="eye-off-icon" />,
    Rocket: () => <div />,
    Loader2: () => <div />,
    AlertCircle: () => <div />,
  };
});

describe('LoginPage Password Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles password visibility in login form', () => {
    render(<LoginPage />);

    // Check initial state (Login Form)
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput.getAttribute('type')).toBe('password');

    // Find toggle button
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    // Click to show
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('text');
    expect(screen.getByTestId('eye-off-icon')).toBeTruthy();
    
    // Click to hide
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('password');
    expect(screen.getByTestId('eye-icon')).toBeTruthy();
  });

  it('toggles password visibility in register form', () => {
    render(<LoginPage />);

    // Switch to Register mode
    const registerLink = screen.getByText(/don't have an account\? register/i);
    fireEvent.click(registerLink);

    // Now in Register mode
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput.getAttribute('type')).toBe('password');

    // Find toggle button
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    // Click to show
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('text');
    expect(screen.getByTestId('eye-off-icon')).toBeTruthy();
  });
});
