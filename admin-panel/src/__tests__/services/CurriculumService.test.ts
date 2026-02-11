import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurriculumService, ImportResult } from '@/services/CurriculumService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock validation schema
vi.mock('@/lib/validation/import-schema', () => ({
  QueuedQuestionSchema: {
    safeParse: vi.fn(),
  },
}));

describe('CurriculumService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('importQuestionsBulk', () => {
    const mockValidQuestion = {
      type: 'multiple_choice',
      content: 'Test question',
      options: [
        { text: 'Option A', is_correct: true },
        { text: 'Option B', is_correct: false },
      ],
      points: 1,
      is_published: true,
      skill_id: 'test-skill-id',
    };

    it('should return success for valid questions in dry run mode', async () => {
      const { QueuedQuestionSchema } = await import('@/lib/validation/import-schema');
      vi.mocked(QueuedQuestionSchema.safeParse).mockReturnValue({
        success: true,
        data: mockValidQuestion,
      });

      const result = await CurriculumService.importQuestionsBulk(
        [mockValidQuestion],
        { dryRun: true }
      );

      expect(result).toEqual({
        success: true,
        count: 1,
        isDryRun: true,
      });
    });

    it('should validate all questions before processing', async () => {
      const { QueuedQuestionSchema } = await import('@/lib/validation/import-schema');
      vi.mocked(QueuedQuestionSchema.safeParse)
        .mockReturnValueOnce({
          success: true,
          data: mockValidQuestion,
        })
        .mockReturnValueOnce({
          success: false,
          error: {
            errors: [{ path: ['content'], message: 'Content is required' }],
          },
        });

      const result = await CurriculumService.importQuestionsBulk([
        mockValidQuestion,
        { invalid: 'question' },
      ]);

      expect(result).toEqual({
        success: false,
        count: 0,
        error: 'Row 2 validation failed: content: Content is required',
      });
    });

    it('should handle empty array successfully', async () => {
      const result = await CurriculumService.importQuestionsBulk([]);
      expect(result).toEqual({
        success: true,
        count: 0,
      });
    });

    it('should batch questions when count exceeds batch size', async () => {
      const { QueuedQuestionSchema } = await import('@/lib/validation/import-schema');
      vi.mocked(QueuedQuestionSchema.safeParse).mockReturnValue({
        success: true,
        data: mockValidQuestion,
      });

      const mockRpcResponse = [
        { success: true, inserted_count: 2 },
        { success: true, inserted_count: 1 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });

      // Create 3 questions with batch size of 2
      const questions = [mockValidQuestion, mockValidQuestion, mockValidQuestion];
      const result = await CurriculumService.importQuestionsBulk(questions, {
        batchSize: 2,
      });

      expect(supabase.rpc).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        count: 3,
      });
    });

    it('should handle RPC errors gracefully', async () => {
      const { QueuedQuestionSchema } = await import('@/lib/validation/import-schema');
      vi.mocked(QueuedQuestionSchema.safeParse).mockReturnValue({
        success: true,
        data: mockValidQuestion,
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database constraint violation' },
      });

      const result = await CurriculumService.importQuestionsBulk([mockValidQuestion]);

      expect(result).toEqual({
        success: false,
        count: 0,
        error: 'Batch 1 failed: Database constraint violation. 0 rows were previously inserted.',
      });
    });

    it('should handle database rejection', async () => {
      const { QueuedQuestionSchema } = await import('@/lib/validation/import-schema');
      vi.mocked(QueuedQuestionSchema.safeParse).mockReturnValue({
        success: true,
        data: mockValidQuestion,
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [{ success: false, inserted_count: 0 }],
        error: null,
      });

      const result = await CurriculumService.importQuestionsBulk([mockValidQuestion]);

      expect(result).toEqual({
        success: false,
        count: 0,
        error: 'Batch 1 rejected by database. 0 rows were previously inserted.',
      });
    });

    it('should handle partial batch failures', async () => {
      const { QueuedQuestionSchema } = await import('@/lib/validation/import-schema');
      vi.mocked(QueuedQuestionSchema.safeParse).mockReturnValue({
        success: true,
        data: mockValidQuestion,
      });

      // First batch succeeds, second fails
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: [{ success: true, inserted_count: 2 }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Connection timeout' },
        });

      const questions = [
        mockValidQuestion,
        mockValidQuestion,
        mockValidQuestion,
        mockValidQuestion,
      ];
      const result = await CurriculumService.importQuestionsBulk(questions, {
        batchSize: 2,
      });

      expect(result).toEqual({
        success: false,
        count: 2,
        error: 'Batch 2 failed: Connection timeout. 2 rows were previously inserted.',
      });
    });

    it('should handle unexpected errors', async () => {
      const { QueuedQuestionSchema } = await import('@/lib/validation/import-schema');
      vi.mocked(QueuedQuestionSchema.safeParse).mockImplementation(() => {
        throw new Error('Unexpected validation error');
      });

      const result = await CurriculumService.importQuestionsBulk([mockValidQuestion]);

      expect(result).toEqual({
        success: false,
        count: 0,
        error: 'Unexpected validation error',
      });
    });

    it('should use default batch size of 50', async () => {
      const { QueuedQuestionSchema } = await import('@/lib/validation/import-schema');
      vi.mocked(QueuedQuestionSchema.safeParse).mockReturnValue({
        success: true,
        data: mockValidQuestion,
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [{ success: true, inserted_count: 60 }],
        error: null,
      });

      // Create 60 questions (should be 2 batches with default size 50)
      const questions = Array(60).fill(mockValidQuestion);
      await CurriculumService.importQuestionsBulk(questions);

      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });
  });
});
