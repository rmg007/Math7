import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SessionsPage } from '../SessionsPage';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockOrder = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnValue({
    order: mockOrder,
  });
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
  });

  return {
    supabase: {
      from: mockFrom,
    },
  };
});

describe('SessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Return a promise that never resolves for long-term loading state test
    (supabase.from as any)().select().order().limit = vi
      .fn()
      .mockReturnValue(new Promise(() => {}));
    render(<SessionsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders sessions and summary metrics after loading', async () => {
    const mockSessions = [
      {
        id: '1',
        created_at: '2026-01-01T10:00:00Z',
        model_used: 'gemini-1.5-flash',
        token_count: 1000,
        questions_generated: 10,
        questions_imported: 8,
        generation_time_ms: 10000,
        status: 'approved',
      },
      {
        id: '2',
        created_at: '2026-01-01T11:00:00Z',
        model_used: 'gemini-1.5-flash',
        token_count: 500,
        questions_generated: 5,
        questions_imported: 5,
        generation_time_ms: 5000,
        status: 'imported',
      },
    ];

    (supabase.from as any)().select().order().limit = vi
      .fn()
      .mockResolvedValue({ data: mockSessions, error: null });

    render(<SessionsPage />);

    // Wait for removal of loader by checking for content
    await screen.findByText('15');

    // totalQuestionsGenerated = 10 + 5 = 15
    expect(screen.getByText('15')).toBeInTheDocument();

    // Import rate check
    expect(screen.getByText('86.7%')).toBeInTheDocument();

    // Table content check
    expect(screen.getAllByText(/gemini-1.5-flash/i).length).toBeGreaterThan(0);
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (supabase.from as any)().select().order().limit = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error('Network Error') });

    render(<SessionsPage />);

    await screen.findByText(/Error Loading Sessions/i);

    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });
});
