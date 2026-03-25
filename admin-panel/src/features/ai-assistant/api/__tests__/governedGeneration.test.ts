import { supabase } from '@/lib/supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateQuestions } from '../generateQuestions';
import { governedGenerateQuestions } from '../governedGeneration';
import { validateContent } from '../validateContent';

vi.mock('../generateQuestions', () => ({
  generateQuestions: vi.fn(),
}));

vi.mock('../validateContent', () => ({
  validateContent: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('governedGenerateQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppId = 'app-123';
  const mockRequest = {
    text: 'Test content',
    difficulty_distribution: { easy: 1, medium: 0, hard: 0 },
  };

  const mockUser = { id: 'user-123' };

  const mockGenerationResponse = {
    questions: [
      {
        text: 'Q1',
        question_type: 'multiple_choice' as const,
        difficulty: 'easy' as const,
        metadata: {},
      },
    ],
    metadata: {
      model: '@cf/meta/llama-3.1-8b-instruct',
      subject_type: 'general',
      generation_time_ms: 100,
      token_count: 500,
      questions_generated: 1,
    },
  };

  const mockValidationResponse = {
    status: 'approved',
    overall_score: 9.5,
    consensus_reached: true,
    findings: [{ question_id: 1, score: 10, issues: [], suggestions: '' }],
    summary: '',
    metadata: { model: 'gemini-1.5-flash', validation_time_ms: 50 },
  };

  it('should successfully orchestrate governed generation', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    } as Awaited<ReturnType<typeof supabase.rpc>>);
    vi.mocked(generateQuestions).mockResolvedValue(mockGenerationResponse);
    vi.mocked(validateContent).mockResolvedValue({
      status: 'approved',
      overall_score: 9.5,
      consensus_reached: true,
      findings: [{ question_id: 1, score: 10, issues: [], suggestions: '' }],
      summary: '',
      metadata: { model: 'gemini-1.5-flash', validation_time_ms: 50 },
    } as Awaited<ReturnType<typeof validateContent>>);

    const result = await governedGenerateQuestions(mockAppId, mockRequest);

    // Initial quota check
    expect(supabase.rpc).toHaveBeenCalledWith('consume_tenant_tokens', {
      p_app_id: mockAppId,
      p_tokens_used: 0,
      p_operation: 'pre_check',
    });

    // Content generation
    expect(generateQuestions).toHaveBeenCalledWith(mockRequest);

    // Dynamic validation
    expect(validateContent).toHaveBeenCalledWith({
      questions: mockGenerationResponse.questions,
      source_text: mockRequest.text,
    });

    // Final token consumption
    expect(supabase.rpc).toHaveBeenLastCalledWith('consume_tenant_tokens', {
      p_app_id: mockAppId,
      p_tokens_used: expect.any(Number),
      p_operation: 'generate_questions',
    });

    expect(result.questions).toEqual(mockGenerationResponse.questions);
    expect(result.validation).toEqual(mockValidationResponse);
  });

  it('should throw if initial quota check fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Quota exceeded', code: 'P0001' } as unknown,
      count: null,
      status: 400,
      statusText: 'Bad Request',
    } as Awaited<ReturnType<typeof supabase.rpc>>);

    await expect(governedGenerateQuestions(mockAppId, mockRequest)).rejects.toThrow(
      'Quota exceeded'
    );

    expect(generateQuestions).not.toHaveBeenCalled();
  });
});
