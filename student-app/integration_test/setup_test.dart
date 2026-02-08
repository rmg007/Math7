import 'package:flutter/material.dart'; // For ValueKey, Offset, Duration, etc.
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'mocks/mock_supabase_service.dart';
import 'mocks/mock_database_provider.dart';

/// Integration Test Setup and Configuration
///
/// This file provides setup utilities for integration tests including:
/// - Mock Supabase initialization
/// - Mock Drift database initialization
/// - Test environment configuration
/// - Helper functions for common test scenarios

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Integration Test Setup', () {
    late MockSupabaseService mockSupabase;
    late MockDatabaseProvider mockDatabase;

    setUp(() async {
      // Initialize mock Supabase
      mockSupabase = MockSupabaseService();
      await mockSupabase.initialize();

      // Initialize mock Drift database
      mockDatabase = MockDatabaseProvider();
      await mockDatabase.initialize();
    });

    tearDown(() async {
      // Clean up after each test
      await mockDatabase.cleanup();
      await mockSupabase.cleanup();
    });

    testWidgets('Test environment initializes correctly',
        (WidgetTester tester) async {
      // Verify mocks are initialized
      expect(mockSupabase.isInitialized, isTrue);
      expect(mockDatabase.isInitialized, isTrue);
    });

    testWidgets('Can retrieve mock Supabase client',
        (WidgetTester tester) async {
      final client = mockSupabase.getClient();
      expect(client, isNotNull);
      expect(client, isA<SupabaseClient>());
    });

    testWidgets('Can retrieve mock database', (WidgetTester tester) async {
      final db = mockDatabase.getDatabase();
      expect(db, isNotNull);
      expect(db, isA<AppDatabase>());
    });
  });
}

/// Helper function to pump app with mocked dependencies
Future<void> pumpAppWithMocks(
  WidgetTester tester, {
  required MockSupabaseService supabase,
  required MockDatabaseProvider database,
}) async {
  // TODO: Implement provider overrides
  // This will be completed when we integrate with the main app
  // await tester.pumpWidget(
  //   ProviderScope(
  //     overrides: [
  //       supabaseClientProvider.overrideWith((ref) => supabase.getClient()),
  //       databaseProvider.overrideWith((ref) => database.getDatabase()),
  //     ],
  //     child: const MyApp(),
  //   ),
  // );
}

/// Helper function to wait for animations to complete
Future<void> waitForAnimations(WidgetTester tester) async {
  await tester.pumpAndSettle(const Duration(seconds: 2));
}

/// Helper function to find and tap a widget by text
Future<void> tapByText(WidgetTester tester, String text) async {
  final finder = find.text(text);
  expect(finder, findsOneWidget);
  await tester.tap(finder);
  await waitForAnimations(tester);
}

/// Helper function to find and tap a widget by key
Future<void> tapByKey(WidgetTester tester, String key) async {
  final finder = find.byKey(ValueKey(key));
  expect(finder, findsOneWidget);
  await tester.tap(finder);
  await waitForAnimations(tester);
}

/// Helper function to enter text in a field
Future<void> enterText(WidgetTester tester, String key, String text) async {
  final finder = find.byKey(ValueKey(key));
  expect(finder, findsOneWidget);
  await tester.enterText(finder, text);
  await waitForAnimations(tester);
}

/// Helper function to verify text exists on screen
void expectTextExists(String text) {
  expect(find.text(text), findsAtLeastNWidgets(1));
}

/// Helper function to verify widget exists by key
void expectKeyExists(String key) {
  expect(find.byKey(ValueKey(key)), findsOneWidget);
}

/// Helper function to scroll to find a widget
Future<void> scrollToFind(
  WidgetTester tester,
  Finder scrollable,
  Finder target,
) async {
  await tester.dragUntilVisible(
    target,
    scrollable,
    const Offset(0, -100),
  );
  await waitForAnimations(tester);
}
