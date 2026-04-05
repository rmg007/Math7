/**
 * Shared E2E + Unit Test Question Fixtures
 *
 * These are Zod-valid, DB-type-aligned question records for use across
 * Playwright E2E tests and Vitest unit tests. They are NOT seeded to the DB —
 * they are in-memory fixtures. For DB seeding use seed-test-data.ts.
 *
 * Schema aligned with: admin-panel/src/lib/database.types.ts
 */

import { CanonicalQuestionType } from '@questerix/core/constants/question-types';

export type QuestionType = CanonicalQuestionType;
export type DifficultyLevel = 'easy' | 'medium' | 'hard'; // Simplified to match canonical difficulty

export interface QuestionFixture {
  text: string;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  skill_id: string | null;
  metadata: Record<string, unknown>;
}

/** A simple MCQ with a clear correct answer — baseline fixture */
export const MCQ_BASIC: QuestionFixture = {
  text: 'What is 2 + 2?',
  question_type: 'multiple_choice',
  difficulty: 'easy',
  skill_id: null,
  metadata: {
    options: ['3', '4', '5', '6'],
    correct_answer: '4',
    explanation: 'Basic arithmetic: 2 + 2 equals 4.',
  },
};

/** Boolean (True/False) question */
export const BOOLEAN_BASIC: QuestionFixture = {
  text: 'The Earth orbits the Sun.',
  question_type: 'boolean',
  difficulty: 'easy',
  skill_id: null,
  metadata: {
    options: ['True', 'False'],
    correct_answer: 'True',
    explanation: 'The Earth revolves around the Sun, completing one orbit per year.',
  },
};

/** Medium-difficulty MCQ testing deeper domain knowledge */
export const MCQ_MEDIUM: QuestionFixture = {
  text: 'Which sorting algorithm has the best average-case time complexity?',
  question_type: 'multiple_choice',
  difficulty: 'medium',
  skill_id: null,
  metadata: {
    options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'],
    correct_answer: 'Merge Sort',
    explanation:
      'Merge Sort achieves O(n log n) in all cases, making it optimal for average-case sorting.',
  },
};

/** Short answer — no choices, expects free text */
export const SHORT_ANSWER: QuestionFixture = {
  text: 'In one sentence, explain what a pointer is in C.',
  question_type: 'text_input',
  difficulty: 'hard',
  skill_id: null,
  metadata: {
    sample_answer: 'A pointer is a variable that stores the memory address of another variable.',
    keywords: ['memory', 'address', 'variable'],
  },
};

/** Hard MCQ with a plausible distractor pattern */
export const MCQ_HARD: QuestionFixture = {
  text: 'Which HTTP status code indicates a request has been accepted but not yet processed?',
  question_type: 'multiple_choice',
  difficulty: 'hard',
  skill_id: null,
  metadata: {
    options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
    correct_answer: '202 Accepted',
    explanation:
      '202 Accepted means the request has been received and will be processed asynchronously.',
  },
};

/** All fixtures as an array — useful for seeding multiple records in tests */
export const ALL_FIXTURES: QuestionFixture[] = [
  MCQ_BASIC,
  BOOLEAN_BASIC,
  MCQ_MEDIUM,
  SHORT_ANSWER,
  MCQ_HARD,
];
