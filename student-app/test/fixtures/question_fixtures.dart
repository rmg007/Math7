/// Shared Student App Question Fixtures
///
/// Mirror of: admin-panel/tests/fixtures/questions.ts
/// Aligned with the database schema for the questions table.

enum QuestionType {
  mcq,
  boolean,
  short_answer,
  fill_in_blank,
  ordering;

  String toJson() => name;
}

enum DifficultyLevel {
  beginner,
  easy,
  medium,
  hard,
  expert;

  String toJson() => name;
}

class QuestionFixture {
  final String text;
  final QuestionType questionType;
  final DifficultyLevel difficulty;
  final String? skillId;
  final Map<String, dynamic> metadata;

  const QuestionFixture({
    required this.text,
    required this.questionType,
    required this.difficulty,
    this.skillId,
    required this.metadata,
  });

  Map<String, dynamic> toJson() {
    return {
      'text': text,
      'question_type': questionType.toJson(),
      'difficulty': difficulty.toJson(),
      'skill_id': skillId,
      'metadata': metadata,
    };
  }
}

/// A simple MCQ with a clear correct answer — baseline fixture
const mcqBasic = QuestionFixture(
  text: 'What is 2 + 2?',
  questionType: QuestionType.mcq,
  difficulty: DifficultyLevel.easy,
  metadata: {
    'options': ['3', '4', '5', '6'],
    'correct_answer': '4',
    'explanation': 'Basic arithmetic: 2 + 2 equals 4.',
  },
);

/// Boolean (True/False) question
const booleanBasic = QuestionFixture(
  text: 'The Earth orbits the Sun.',
  questionType: QuestionType.boolean,
  difficulty: DifficultyLevel.beginner,
  metadata: {
    'options': ['True', 'False'],
    'correct_answer': 'True',
    'explanation':
        'The Earth revolves around the Sun, completing one orbit per year.',
  },
);

/// Medium-difficulty MCQ testing deeper domain knowledge
const mcqMedium = QuestionFixture(
  text: 'Which sorting algorithm has the best average-case time complexity?',
  questionType: QuestionType.mcq,
  difficulty: DifficultyLevel.medium,
  metadata: {
    'options': [
      'Bubble Sort',
      'Insertion Sort',
      'Merge Sort',
      'Selection Sort'
    ],
    'correct_answer': 'Merge Sort',
    'explanation':
        'Merge Sort achieves O(n log n) in all cases, making it optimal for average-case sorting.',
  },
);

/// Short answer — no choices, expects free text
const shortAnswer = QuestionFixture(
  text: 'In one sentence, explain what a pointer is in C.',
  questionType: QuestionType.short_answer,
  difficulty: DifficultyLevel.hard,
  metadata: {
    'sample_answer':
        'A pointer is a variable that stores the memory address of another variable.',
    'keywords': ['memory', 'address', 'variable'],
  },
);

/// Hard MCQ with a plausible distractor pattern
const mcqHard = QuestionFixture(
  text:
      'Which HTTP status code indicates a request has been accepted but not yet processed?',
  questionType: QuestionType.mcq,
  difficulty: DifficultyLevel.hard,
  metadata: {
    'options': ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
    'correct_answer': '202 Accepted',
    'explanation':
        '202 Accepted means the request has been received and will be processed asynchronously.',
  },
);

/// All fixtures as a list — useful for loop-based tests or seeding
const allFixtures = [
  mcqBasic,
  booleanBasic,
  mcqMedium,
  shortAnswer,
  mcqHard,
];
