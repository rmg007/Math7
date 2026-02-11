import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/features/curriculum/repositories/curriculum_repositories.dart';
import 'package:student_app/src/features/curriculum/screens/skills_screen.dart';
import 'package:student_app/src/features/curriculum/screens/practice_screen.dart';
import 'package:student_app/src/features/progress/repositories/skill_progress_repository.dart';
import 'package:student_app/src/features/progress/repositories/attempt_repository.dart';
import 'package:student_app/src/features/progress/repositories/session_repository.dart';

class MockCurriculumRepository extends Mock implements CurriculumRepository {}

class MockSkillProgressRepository extends Mock
    implements SkillProgressRepository {}

// Practice Deps
// class MockQuestionRepository is now handled by MockCurriculumRepository

class MockAttemptRepository extends Mock implements AttemptRepository {}

class MockPracticeSessionRepository extends Mock
    implements PracticeSessionRepository {}

void main() {
  late MockCurriculumRepository mockCurriculumRepository;
  late MockSkillProgressRepository mockSkillProgressRepository;
  late MockAttemptRepository mockAttemptRepository;
  late MockPracticeSessionRepository mockPracticeSessionRepository;

  const testDomainId = 'test-domain-1';

  setUp(() {
    mockCurriculumRepository = MockCurriculumRepository();
    mockSkillProgressRepository = MockSkillProgressRepository();
    mockAttemptRepository = MockAttemptRepository();
    mockPracticeSessionRepository = MockPracticeSessionRepository();

    when(() => mockSkillProgressRepository.getProgressForSkill(any()))
        .thenAnswer((_) async => null);

    when(() => mockCurriculumRepository.getRandomBySkill(any(), any()))
        .thenAnswer((_) async => []);
    when(() => mockPracticeSessionRepository.startSession(
        skillId: any(named: 'skillId'))).thenAnswer((_) async => 'session-1');
  });

  Widget createWidgetUnderTest() {
    return ProviderScope(
      overrides: [
        skillRepositoryProvider.overrideWithValue(mockCurriculumRepository),
        skillProgressRepositoryProvider
            .overrideWithValue(mockSkillProgressRepository),
        questionRepositoryProvider.overrideWithValue(mockCurriculumRepository),
        attemptRepositoryProvider.overrideWithValue(mockAttemptRepository),
        practiceSessionRepositoryProvider
            .overrideWithValue(mockPracticeSessionRepository),
      ],
      child: const MaterialApp(
        home: SkillsScreen(
          domainId: testDomainId,
          domainTitle: 'Test Domain',
        ),
      ),
    );
  }

  group('SkillsScreen Widget Tests', () {
    testWidgets('displays loading indicator initially',
        (WidgetTester tester) async {
      final controller = StreamController<List<model.Skill>>();
      addTearDown(() => controller.close());

      when(() => mockCurriculumRepository.watchByDomain(any()))
          .thenAnswer((_) => controller.stream);

      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('displays skills list when loaded',
        (WidgetTester tester) async {
      final mockSkills = [
        model.Skill(
          id: 'skill-1',
          domainId: testDomainId,
          slug: 'linear-equations',
          title: 'Linear Equations',
          description: 'Solving linear equations',
          difficultyLevel: 1,
          sortOrder: 1,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        model.Skill(
          id: 'skill-2',
          domainId: testDomainId,
          slug: 'quadratic-equations',
          title: 'Quadratic Equations',
          description: 'Solving quadratic equations',
          difficultyLevel: 2,
          sortOrder: 2,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      when(() => mockCurriculumRepository.watchByDomain(any()))
          .thenAnswer((_) => Stream.value(mockSkills));

      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      expect(find.text('Linear Equations'), findsOneWidget);
      expect(find.text('Quadratic Equations'), findsOneWidget);
    });

    testWidgets('displays error message when loading fails',
        (WidgetTester tester) async {
      when(() => mockCurriculumRepository.watchByDomain(any()))
          .thenAnswer((_) => Stream.error('API Error'));

      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Should find the error message from the exception
      expect(find.text('API Error'), findsOneWidget);
      // And the fixed title
      expect(find.text('Error loading skills'), findsOneWidget);
    });

    testWidgets('navigates to practice screen when skill is selected',
        (WidgetTester tester) async {
      final mockSkills = [
        model.Skill(
          id: 'skill-1',
          domainId: testDomainId,
          slug: 'linear-equations',
          title: 'Linear Equations',
          description: 'Solving linear equations',
          difficultyLevel: 1,
          sortOrder: 1,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      when(() => mockCurriculumRepository.watchByDomain(any()))
          .thenAnswer((_) => Stream.value(mockSkills));

      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Linear Equations'));
      await tester.pumpAndSettle();

      expect(find.byType(PracticeScreen), findsOneWidget);
    });
  });
}
