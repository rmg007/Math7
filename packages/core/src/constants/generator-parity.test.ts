import { describe, it, expect } from 'vitest';
import { AIQuestionSchema, CANONICAL_QUESTION_TYPES, normalizeQuestionType } from './question-types';

/**
 * GENERATOR PARITY CONTRACT
 * These tests represent the "Source of Truth" for how both the 
 * Supabase Edge Function and the Cloudflare Worker MUST behave.
 * 
 * If these tests pass, any implementation using these constants 
 * will be immune to the 'mcq' vs 'multiple_choice' mismatch.
 */
describe('Generator Parity Contract', () => {
  const mockRawAIResponses = [
    {
      name: 'Legacy MCQ',
      raw: { text: 'Test?', question_type: 'mcq', difficulty: 'easy', metadata: { options: ['A', 'B'], correct_answer: 'A' } },
      expected: 'multiple_choice'
    },
    {
      name: 'Short Answer Alias',
      raw: { text: 'Name?', question_type: 'short_answer', difficulty: 'medium', metadata: { correct_answer: 'Halim' } },
      expected: 'text_input'
    },
    {
      name: 'True/False Alias',
      raw: { text: 'Is AI good?', question_type: 'true_false', difficulty: 'hard', metadata: { correct_answer: 'true' } },
      expected: 'boolean'
    },
    {
      name: 'Ordering Alias',
      raw: { text: 'Order these', question_type: 'ordering', difficulty: 'medium', metadata: { options: ['1', '2'] } },
      expected: 'reorder_steps'
    }
  ];

  it('should normalize all legacy aliases to canonical types', () => {
    mockRawAIResponses.forEach(({ name, raw, expected }) => {
      const normalized = normalizeQuestionType(raw.question_type);
      expect(normalized, `Failed on: ${name}`).toBe(expected);
    });
  });

  it('should pass Zod validation after normalization (Layer 3)', () => {
    mockRawAIResponses.forEach(({ raw }) => {
      // This mimics what Zod preprocessing does in both apps
      const result = AIQuestionSchema.safeParse(raw);
      expect(result.success, `Zod validation failed for: ${raw.question_type}`).toBe(true);
      if (result.success) {
        expect(CANONICAL_QUESTION_TYPES).toContain(result.data.question_type);
        // Ensure it's not the raw value anymore
        expect(result.data.question_type).not.toBe(raw.question_type);
      }
    });
  });

  it('should handle malformed spaces and casing', () => {
    expect(normalizeQuestionType(' Multiple Choice ')).toBe('multiple_choice');
    expect(normalizeQuestionType('MCQ')).toBe('multiple_choice');
    expect(normalizeQuestionType('reorder steps')).toBe('reorder_steps');
  });

  it('should return null for completely unknown types', () => {
    expect(normalizeQuestionType('unknown_future_type')).toBeNull();
  });
});
