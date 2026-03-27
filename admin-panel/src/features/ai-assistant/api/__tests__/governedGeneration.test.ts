import { supabase } from '@/lib/supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateQuestions } from '../generateQuestions';
import { validateContent } from '../validateContent';
import { governedGenerateQuestions } from '../governedGeneration';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        then: vi.fn((onFulfilled) =>
          Promise.resolve({ data: null, error: null }).then(onFulfilled)
        ),
      })),
    })),
  },
}));

vi.mock('../generateQuestions', () => ({
  generateQuestions: vi.fn(),
}));

vi.mock('../validateContent', () => ({
  validateContent: vi.fn(),
}));

describe('governedGenerateQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppId = 'test-app-id';
  const mockRequest = {
    text: 'Test content',
    difficulty_distribution: { easy: 1, medium: 0, hard: 0 },
  };

  const mockUser = { id: 'user-123' };

  const mockGenerationResult = {
    questions: [{ text: 'Q1', question_type: 'multiple_choice', difficulty: 'easy', metadata: {} }],
    metadata: { model: 'gemini-1.5-flash', generation_time_ms: 100, token_count: 50 },
  };

  const mockValidationResult = {
    overall_score: 9.0,
    status: 'approved',
    findings: [{ question_id: 1, issues: [] }],
  };

  it('should successfully orchestrate generation, validation, and token consumption', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    vi.mocked(supabase.rpc).mockResolvedValue({ data: { success: true }, error: null });
    vi.mocked(generateQuestions).mockResolvedValue(mockGenerationResult as any);
    vi.mocked(validateContent).mockResolvedValue(mockValidationResult as any);

    const result = await governedGenerateQuestions(mockAppId, mockRequest as any);

    // Initial quota check (pre_check)
    expect(supabase.rpc).toHaveBeenCalledWith('consume_tenant_tokens', {
      p_app_id: mockAppId,
      p_tokens_used: 0,
      p_operation: 'pre_check',
    });

    // Content generation
    expect(generateQuestions).toHaveBeenCalledWith(mockRequest);

    // Content validation
    expect(validateContent).toHaveBeenCalledWith({
      questions: mockGenerationResult.questions,
      source_text: mockRequest.text,
    });

    // Final token consumption
    expect(supabase.rpc).toHaveBeenCalledWith(
      'consume_tenant_tokens',
      expect.objectContaining({
        p_app_id: mockAppId,
        p_operation: 'generate_questions',
      })
    );

    // Telemetry session recording
    expect(supabase.from).toHaveBeenCalledWith('ai_generation_sessions');

    expect(result.validation).toEqual(mockValidationResult);
    expect(result.questions).toEqual(mockGenerationResult.questions);
  });

  it('should throw unauthorized if no user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(governedGenerateQuestions(mockAppId, mockRequest as any)).rejects.toThrow(
      'Unauthorized'
    );
  });

  it('should throw if quota pre-check fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Quota exceeded', code: 'P0001' } as any,
    });

    await expect(governedGenerateQuestions(mockAppId, mockRequest as any)).rejects.toThrow(
      'Quota exceeded'
    );
  });

  it('should handle final token consumption failure gracefully (throttled)', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: { success: true }, error: null }); // Pre-check
    vi.mocked(generateQuestions).mockResolvedValue(mockGenerationResult as any);
    vi.mocked(validateContent).mockResolvedValue(mockValidationResult as any);

    // Final consumption fails
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Quota limit hit', code: 'P0002' } as any,
    });

    const result = await governedGenerateQuestions(mockAppId, mockRequest as any);

    expect(result.governance.throttled).toBe(true);
    expect(result.quotaError).toBe('Quota limit hit');
  });
});
