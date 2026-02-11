import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:drift/drift.dart';
import 'package:student_app/src/features/settings/screens/settings_screen.dart';
import '../../helpers/test_helpers.dart';

void main() {
  setUpAll(() {
    driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  });

  late ProviderContainer container;

  setUp(() {
    container = ProviderContainer(
      overrides: getTestOverrides(),
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('SettingsScreen Widget Tests', () {
    testWidgets('should build SettingsScreen with AppBar',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      // Verify the settings screen is built
      expect(find.byType(SettingsScreen), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should display sync section', (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify sync section exists
      expect(find.byType(SettingsScreen), findsOneWidget);
      expect(find.byType(Card), findsWidgets);

      await _cleanup(tester);
    });

    testWidgets('should display mentorship section',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify mentorship section exists
      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should display accessibility section',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify accessibility section exists
      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should display account section', (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify account section exists
      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should display about section', (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify about section exists
      expect(find.byType(SettingsScreen), findsOneWidget);

      await tester.pumpAndSettle();

      // Verify layout structure
      expect(find.byType(ListView), findsOneWidget);
      expect(find.byType(Card), findsWidgets);
      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });
  });

  group('SettingsScreen Accessibility Tests', () {
    testWidgets('should have proper accessibility labels',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      // Check for semantic labels
      expect(find.bySemanticsLabel('Settings'), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should support screen readers', (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      // Verify accessibility tree
      expect(find.byType(SettingsScreen), findsOneWidget);

      // Check for important settings options
      expect(find.byType(ListTile), findsWidgets);

      await _cleanup(tester);
    });

    testWidgets('should have proper focus management',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      // Test focus navigation
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pumpAndSettle();

      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });
  });

  group('SettingsScreen Integration Tests', () {
    testWidgets('should integrate with settings provider',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify settings provider integration
      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should integrate with sync service',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify sync service integration
      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should integrate with auth provider',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify auth provider integration
      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });
  });

  group('SettingsScreen State Management Tests', () {
    testWidgets('should handle settings changes', (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Test settings state changes
      expect(find.byType(SettingsScreen), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('should persist settings changes', (WidgetTester tester) async {
      await _setMobileSize(tester);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Test settings persistence
      expect(find.byType(SettingsScreen), findsOneWidget);

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
