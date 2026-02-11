import {
    BooleanSchema,
    McqMultiSchema,
    MultipleChoiceSchema,
    QueuedQuestionSchema,
    ReorderSchema,
    TextInputSchema,
    type QueuedQuestion,
} from '@/lib/validation/import-schema';
import { describe, expect, it } from 'vitest';

describe('import-schema validation', () => {
  const validSkillId = '123e4567-e89b-12d3-a456-426614174000';

  describe('BaseQuestionSchema validation', () => {
    it('should validate required base fields', () => {
      const validBase = {
        skill_id: validSkillId,
        content: 'Test question content',
        points: 10,
        is_published: true,
      };

      const result = QueuedQuestionSchema.safeParse({
        ...validBase,
        type: 'multiple_choice',
        options: [
          { text: 'Option 1', is_correct: true },
          { text: 'Option 2', is_correct: false },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid skill_id format', () => {
      const invalid = {
        skill_id: 'invalid-uuid',
        content: 'Test question',
        points: 10,
        is_published: true,
        type: 'multiple_choice',
        options: [
          { text: 'Option 1', is_correct: true },
          { text: 'Option 2', is_correct: false },
        ],
      };

      const result = QueuedQuestionSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid skill_id format (must be UUID)');
      }
    });

    it('should reject empty content', () => {
      const invalid = {
        skill_id: validSkillId,
        content: '',
        points: 10,
        is_published: true,
        type: 'multiple_choice',
        options: [
          { text: 'Option 1', is_correct: true },
          { text: 'Option 2', is_correct: false },
        ],
      };

      const result = QueuedQuestionSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Content is required');
      }
    });

    it('should reject negative points', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Test question',
        points: -5,
        is_published: true,
        type: 'multiple_choice',
        options: [
          { text: 'Option 1', is_correct: true },
          { text: 'Option 2', is_correct: false },
        ],
      };

      const result = QueuedQuestionSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Points must be a non-negative integer');
      }
    });

    it('should accept zero points', () => {
      const valid = {
        skill_id: validSkillId,
        content: 'Test question',
        points: 0,
        is_published: true,
        type: 'multiple_choice',
        options: [
          { text: 'Option 1', is_correct: true },
          { text: 'Option 2', is_correct: false },
        ],
      };

      const result = QueuedQuestionSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });
  });

  describe('MultipleChoiceSchema', () => {
    it('should validate valid multiple choice question', () => {
      const valid = {
        skill_id: validSkillId,
        content: 'What is 2+2?',
        points: 10,
        is_published: true,
        type: 'multiple_choice' as const,
        options: [
          { text: '4', is_correct: true },
          { text: '5', is_correct: false },
          { text: '3', is_correct: false },
        ],
      };

      const result = MultipleChoiceSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should require at least 2 options', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Test question',
        points: 10,
        is_published: true,
        type: 'multiple_choice' as const,
        options: [
          { text: 'Only option', is_correct: true },
        ],
      };

      const result = MultipleChoiceSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Multiple choice questions must have at least 2 options');
      }
    });

    it('should reject empty option text', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Test question',
        points: 10,
        is_published: true,
        type: 'multiple_choice' as const,
        options: [
          { text: 'Valid option', is_correct: true },
          { text: '', is_correct: false },
        ],
      };

      const result = MultipleChoiceSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Option text is required');
      }
    });
  });

  describe('McqMultiSchema', () => {
    it('should validate valid MCQ multi question', () => {
      const valid = {
        skill_id: validSkillId,
        content: 'Select all correct answers',
        points: 15,
        is_published: true,
        type: 'mcq_multi' as const,
        options: [
          { text: 'Option 1', is_correct: true },
          { text: 'Option 2', is_correct: true },
          { text: 'Option 3', is_correct: false },
        ],
      };

      const result = McqMultiSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should require at least 2 options for multi-select', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Test multi question',
        points: 10,
        is_published: true,
        type: 'mcq_multi' as const,
        options: [
          { text: 'Single option', is_correct: true },
        ],
      };

      const result = McqMultiSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('MCQ Multi questions must have at least 2 options');
      }
    });
  });

  describe('TextInputSchema', () => {
    it('should validate valid text input question', () => {
      const valid = {
        skill_id: validSkillId,
        content: 'What is the capital of France?',
        points: 20,
        is_published: true,
        type: 'text_input' as const,
        solution: 'Paris',
      };

      const result = TextInputSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should require solution for text input', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Test question',
        points: 10,
        is_published: true,
        type: 'text_input' as const,
        solution: '',
      };

      const result = TextInputSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Solution is required for text input');
      }
    });

    it('should accept null options', () => {
      const valid = {
        skill_id: validSkillId,
        content: 'Test question',
        points: 10,
        is_published: true,
        type: 'text_input' as const,
        solution: 'Answer',
        options: null,
      };

      const result = TextInputSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });
  });

  describe('BooleanSchema', () => {
    it('should validate valid boolean question', () => {
      const valid = {
        skill_id: validSkillId,
        content: 'Is the sky blue?',
        points: 5,
        is_published: true,
        type: 'boolean' as const,
        solution: true,
      };

      const result = BooleanSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should require boolean solution', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Test boolean question',
        points: 10,
        is_published: true,
        type: 'boolean' as const,
        solution: null as any,
      };

      const result = BooleanSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Expected boolean');
      }
    });

    it('should accept false solution', () => {
      const valid = {
        skill_id: validSkillId,
        content: 'Is the earth flat?',
        points: 10,
        is_published: true,
        type: 'boolean' as const,
        solution: false,
      };

      const result = BooleanSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });
  });

  describe('ReorderSchema', () => {
    it('should validate valid reorder question', () => {
      const valid = {
        skill_id: validSkillId,
        content: 'Order these steps',
        points: 25,
        is_published: true,
        type: 'reorder_steps' as const,
        options: ['Step 1', 'Step 2', 'Step 3'],
        solution: ['Step 1', 'Step 2', 'Step 3'],
      };

      const result = ReorderSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should require at least 2 steps for reorder', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Order this single step',
        points: 10,
        is_published: true,
        type: 'reorder_steps' as const,
        options: ['Step 1'],
        solution: ['Step 1'],
      };

      const result = ReorderSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Reorder questions must have at least 2 steps');
      }
    });

    it('should reject empty step strings', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Order these steps',
        points: 10,
        is_published: true,
        type: 'reorder_steps' as const,
        options: ['Step 1', '', 'Step 3'],
        solution: ['Step 1', 'Step 2', 'Step 3'],
      };

      const result = ReorderSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });
  });

  describe('QueuedQuestionSchema discriminated union', () => {
    it('should validate all question types correctly', () => {
      const questions = [
        {
          skill_id: validSkillId,
          content: 'MCQ question',
          points: 10,
          is_published: true,
          type: 'multiple_choice' as const,
          options: [
            { text: 'A', is_correct: true },
            { text: 'B', is_correct: false },
          ],
        },
        {
          skill_id: validSkillId,
          content: 'Text input question',
          points: 15,
          is_published: true,
          type: 'text_input' as const,
          solution: 'Answer',
        },
        {
          skill_id: validSkillId,
          content: 'Boolean question',
          points: 5,
          is_published: true,
          type: 'boolean' as const,
          solution: true,
        },
      ];

      const results = questions.map(q => QueuedQuestionSchema.safeParse(q));

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid question types', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'Invalid type question',
        points: 10,
        is_published: true,
        type: 'invalid_type' as any,
        options: [],
      };

      const result = QueuedQuestionSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should reject missing type field', () => {
      const invalid = {
        skill_id: validSkillId,
        content: 'No type question',
        points: 10,
        is_published: true,
        options: [],
      };

      const result = QueuedQuestionSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should handle optional explanation field', () => {
      const withExplanation = {
        skill_id: validSkillId,
        content: 'Question with explanation',
        explanation: 'This is the explanation',
        points: 10,
        is_published: true,
        type: 'multiple_choice' as const,
        options: [
          { text: 'A', is_correct: true },
          { text: 'B', is_correct: false },
        ],
      };

      const withResult = QueuedQuestionSchema.safeParse(withExplanation);
      expect(withResult.success).toBe(true);

      const withoutExplanation = {
        skill_id: validSkillId,
        content: 'Question without explanation',
        points: 10,
        is_published: true,
        type: 'multiple_choice' as const,
        options: [
          { text: 'A', is_correct: true },
          { text: 'B', is_correct: false },
        ],
      };

      const withoutResult = QueuedQuestionSchema.safeParse(withoutExplanation);
      expect(withoutResult.success).toBe(true);
    });

    it('should validate UUID format with different valid patterns', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000',
        'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
        '123e4567-e89b-12d3-a456-426614174000'.toLowerCase(),
        '123E4567-E89B-12D3-A456-426614174000'.toUpperCase(),
      ];

      validUUIDs.forEach(uuid => {
        const question = {
          skill_id: uuid,
          content: 'Test question',
          points: 10,
          is_published: true,
          type: 'multiple_choice' as const,
          options: [
            { text: 'A', is_correct: true },
            { text: 'B', is_correct: false },
          ],
        };

        const result = QueuedQuestionSchema.safeParse(question);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '123e4567-e89b-12d3-a456-42661417400g', // invalid character
        'invalid-dashes-pattern', // wrong format
      ];

      invalidUUIDs.forEach(uuid => {
        const question = {
          skill_id: uuid,
          content: 'Test question',
          points: 10,
          is_published: true,
          type: 'multiple_choice' as const,
          options: [
            { text: 'A', is_correct: true },
            { text: 'B', is_correct: false },
          ],
        };

        const result = QueuedQuestionSchema.safeParse(question);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Type inference', () => {
    it('should correctly infer types from valid data', () => {
      const validQuestion = {
        skill_id: validSkillId,
        content: 'Test question',
        points: 10,
        is_published: true,
        type: 'multiple_choice' as const,
        options: [
          { text: 'A', is_correct: true },
          { text: 'B', is_correct: false },
        ],
      };

      const result = QueuedQuestionSchema.safeParse(validQuestion);

      if (result.success) {
        const typedQuestion: QueuedQuestion = result.data;
        expect(typedQuestion.type).toBe('multiple_choice');
        expect(Array.isArray(typedQuestion.options)).toBe(true);
      }
    });
  });
});
