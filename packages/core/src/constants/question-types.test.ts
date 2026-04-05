import { describe, it, expect } from 'vitest';
import { normalizeQuestionType, CANONICAL_QUESTION_TYPES, QUESTION_TYPE_ALIASES } from './question-types';

describe('normalizeQuestionType', () => {
  it('should return canonical types unchanged', () => {
    CANONICAL_QUESTION_TYPES.forEach(type => {
      expect(normalizeQuestionType(type)).toBe(type);
    });
  });

  it('should normalize mcq to multiple_choice', () => {
    expect(normalizeQuestionType('mcq')).toBe('multiple_choice');
    expect(normalizeQuestionType('MCQ')).toBe('multiple_choice');
    expect(normalizeQuestionType('Mcq')).toBe('multiple_choice');
  });

  it('should normalize all aliases correctly', () => {
    expect(normalizeQuestionType('single_choice')).toBe('multiple_choice');
    expect(normalizeQuestionType('radio')).toBe('multiple_choice');
    expect(normalizeQuestionType('multi_select')).toBe('mcq_multi');
    expect(normalizeQuestionType('multiple_select')).toBe('mcq_multi');
    expect(normalizeQuestionType('select_all_that_apply')).toBe('mcq_multi');
    expect(normalizeQuestionType('true_false')).toBe('boolean');
    expect(normalizeQuestionType('tf')).toBe('boolean');
    expect(normalizeQuestionType('short_answer')).toBe('text_input');
    expect(normalizeQuestionType('fill_in_blank')).toBe('text_input');
    expect(normalizeQuestionType('fill_blank')).toBe('text_input');
    expect(normalizeQuestionType('reorder')).toBe('reorder_steps');
    expect(normalizeQuestionType('ordering')).toBe('reorder_steps');
    expect(normalizeQuestionType('sequence')).toBe('reorder_steps');
  });

  it('should handle case-insensitive input', () => {
    expect(normalizeQuestionType('MCQ')).toBe('multiple_choice');
    expect(normalizeQuestionType('Short_Answer')).toBe('text_input');
    expect(normalizeQuestionType('TRUE_FALSE')).toBe('boolean');
  });

  it('should handle spaces in input', () => {
    expect(normalizeQuestionType('fill in blank')).toBe('text_input');
    expect(normalizeQuestionType('multiple select')).toBe('mcq_multi');
  });

  it('should return null for unknown types', () => {
    expect(normalizeQuestionType('unknown_type')).toBeNull();
    expect(normalizeQuestionType('invalid')).toBeNull();
    expect(normalizeQuestionType('')).toBeNull();
  });

  it('should handle edge cases', () => {
    expect(normalizeQuestionType('  mcq  ')).toBeNull(); // Trimming not implemented
    expect(normalizeQuestionType('multiple_choice_extra')).toBeNull();
  });
});

describe('CANONICAL_QUESTION_TYPES', () => {
  it('should contain exactly 6 types', () => {
    expect(CANONICAL_QUESTION_TYPES).toHaveLength(6);
  });

  it('should match database enum', () => {
    const expected = [
      'multiple_choice',
      'mcq_multi',
      'text_input',
      'boolean',
      'reorder_steps',
      'matching',
    ];
    expect(CANONICAL_QUESTION_TYPES).toEqual(expected);
  });
});

describe('QUESTION_TYPE_ALIASES', () => {
  it('should map all aliases to canonical types', () => {
    Object.entries(QUESTION_TYPE_ALIASES).forEach(([alias, canonical]) => {
      expect(CANONICAL_QUESTION_TYPES).toContain(canonical);
    });
  });

  it('should have mcq as the primary legacy alias', () => {
    expect(QUESTION_TYPE_ALIASES.mcq).toBe('multiple_choice');
  });
});
