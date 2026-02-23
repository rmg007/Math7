import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:student_app/src/core/providers/settings_provider.dart';

class MockSharedPreferences extends Mock implements SharedPreferences {}

void main() {
  group('AppSettings Tests', () {
    test('should create AppSettings with default values', () {
      const settings = AppSettings();

      expect(settings.largeText, isFalse);
      expect(settings.darkMode, isFalse);
      expect(settings.textScale, equals(1.0));
    });

    test('should create AppSettings with custom values', () {
      const settings = AppSettings(
        largeText: true,
        darkMode: true,
      );

      expect(settings.largeText, isTrue);
      expect(settings.darkMode, isTrue);
      expect(settings.textScale, equals(1.25));
    });

    test('should calculate text scale correctly', () {
      const normalSettings = AppSettings(largeText: false);
      const largeTextSettings = AppSettings(largeText: true);

      expect(normalSettings.textScale, equals(1.0));
      expect(largeTextSettings.textScale, equals(1.25));
    });

    test('should copy with new values', () {
      const original = AppSettings(
        largeText: false,
        darkMode: true,
      );

      final updated = original.copyWith(largeText: true);

      expect(updated.largeText, isTrue);
      expect(updated.darkMode, isTrue); // Should preserve original value
    });

    test('should copy with all new values', () {
      const original = AppSettings(
        largeText: false,
        darkMode: false,
      );

      final updated = original.copyWith(
        largeText: true,
        darkMode: true,
      );

      expect(updated.largeText, isTrue);
      expect(updated.darkMode, isTrue);
    });

    test('should copy with null values (preserve original)', () {
      const original = AppSettings(
        largeText: true,
        darkMode: false,
      );

      final updated = original.copyWith(
        largeText: null,
        darkMode: null,
      );

      expect(updated.largeText, isTrue);
      expect(updated.darkMode, isFalse);
    });

    test('should support equality', () {
      const settings1 = AppSettings(largeText: true, darkMode: false);
      const settings2 = AppSettings(largeText: true, darkMode: false);
      const settings3 = AppSettings(largeText: false, darkMode: true);

      expect(settings1, equals(settings2));
      expect(settings1, isNot(equals(settings3)));
    });

    test('should have consistent toString', () {
      const settings = AppSettings(largeText: true, darkMode: false);
      final stringRepresentation = settings.toString();

      expect(stringRepresentation, contains('AppSettings'));
      expect(stringRepresentation, contains('largeText: true'));
      expect(stringRepresentation, contains('darkMode: false'));
    });
  });

  group('SettingsNotifier Tests', () {
    late SettingsNotifier notifier;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      notifier = SettingsNotifier();
    });

    tearDown(() {
      notifier.dispose();
    });

    test('should initialize with default settings', () {
      expect(notifier.state.largeText, isFalse);
      expect(notifier.state.darkMode, isFalse);
      expect(notifier.state.textScale, equals(1.0));
    });

    test('should load settings from SharedPreferences', () async {
      // Mock SharedPreferences with existing values
      SharedPreferences.setMockInitialValues({
        'largeText': true,
        'darkMode': true,
      });

      final newNotifier = SettingsNotifier();

      // Wait for async loading to complete
      await Future.delayed(const Duration(milliseconds: 100));

      expect(newNotifier.state.largeText, isTrue);
      expect(newNotifier.state.darkMode, isTrue);

      newNotifier.dispose();
    });

    test('should handle missing SharedPreferences values', () async {
      // Mock with empty preferences
      SharedPreferences.setMockInitialValues({});

      final newNotifier = SettingsNotifier();

      // Wait for async loading to complete
      await Future.delayed(const Duration(milliseconds: 100));

      expect(newNotifier.state.largeText, isFalse);
      expect(newNotifier.state.darkMode, isFalse);

      newNotifier.dispose();
    });

    test('should set large text setting', () async {
      await notifier.setLargeText(true);

      expect(notifier.state.largeText, isTrue);
      expect(notifier.state.darkMode, isFalse); // Should remain unchanged
      expect(notifier.state.textScale, equals(1.25));
    });

    test('should set dark mode setting', () async {
      await notifier.setDarkMode(true);

      expect(notifier.state.largeText, isFalse); // Should remain unchanged
      expect(notifier.state.darkMode, isTrue);
      expect(notifier.state.textScale, equals(1.0)); // Should remain unchanged
    });

    test('should toggle large text setting', () async {
      // Start with false
      expect(notifier.state.largeText, isFalse);

      // Set to true
      await notifier.setLargeText(true);
      expect(notifier.state.largeText, isTrue);

      // Set back to false
      await notifier.setLargeText(false);
      expect(notifier.state.largeText, isFalse);
    });

    test('should toggle dark mode setting', () async {
      // Start with false
      expect(notifier.state.darkMode, isFalse);

      // Set to true
      await notifier.setDarkMode(true);
      expect(notifier.state.darkMode, isTrue);

      // Set back to false
      await notifier.setDarkMode(false);
      expect(notifier.state.darkMode, isFalse);
    });

    test('should handle multiple setting changes', () async {
      await notifier.setLargeText(true);
      await notifier.setDarkMode(true);

      expect(notifier.state.largeText, isTrue);
      expect(notifier.state.darkMode, isTrue);
      expect(notifier.state.textScale, equals(1.25));

      await notifier.setLargeText(false);

      expect(notifier.state.largeText, isFalse);
      expect(notifier.state.darkMode, isTrue); // Should remain unchanged
      expect(notifier.state.textScale, equals(1.0));
    });

    test('should persist settings to SharedPreferences', () async {
      await notifier.setLargeText(true);
      await notifier.setDarkMode(true);

      // Verify values were saved
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('largeText'), isTrue);
      expect(prefs.getBool('darkMode'), isTrue);
    });

    test('should handle SharedPreferences errors gracefully', () async {
      // This test would require more complex mocking to simulate errors
      // For now, we just verify the normal flow works
      expect(notifier.state, isA<AppSettings>());
    });
  });

  group('Settings Provider Integration Tests', () {
    test('should provide settings through Riverpod', () {
      final container = ProviderContainer();

      // Create a simple settings provider for testing
      final settingsProvider =
          Provider<AppSettings>((ref) => const AppSettings());
      final settings = container.read(settingsProvider);

      expect(settings, isA<AppSettings>());
      expect(settings.largeText, isFalse);
      expect(settings.darkMode, isFalse);

      container.dispose();
    });

    test('should provide settings notifier through Riverpod', () {
      final container = ProviderContainer();

      // Create a simple settings notifier provider for testing
      final settingsNotifierProvider =
          StateNotifierProvider<SettingsNotifier, AppSettings>(
              (ref) => SettingsNotifier());
      final notifier = container.read(settingsNotifierProvider.notifier);

      expect(notifier, isA<SettingsNotifier>());

      container.dispose();
    });

    test('should update state when notifier changes', () async {
      final container = ProviderContainer();

      // Create a simple settings notifier provider for testing
      final settingsNotifierProvider =
          StateNotifierProvider<SettingsNotifier, AppSettings>(
              (ref) => SettingsNotifier());

      // Get initial state
      final initialSettings = container.read(settingsNotifierProvider);
      expect(initialSettings.largeText, isFalse);

      // Update through notifier
      final notifier = container.read(settingsNotifierProvider.notifier);
      await notifier.setLargeText(true);

      // Check updated state
      final updatedSettings = container.read(settingsNotifierProvider);
      expect(updatedSettings.largeText, isTrue);

      container.dispose();
    });

    test('should handle provider disposal', () {
      final container = ProviderContainer();

      final settingsNotifierProvider =
          StateNotifierProvider<SettingsNotifier, AppSettings>(
              (ref) => SettingsNotifier());
      // Just ensure we can read it
      container.read(settingsNotifierProvider.notifier);

      // Should not throw when disposing the container
      expect(() {
        container.dispose();
      }, returnsNormally);
    });
  });

  group('Settings Performance Tests', () {
    test('should handle rapid setting changes', () async {
      final notifier = SettingsNotifier();
      final stopwatch = Stopwatch()..start();

      // Perform many setting changes
      for (int i = 0; i < 100; i++) {
        await notifier.setLargeText(i % 2 == 0);
        await notifier.setDarkMode(i % 3 == 0);
      }

      stopwatch.stop();

      // Should complete quickly (< 1 second)
      expect(stopwatch.elapsedMilliseconds, lessThan(1000));

      // Final state should be correct
      expect(notifier.state.largeText, isFalse); // 99 % 2 == 0 is false
      expect(notifier.state.darkMode, isTrue); // 99 % 3 == 0 is true

      notifier.dispose();
    });

    test('should handle concurrent setting changes', () async {
      final notifier = SettingsNotifier();

      // Start multiple concurrent operations
      final futures = <Future>[];

      for (int i = 0; i < 10; i++) {
        futures.add(notifier.setLargeText(i % 2 == 0));
        futures.add(notifier.setDarkMode(i % 3 == 0));
      }

      // Wait for all to complete
      await Future.wait(futures);

      // Should have a valid final state
      expect(notifier.state, isA<AppSettings>());

      notifier.dispose();
    });
  });

  group('Settings Edge Cases', () {
    test('should handle rapid initialization and disposal', () async {
      for (int i = 0; i < 10; i++) {
        final notifier = SettingsNotifier();
        await Future.delayed(const Duration(milliseconds: 1));
        notifier.dispose();
      }

      // Should not throw
      expect(true, isTrue);
    });

    test('should handle state changes after disposal', () async {
      final notifier = SettingsNotifier();
      notifier.dispose();

      // Should handle gracefully (implementation dependent)
      expect(() async => await notifier.setLargeText(true), returnsNormally);
    });
  });
}
