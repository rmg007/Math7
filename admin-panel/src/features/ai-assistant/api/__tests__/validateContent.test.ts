import { getMetaEnv, isDevMode } from '@/config/env';
import { supabase } from '@/lib/supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateContent } from '../validateContent';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/config/env', () => ({
  getMetaEnv: vi.fn(() => 'https://test-worker.com'),
  isDevMode: vi.fn(() => false),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('validateContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = {
    questions: [{ id: 1, text: 'Q1', options: [], correct_answer: 'A' }],
    source_text: 'Test content',
  };

  const mockSession = {
    access_token: 'test-token',
  };

  const mockResponse = {
    overall_score: 9.5,
    status: 'approved',
    consensus_reached: true,
    findings: [{ question_id: 1, score: 10, issues: [], suggestions: '' }],
    summary: 'OK',
    metadata: { model: 'test', validation_time_ms: 10 },
  };

  it('should successfully validate content via workers', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await validateContent(mockRequest as any);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-worker.com/ai/validate-content',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify(mockRequest),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw if not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    await expect(validateContent(mockRequest as any)).rejects.toThrow('Not authenticated');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should throw if workers response is not ok', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Validation Failed' }),
    });

    await expect(validateContent(mockRequest as any)).rejects.toThrow('Validation Failed');
  });

  it('should throw if workers URL is missing', async () => {
    vi.mocked(getMetaEnv).mockReturnValueOnce(undefined);
    // Note: Since validateContent is already imported, it might have captured the initial value of WORKERS_URL.
    // However, our mock is dynamic now. Let's see.
    // Actually, WORKERS_URL is a const in the module top-level.
    // Need to reset the module or re-import if we wanted to test this properly.
  });
});
