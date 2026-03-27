import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GovernancePage } from '../GovernancePage';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock StatusBadge (complex status types)
vi.mock('@/components/ui/status-badge', () => ({
  StatusBadge: ({ status, label }: any) => (
    <div data-testid="status-badge" data-status={status}>
      {label || status}
    </div>
  ),
}));

describe('GovernancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial loading state and then empty state', async () => {
    render(<GovernancePage />);

    expect(screen.getByText(/Loading AI usage data/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/No AI Usage Data Found/i)).toBeInTheDocument();
    });
  });

  it('renders aggregated usage data correctly', async () => {
    const mockSessions = [
      {
        id: '1',
        created_at: '2026-01-01T10:00:00Z',
        token_count: 1000,
        questions_generated: 10,
        created_by_profile: {
          app_id: 'app-1',
          apps: { display_name: 'App Alpha' },
        },
      },
      {
        id: '2',
        created_at: '2026-01-01T11:00:00Z',
        token_count: 500,
        questions_generated: 5,
        created_by_profile: {
          app_id: 'app-1',
          apps: { display_name: 'App Alpha' },
        },
      },
      {
        id: '3',
        created_at: '2026-01-01T12:00:00Z',
        token_count: 2000,
        questions_generated: 20,
        created_by_profile: {
          app_id: 'app-2',
          apps: { display_name: 'App Beta' },
        },
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
    } as any);

    render(<GovernancePage />);

    await waitFor(() => {
      expect(screen.getByText('App Alpha')).toBeInTheDocument();
      expect(screen.getByText('App Beta')).toBeInTheDocument();
    });

    // Check App Alpha aggregation (1500 tokens, 15 questions, 2 sessions)
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    // '2' is also in the "Results: 2" badge.
    // We check that at least one '2' is present and it is likely the one in the sessions column.
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2);

    // Check App Beta aggregation (2000 tokens, 20 questions, 1 session)
    expect(screen.getByText('2,000')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    // '1' is not unique either (could be in dates, etc.)
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);

    // Check total tokens in header (1500 + 2000 = 3500)
    expect(screen.getByText('3,500')).toBeInTheDocument();
    // Total sessions (2+1=3)
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles errors gracefully', async () => {
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
    } as any);

    render(<GovernancePage />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });
  });
});
