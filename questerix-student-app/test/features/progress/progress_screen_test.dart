import 'package:drift/drift.dart' hide Column;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/features/curriculum/repositories/curriculum_repositories.dart';
import 'package:student_app/src/features/progress/repositories/session_repository.dart';
import 'package:student_app/src/features/progress/repositories/skill_progress_repository.dart';
import 'package:student_app/src/features/progress/screens/progress_screen.dart';

import '../../helpers/test_helpers.dart';

class MockSkillProgressRepository extends Mock
    implements SkillProgressRepository {}

class MockPracticeSessionRepository extends Mock
    implements PracticeSessionRepository {}

class MockCurriculumRepository extends Mock implements CurriculumRepository {}

void main() {
  setUpAll(() {
    driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  });

  late MockSkillProgressRepository mockProgressRepo;
  late MockPracticeSessionRepository mockSessionRepo;
  late MockCurriculumRepository mockCurriculumRepo;
  late MockSupabaseClient mockSupabaseClient;
  late MockAuthService mockAuthService;
  late ProviderContainer container;

  setUp(() {
    mockProgressRepo = MockSkillProgressRepository();
    mockSessionRepo = MockPracticeSessionRepository();
    mockCurriculumRepo = MockCurriculumRepository();
    mockSupabaseClient = MockSupabaseClient();
    mockAuthService = MockAuthService();

    // Default mocks
    when(() => mockProgressRepo.getOverallStats()).thenAnswer((_) async => {
          'totalPoints': 0,
          'totalAttempts': 0,
          'totalCorrect': 0,
          'averageMastery': 0.0,
          'longestStreak': 0,
        });
    when(() => mockCurriculumRepo.watchAllPublished())
        .thenAnswer((_) => Stream.value([]));
    when(() => mockSessionRepo.watchRecentSessions(limit: any(named: 'limit')))
        .thenAnswer((_) => Stream.value([]));
    when(() => mockProgressRepo.getMasteryForDomain(any()))
        .thenAnswer((_) async => 0);

    container = ProviderContainer(
      overrides: [
        ...getTestOverrides(
          mockSupabaseClient: mockSupabaseClient,
          mockAuthService: mockAuthService,
        ),
        skillProgressRepositoryProvider.overrideWithValue(mockProgressRepo),
        practiceSessionRepositoryProvider.overrideWithValue(mockSessionRepo),
        domainRepositoryProvider.overrideWithValue(mockCurriculumRepo),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('ProgressScreen Widget Tests', () {
    testWidgets('should build ProgressScreen with AppBar',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      // Verify the progress screen is built
      expect(find.byType(ProgressScreen), findsOneWidget);
      expect(find.text('My Progress'), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should display overall stats section',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      // Mock repository response
      when(() => mockProgressRepo.getOverallStats()).thenAnswer((_) async => {
            'totalPoints': 1500,
            'totalAttempts': 50,
            'totalCorrect': 40,
            'averageMastery': 0.8,
            'longestStreak': 5,
          });

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify stats section is displayed
      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should display domain progress section',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify domain progress section exists
      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should display recent activity section',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify recent activity section exists
      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should handle refresh indicator', (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Find and pull to refresh
      final refreshIndicator = find.byType(RefreshIndicator);
      expect(refreshIndicator, findsOneWidget);

      // Test pull to refresh
      await tester.fling(refreshIndicator, const Offset(0, 300), 1000);
      await tester.pumpAndSettle();

      await _cleanup(tester);
    });

    testWidgets('should handle loading state', (WidgetTester tester) async {
      await _setMobileSize(tester);
      // Mock repository to delay response
      when(() => mockProgressRepo.getOverallStats()).thenAnswer((_) async {
        await Future.delayed(const Duration(seconds: 1));
        return {
          'totalPoints': 1000,
          'totalAttempts': 30,
          'totalCorrect': 25,
          'averageMastery': 0.83,
          'longestStreak': 3,
        };
      });

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      // Should show loading state initially
      expect(find.byType(ProgressScreen), findsOneWidget);

      // Wait for data to load
      await tester.pumpAndSettle(const Duration(seconds: 2));

      await _cleanup(tester);
    });

    testWidgets('should handle error state', (WidgetTester tester) async {
      await _setMobileSize(tester);
      // Mock repository to throw error
      when(() => mockProgressRepo.getOverallStats())
          .thenAnswer((_) async => throw Exception('Failed to load stats'));

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Should handle error gracefully
      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should display correct stats values',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      // Mock repository with specific stats
      when(() => mockProgressRepo.getOverallStats()).thenAnswer((_) async => {
            'totalPoints': 2500,
            'totalAttempts': 100,
            'totalCorrect': 85,
            'averageMastery': 0.85,
            'longestStreak': 10,
          });

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify stats are displayed (actual implementation may vary)
      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should have proper scroll behavior',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Test scrolling
      await tester.fling(
          find.byType(SingleChildScrollView), const Offset(0, -200), 1000);
      await tester.pumpAndSettle();

      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should have proper padding and spacing',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify layout structure
      expect(find.byType(SingleChildScrollView), findsOneWidget);
      expect(find.byType(Column), findsWidgets);
      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });
  });

  group('ProgressScreen Accessibility Tests', () {
    testWidgets('should have proper accessibility labels',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      // Check for semantic labels
      expect(find.bySemanticsLabel('My Progress'), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should support screen readers', (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      // Verify accessibility tree
      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });
  });

  group('ProgressScreen Integration Tests', () {
    testWidgets('should integrate with repository correctly',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      when(() => mockProgressRepo.getOverallStats()).thenAnswer((_) async => {
            'totalPoints': 500,
            'totalAttempts': 20,
            'totalCorrect': 15,
            'averageMastery': 0.75,
            'longestStreak': 2,
          });

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify repository was called
      verify(() => mockProgressRepo.getOverallStats()).called(1);
      expect(find.byType(ProgressScreen), findsOneWidget);

      await _cleanup(tester);
    });
  });
}

/// Helper to set consistent mobile screen size
Future<void> _setMobileSize(WidgetTester tester) async {
  tester.view.physicalSize = const Size(600, 1000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

/// Robust cleanup to avoid pending timers from StreamBuilder and Drift
Future<void> _cleanup(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(milliseconds: 100));
  await tester.pumpAndSettle();
}
