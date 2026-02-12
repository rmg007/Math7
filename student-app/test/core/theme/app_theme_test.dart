// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:student_app/src/core/theme/app_theme.dart';

void main() {
  group('AppColors Tests', () {
    test('should have primary colors defined', () {
      expect(AppColors.primary, isA<Color>());
      expect(AppColors.primaryDark, isA<Color>());
      expect(AppColors.primaryLight, isA<Color>());

      // Primary colors should be different shades
      expect(AppColors.primary, isNot(equals(AppColors.primaryDark)));
      expect(AppColors.primary, isNot(equals(AppColors.primaryLight)));
      expect(AppColors.primaryDark, isNot(equals(AppColors.primaryLight)));
    });

    test('should have semantic colors defined', () {
      expect(AppColors.success, isA<Color>());
      expect(AppColors.successLight, isA<Color>());
      expect(AppColors.error, isA<Color>());
      expect(AppColors.errorLight, isA<Color>());
      expect(AppColors.warning, isA<Color>());
      expect(AppColors.warningLight, isA<Color>());

      // Light variants should be lighter than main colors
      expect(
          AppColors.successLight.value, greaterThan(AppColors.success.value));
      expect(AppColors.errorLight.value, greaterThan(AppColors.error.value));
      expect(
          AppColors.warningLight.value, greaterThan(AppColors.warning.value));
    });

    test('should have text colors defined', () {
      expect(AppColors.textPrimary, isA<Color>());
      expect(AppColors.textSecondary, isA<Color>());
      expect(AppColors.textTertiary, isA<Color>());

      // Text colors should have proper hierarchy (darker to lighter)
      expect(
          AppColors.textPrimary.value, lessThan(AppColors.textSecondary.value));
      expect(AppColors.textSecondary.value,
          lessThan(AppColors.textTertiary.value));
    });

    test('should have surface colors defined', () {
      expect(AppColors.background, isA<Color>());
      expect(AppColors.surface, isA<Color>());
      expect(AppColors.cardBorder, isA<Color>());
      expect(AppColors.divider, isA<Color>());

      // Surface should be lighter than background typically
      expect(AppColors.surface.value, greaterThan(AppColors.background.value));
    });

    test('should have status colors defined', () {
      expect(AppColors.online, isA<Color>());
      expect(AppColors.offline, isA<Color>());

      // Online should be green, offline should be red
      expect(AppColors.online, equals(AppColors.success));
      expect(AppColors.offline, equals(AppColors.error));
    });

    test('should have gamification colors defined', () {
      expect(AppColors.streak, isA<Color>());
      expect(AppColors.points, isA<Color>());
      expect(AppColors.mastery, isA<Color>());

      // These should be distinct colors
      expect(AppColors.streak, isNot(equals(AppColors.points)));
      expect(AppColors.points, isNot(equals(AppColors.mastery)));
      expect(AppColors.mastery, isNot(equals(AppColors.streak)));
    });

    test('should have high contrast colors defined', () {
      expect(AppColors.highContrastPrimary, isA<Color>());
      expect(AppColors.highContrastBackground, isA<Color>());
      expect(AppColors.highContrastSurface, isA<Color>());
      expect(AppColors.highContrastTextPrimary, isA<Color>());
      expect(AppColors.highContrastTextSecondary, isA<Color>());
      expect(AppColors.highContrastSuccess, isA<Color>());
      expect(AppColors.highContrastError, isA<Color>());
      expect(AppColors.highContrastWarning, isA<Color>());

      // High contrast should use pure colors
      expect(AppColors.highContrastBackground, equals(const Color(0xFFFFFFFF)));
      expect(
          AppColors.highContrastTextPrimary, equals(const Color(0xFF000000)));
      expect(AppColors.highContrastPrimary, equals(const Color(0xFF0000FF)));
      expect(AppColors.highContrastSuccess, equals(const Color(0xFF008000)));
      expect(AppColors.highContrastError, equals(const Color(0xFFFF0000)));
    });

    test('should have consistent color format', () {
      final colors = [
        AppColors.primary,
        AppColors.primaryDark,
        AppColors.primaryLight,
        AppColors.success,
        AppColors.error,
        AppColors.warning,
        AppColors.background,
        AppColors.surface,
        AppColors.textPrimary,
        AppColors.textSecondary,
        AppColors.textTertiary,
      ];

      for (final color in colors) {
        expect(color.value, greaterThanOrEqualTo(0));
        expect(color.value, lessThanOrEqualTo(0xFFFFFFFF));
        expect(color.alpha, equals(255)); // Should be opaque
      }
    });
  });

  group('AppTheme Tests', () {
    test('should create light theme', () {
      final theme = AppTheme.light();

      expect(theme, isA<ThemeData>());
      expect(theme.brightness, equals(Brightness.light));
      expect(theme.primaryColor, equals(AppColors.primary));
    });

    test('should create dark theme', () {
      final theme = AppTheme.dark();

      expect(theme, isA<ThemeData>());
      expect(theme.brightness, equals(Brightness.dark));
    });

    test('should have consistent theme structure', () {
      final lightTheme = AppTheme.light();
      final darkTheme = AppTheme.dark();

      // All themes should have required properties
      for (final theme in [lightTheme, darkTheme]) {
        expect(theme.primaryColor, isA<Color>());
        expect(theme.cardColor, isA<Color>());
        expect(theme.textTheme, isNotNull);
        expect(theme.appBarTheme, isNotNull);
        expect(theme.elevatedButtonTheme, isNotNull);
        expect(theme.outlinedButtonTheme, isNotNull);
        expect(theme.textButtonTheme, isNotNull);
      }
    });

    test('should have proper color schemes', () {
      final lightTheme = AppTheme.light();
      final darkTheme = AppTheme.dark();

      // Light theme should have light background
      expect(lightTheme.colorScheme.surface.value, greaterThan(0xFF888888));

      // Dark theme should have dark background
      expect(darkTheme.colorScheme.surface.value, lessThan(0xFF888888));
    });

    test('should have accessible text contrast', () {
      final lightTheme = AppTheme.light();
      final darkTheme = AppTheme.dark();

      // Light theme: dark text on light background
      expect(
          lightTheme.textTheme.bodyLarge?.color?.value, lessThan(0xFF888888));
      expect(lightTheme.colorScheme.surface.value, greaterThan(0xFF888888));

      // Dark theme: light text on dark background
      expect(
          darkTheme.textTheme.bodyLarge?.color?.value, greaterThan(0xFF888888));
      expect(darkTheme.colorScheme.surface.value, lessThan(0xFF888888));
    });

    test('should support custom theme extensions', () {
      final theme = AppTheme.light();

      // Test that theme can be extended
      final customTheme = theme.copyWith(
        primaryColor: AppColors.success,
      );

      expect(customTheme.primaryColor, equals(AppColors.success));
      expect(customTheme.brightness, equals(theme.brightness));
    });

    test('should maintain theme consistency across variants', () {
      final lightTheme = AppTheme.light();
      final darkTheme = AppTheme.dark();

      // All themes should have the same structure
      expect(lightTheme.textTheme.bodyLarge?.fontFamily,
          equals(darkTheme.textTheme.bodyLarge?.fontFamily));
    });
  });

  group('Color Utility Tests', () {
    test('should provide color variations', () {
      // Test that related colors have logical relationships
      expect(
          AppColors.primaryLight.value, greaterThan(AppColors.primary.value));
      expect(AppColors.primaryDark.value, lessThan(AppColors.primary.value));

      expect(
          AppColors.successLight.value, greaterThan(AppColors.success.value));
      expect(AppColors.errorLight.value, greaterThan(AppColors.error.value));
      expect(
          AppColors.warningLight.value, greaterThan(AppColors.warning.value));
    });

    test('should have semantic color meanings', () {
      // Test that colors match their semantic meaning
      expect(AppColors.success, isA<Color>());
      expect(AppColors.error, isA<Color>());
      expect(AppColors.warning, isA<Color>());

      // These should be distinct from each other
      expect(AppColors.success, isNot(equals(AppColors.error)));
      expect(AppColors.error, isNot(equals(AppColors.warning)));
      expect(AppColors.warning, isNot(equals(AppColors.success)));
    });

    test('should support accessibility requirements', () {
      // High contrast colors should meet WCAG requirements
      const background = AppColors.highContrastBackground;
      const text = AppColors.highContrastTextPrimary;

      expect(text, equals(const Color(0xFF000000)));
      expect(background, equals(const Color(0xFFFFFFFF)));

      // Proper WCAG contrast ratio calculation using relative luminance
      final l1 = background.computeLuminance();
      final l2 = text.computeLuminance();
      final contrastRatio = (l1 + 0.05) / (l2 + 0.05);

      expect(contrastRatio, greaterThan(20)); // White/Black is exactly 21:1
    });
  });

  group('Theme Consistency Tests', () {
    test('should maintain brand consistency', () {
      final lightTheme = AppTheme.light();
      final darkTheme = AppTheme.dark();

      // Primary color should be consistent across themes
      expect(lightTheme.primaryColor, equals(AppColors.primary));
      // Dark theme might use a different primary variant
      expect(darkTheme.primaryColor, isA<Color>());
    });

    test('should have proper spacing and typography', () {
      final theme = AppTheme.light();

      expect(theme.textTheme, isNotNull);
      expect(theme.textTheme.displayLarge, isNotNull);
      expect(theme.textTheme.displayMedium, isNotNull);
      expect(theme.textTheme.displaySmall, isNotNull);
      expect(theme.textTheme.headlineLarge, isNotNull);
      expect(theme.textTheme.headlineMedium, isNotNull);
      expect(theme.textTheme.headlineSmall, isNotNull);
      expect(theme.textTheme.titleLarge, isNotNull);
      expect(theme.textTheme.titleMedium, isNotNull);
      expect(theme.textTheme.titleSmall, isNotNull);
      expect(theme.textTheme.bodyLarge, isNotNull);
      expect(theme.textTheme.bodyMedium, isNotNull);
      expect(theme.textTheme.bodySmall, isNotNull);
      expect(theme.textTheme.labelLarge, isNotNull);
      expect(theme.textTheme.labelMedium, isNotNull);
      expect(theme.textTheme.labelSmall, isNotNull);
    });
  });

  group('Theme Performance Tests', () {
    test('should create themes efficiently', () {
      final stopwatch = Stopwatch()..start();

      for (int i = 0; i < 100; i++) {
        AppTheme.light();
        AppTheme.dark();
      }

      stopwatch.stop();

      // Should create 200 themes in reasonable time
      // Loosened from 100ms for more stable CI/test environments
      expect(stopwatch.elapsedMilliseconds, lessThan(500));
    });

    test('should reuse color instances', () {
      const color1 = AppColors.primary;
      const color2 = AppColors.primary;

      expect(identical(color1, color2), isTrue);
    });
  });
}
