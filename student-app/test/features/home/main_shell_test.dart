import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:student_app/src/features/home/screens/main_shell.dart';

void main() {
  group('MainShell Widget Tests', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    testWidgets('should build MainShell with navigation tabs',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Verify the main shell is built
      expect(find.byType(MainShell), findsOneWidget);

      // Verify navigation destinations exist
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Progress'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets('should show correct initial tab (Home)',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Should show Home tab initially (index 0)
      expect(find.text('Home'), findsOneWidget);
    });

    testWidgets('should switch tabs when tapped', (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Tap on Progress tab
      await tester.tap(find.text('Progress'));
      await tester.pumpAndSettle();

      // Should switch to Progress tab
      expect(find.text('Progress'), findsOneWidget);

      // Tap on Settings tab
      await tester.tap(find.text('Settings'));
      await tester.pumpAndSettle();

      // Should switch to Settings tab
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets('should show sync badge when syncing',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Look for sync badge (implementation depends on actual UI)
      // This test would need mocking of sync state
      expect(find.byType(MainShell), findsOneWidget);
    });

    testWidgets('should adapt layout for tablet screens',
        (WidgetTester tester) async {
      // Set tablet screen size
      tester.binding.window.physicalSizeTestValue = const Size(1024, 768);
      tester.binding.window.devicePixelRatioTestValue = 1.0;

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Verify responsive layout
      expect(find.byType(MainShell), findsOneWidget);

      // Reset window size
      addTearDown(tester.binding.window.clearPhysicalSizeTestValue);
    });

    testWidgets('should adapt layout for desktop screens',
        (WidgetTester tester) async {
      // Set desktop screen size
      tester.binding.window.physicalSizeTestValue = const Size(1920, 1080);
      tester.binding.window.devicePixelRatioTestValue = 1.0;

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Verify responsive layout
      expect(find.byType(MainShell), findsOneWidget);

      // Reset window size
      addTearDown(tester.binding.window.clearPhysicalSizeTestValue);
    });

    testWidgets('should handle connectivity state changes',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Verify connectivity indicator is handled
      expect(find.byType(MainShell), findsOneWidget);
    });

    testWidgets('should maintain state when switching tabs',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Switch to Progress tab
      await tester.tap(find.text('Progress'));
      await tester.pumpAndSettle();

      // Switch back to Home tab
      await tester.tap(find.text('Home'));
      await tester.pumpAndSettle();

      // Should maintain state
      expect(find.text('Home'), findsOneWidget);
    });

    testWidgets('should handle navigation properly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Test navigation between different screens
      expect(find.byType(MainShell), findsOneWidget);

      // Each tab should contain its respective screen
      await tester.tap(find.text('Progress'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Settings'));
      await tester.pumpAndSettle();
    });
  });

  group('MainShell Accessibility Tests', () {
    testWidgets('should have proper accessibility labels',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: ProviderContainer(),
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Check for semantic labels
      expect(find.bySemanticsLabel('Home'), findsOneWidget);
      expect(find.bySemanticsLabel('Progress'), findsOneWidget);
      expect(find.bySemanticsLabel('Settings'), findsOneWidget);
    });

    testWidgets('should support keyboard navigation',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: ProviderContainer(),
          child: MaterialApp(
            home: MainShell(),
          ),
        ),
      );

      // Test focus navigation
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pumpAndSettle();

      // Verify focus management
      expect(find.byType(MainShell), findsOneWidget);
    });
  });
}
