import { Sidebar } from '@/components/layout/sidebar';
import { AdminHeader } from '@/components/ui/admin-header';
import * as AppHooks from '@/hooks/use-app';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Lucide icons to avoid render issues (optional but safer)
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    // Mock specific icons used if needed, or rely on actual
  };
});

// Mock Supabase
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: (...args: any[]) => mockGetUser(...args),

      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signOut: vi.fn(),
    },

    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Mock useApp
const mockUseApp = {
  currentApp: { app_id: 'test-app', display_name: 'Test App' },
  setCurrentApp: vi.fn(),
  apps: [{ app_id: 'test-app', display_name: 'Test App' }],
  isLoading: false,
  isSidebarCollapsed: false,
  toggleSidebar: vi.fn(),
  isSuperAdmin: true,
};

vi.spyOn(AppHooks, 'useApp').mockReturnValue(mockUseApp as any);

describe('UI Resilience & Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default Auth Success
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
    });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'super_admin', full_name: 'Test Admin', email: 'test@example.com' },
          }),
        }),
      }),
    });
  });

  // Task 4.2: Verify AdminHeader renders back button correctly
  it('should render back button in AdminHeader when backTo prop is provided', () => {
    render(
      <MemoryRouter>
        <AdminHeader title="Test Page" backTo="/dashboard" />
      </MemoryRouter>
    );

    const backLink = screen.getByRole('link', { name: /go back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/dashboard');
  });

  it('should NOT render back button in AdminHeader when backTo is missing', () => {
    render(
      <MemoryRouter>
        <AdminHeader title="Test Page" />
      </MemoryRouter>
    );

    const backLink = screen.queryByRole('link', { name: /go back/i });
    expect(backLink).not.toBeInTheDocument();
  });

  // Task 4.3: Verify Sidebar highlights active route
  it('should highlight active route in Sidebar', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    );

    // Sidebar renders navigation items.
    // Dashboard is one of them.
    // We need to wait for sidebar to load profile (async effect)
    // expected: "text-white" or "bg-purple-500/15" class on active link.

    const dashboardLink = await screen.findByText('Dashboard');
    // Parent 'a' or 'link' should have active class
    const linkElement = dashboardLink.closest('a');
    expect(linkElement).toHaveClass('bg-purple-500/15'); // based on source code: isActive ? 'bg-purple-500/15 ...'
  });

  it('should handle missing session gracefully in Sidebar (Simulate 4.1 equivalent)', async () => {
    // Simulate no user
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Should not crash.
    // userInfo state will be null.
    // Sidebar footer shows "Sign Out" button (generic) instead of profile.

    // Wait for effect
    const signOutBtn = await screen.findByText('Sign Out');
    expect(signOutBtn).toBeInTheDocument();
    // Should NOT show user initials
    expect(screen.queryByTitle('test@example.com')).not.toBeInTheDocument();
  });
});
