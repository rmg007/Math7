import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/features/curriculum/repositories/question_repository.dart';
import 'package:student_app/src/features/curriculum/screens/practice_screen.dart';
import 'package:student_app/src/features/progress/repositories/attempt_repository.dart';
import 'package:student_app/src/features/progress/repositories/session_repository.dart';
import 'package:student_app/src/features/progress/repositories/skill_progress_repository.dart';

class MockQuestionRepository extends Mock implements QuestionRepository {}

class MockAttemptRepository extends Mock implements AttemptRepository {}

class MockSkillProgressRepository extends Mock
    implements SkillProgressRepository {}

class MockPracticeSessionRepository extends Mock
    implements PracticeSessionRepository {}

void main() {
  late MockQuestionRepository mockQuestionRepository;
  late MockAttemptRepository mockAttemptRepository;
  late MockSkillProgressRepository mockSkillProgressRepository;
  late MockPracticeSessionRepository mockSessionRepository;

  setUp(() {
    mockQuestionRepository = MockQuestionRepository();
    mockAttemptRepository = MockAttemptRepository();
    mockSkillProgressRepository = MockSkillProgressRepository();
    mockSessionRepository = MockPracticeSessionRepository();
  });

  testWidgets('PracticeScreen loads and displays questions', (tester) async {
    // Arrange
    final questions = [
      model.Question(
        id: 'q1',
        skillId: 's1',
        type: model.QuestionType.multipleChoice,
        content: 'What is 1+1?',
        options: {
          'options': [
            {'id': 'a', 'text': '1'},
            {'id': 'b', 'text': '2'},
            {'id': 'c', 'text': '3'},
          ]
        },
        solution: {'correct_option_id': 'b'},
        points: 10,
        isPublished: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    when(() => mockQuestionRepository.getRandomBySkill(any(), any()))
        .thenAnswer((_) async => questions);

    when(() =>
            mockSessionRepository.startSession(skillId: any(named: 'skillId')))
        .thenAnswer((_) async => 'session-1');

    // Act
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          questionRepositoryProvider.overrideWithValue(mockQuestionRepository),
          attemptRepositoryProvider.overrideWithValue(mockAttemptRepository),
          skillProgressRepositoryProvider
              .overrideWithValue(mockSkillProgressRepository),
          practiceSessionRepositoryProvider
              .overrideWithValue(mockSessionRepository),
        ],
        child: const MaterialApp(
          home: PracticeScreen(
            skillId: 's1',
            skillTitle: 'Addition',
          ),
        ),
      ),
    );

    // Assert Loading State
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Pump to settle UI (replace pumpAndSettle due to timer)
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    // Assert Question Display
    expect(find.text('What is 1+1?'), findsOneWidget);
    expect(find.text('Single Choice'), findsOneWidget); // Type label
  });

  testWidgets('PracticeScreen handles answer selection and submission',
      (tester) async {
    // Arrange
    final questions = [
      model.Question(
        id: 'q1',
        skillId: 's1',
        type: model.QuestionType.multipleChoice,
        content: 'What is 1+1?',
        options: {
          'options': [
            {'id': 'op1', 'text': '1'},
            {'id': 'op2', 'text': '2'},
            {'id': 'op3', 'text': '3'},
          ]
        },
        solution: {'correct_option_id': 'op2'},
        points: 10,
        isPublished: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    when(() => mockQuestionRepository.getRandomBySkill(any(), any()))
        .thenAnswer((_) async => questions);
    when(() =>
            mockSessionRepository.startSession(skillId: any(named: 'skillId')))
        .thenAnswer((_) async => 'session-1');
    when(() => mockAttemptRepository.submitAttempt(
          questionId: any(named: 'questionId'),
          response: any(named: 'response'),
          isCorrect: any(named: 'isCorrect'),
          scoreAwarded: any(named: 'scoreAwarded'),
          timeSpentMs: any(named: 'timeSpentMs'),
        )).thenAnswer((_) async => 'att-1');
    when(() => mockSkillProgressRepository.recordAttempt(
          skillId: any(named: 'skillId'),
          isCorrect: any(named: 'isCorrect'),
          pointsEarned: any(named: 'pointsEarned'),
        )).thenAnswer((_) async => {});
    when(() => mockSessionRepository.updateSession(
          sessionId: any(named: 'sessionId'),
          questionsAttempted: any(named: 'questionsAttempted'),
          questionsCorrect: any(named: 'questionsCorrect'),
          totalTimeMs: any(named: 'totalTimeMs'),
        )).thenAnswer((_) async => {});

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          questionRepositoryProvider.overrideWithValue(mockQuestionRepository),
          attemptRepositoryProvider.overrideWithValue(mockAttemptRepository),
          skillProgressRepositoryProvider
              .overrideWithValue(mockSkillProgressRepository),
          practiceSessionRepositoryProvider
              .overrideWithValue(mockSessionRepository),
        ],
        child: const MaterialApp(
          home: PracticeScreen(
            skillId: 's1',
            skillTitle: 'Addition',
          ),
        ),
      ),
    );

    // Pump to settle UI
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    // Act: Select Answer
    // MultipleChoiceWidget rendered values?
    // Options is {'op1': '1', 'op2': '2', 'op3': '3'}.
    // The widget likely shows key or value?
    // Let's assume it shows value (1, 2, 3).
    // Let's tap '2'.
    await tester.tap(find.text('2'));
    await tester.pump();

    // Check Answer button should be enabled
    final checkButton = find.widgetWithText(ElevatedButton, 'Check Answer');
    expect(tester.widget<ElevatedButton>(checkButton).enabled, isTrue);

    // Tap Check Answer
    await tester.tap(checkButton);
    await tester.pump(); // Start animation/async
    await tester.pump(const Duration(milliseconds: 500)); // Wait for feedback

    // Assert Feedback
    expect(find.text('Correct!'), findsOneWidget);

    // Verify mocks called
    verify(() => mockAttemptRepository.submitAttempt(
          questionId: 'q1',
          response: any(named: 'response'),
          isCorrect: true,
          scoreAwarded: 10,
          timeSpentMs: any(named: 'timeSpentMs'),
        )).called(1);
  });
}
