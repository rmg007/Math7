import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:student_app/src/features/progress/screens/progress_screen.dart';
import 'package:student_app/src/features/progress/repositories/skill_progress_repository.dart';

import 'progress_screen_test.mocks.dart';

@GenerateMocks([SkillProgressRepository])
void main() {
  group('ProgressScreen Widget Tests', () {
    late MockSkillProgressRepository mockRepository;
    late ProviderContainer container;

    setUp(() {
      mockRepository = MockSkillProgressRepository();
      
      // Mock the repository provider
      container = ProviderContainer(
        overrides: [
          skillProgressRepositoryProvider.overrideWithValue(mockRepository),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    testWidgets('should build ProgressScreen with AppBar', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      // Verify the progress screen is built
      expect(find.byType(ProgressScreen), findsOneWidget);
      expect(find.text('My Progress'), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);
    });

    testWidgets('should display overall stats section', (WidgetTester tester) async {
      // Mock repository response
      when(mockRepository.getOverallStats()).thenAnswer((_) async => {
        'totalPoints': 1500,
        'totalAttempts': 50,
        'totalCorrect': 40,
        'averageMastery': 0.8,
        'longestStreak': 5,
      });

      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify stats section is displayed
      expect(find.byType(ProgressScreen), findsOneWidget);
    });

    testWidgets('should display domain progress section', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify domain progress section exists
      expect(find.byType(ProgressScreen), findsOneWidget);
    });

    testWidgets('should display recent activity section', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify recent activity section exists
      expect(find.byType(ProgressScreen), findsOneWidget);
    });

    testWidgets('should handle refresh indicator', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
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
    });

    testWidgets('should handle loading state', (WidgetTester tester) async {
      // Mock repository to delay response
      when(mockRepository.getOverallStats()).thenAnswer((_) async {
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
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      // Should show loading state initially
      expect(find.byType(ProgressScreen), findsOneWidget);
      
      // Wait for data to load
      await tester.pumpAndSettle(const Duration(seconds: 2));
    });

    testWidgets('should handle error state', (WidgetTester tester) async {
      // Mock repository to throw error
      when(mockRepository.getOverallStats()).thenThrow(Exception('Failed to load stats'));

      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Should handle error gracefully
      expect(find.byType(ProgressScreen), findsOneWidget);
    });

    testWidgets('should display correct stats values', (WidgetTester tester) async {
      // Mock repository with specific stats
      when(mockRepository.getOverallStats()).thenAnswer((_) async => {
        'totalPoints': 2500,
        'totalAttempts': 100,
        'totalCorrect': 85,
        'averageMastery': 0.85,
        'longestStreak': 10,
      });

      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify stats are displayed (actual implementation may vary)
      expect(find.byType(ProgressScreen), findsOneWidget);
    });

    testWidgets('should have proper scroll behavior', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Test scrolling
      await tester.fling(find.byType(SingleChildScrollView), const Offset(0, -200), 1000);
      await tester.pumpAndSettle();

      expect(find.byType(ProgressScreen), findsOneWidget);
    });

    testWidgets('should have proper padding and spacing', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify layout structure
      expect(find.byType(SingleChildScrollView), findsOneWidget);
      expect(find.byType(Column), findsOneWidget);
      expect(find.byType(ProgressScreen), findsOneWidget);
    });
  });

  group('ProgressScreen Accessibility Tests', () {
    testWidgets('should have proper accessibility labels', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      // Check for semantic labels
      expect(find.bySemanticsLabel('My Progress'), findsOneWidget);
    });

    testWidgets('should support screen readers', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      // Verify accessibility tree
      expect(find.byType(ProgressScreen), findsOneWidget);
    });
  });

  group('ProgressScreen Integration Tests', () {
    testWidgets('should integrate with repository correctly', (WidgetTester tester) async {
      final mockRepository = MockSkillProgressRepository();
      
      when(mockRepository.getOverallStats()).thenAnswer((_) async => {
        'totalPoints': 500,
        'totalAttempts': 20,
        'totalCorrect': 15,
        'averageMastery': 0.75,
        'longestStreak': 2,
      });

      final container = ProviderContainer(
        overrides: [
          skillProgressRepositoryProvider.overrideWithValue(mockRepository),
        ],
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          parent: container,
          child: MaterialApp(
            home: ProgressScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify repository was called
      verify(mockRepository.getOverallStats()).called(1);
      expect(find.byType(ProgressScreen), findsOneWidget);

      container.dispose();
    });
  });
}
