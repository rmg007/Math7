import 'package:flutter/material.dart';

// Design System Integration:
// - Generated tokens: package:student_app/src/core/theme/generated/generated.dart
// - Use BrandColors, SemanticColors, NeutralColors for new code
// - Legacy AppColors below is kept for backward compatibility
// - See design-system/README.md for full documentation

/// Legacy color definitions - maintained for backward compatibility
/// For new code, prefer using generated tokens from generated/app_colors.g.dart
class AppColors {
  static const primary = Color(0xFF6366F1);
  static const primaryDark = Color(0xFF4F46E5);
  static const primaryLight = Color(0xFF818CF8);

  static const success = Color(0xFF22C55E);
  static const successLight = Color(0xFFDCFCE7);
  static const error = Color(0xFFEF4444);
  static const errorLight = Color(0xFFFEE2E2);
  static const warning = Color(0xFFF59E0B);
  static const warningLight = Color(0xFFFEF3C7);

  static const background = Color(0xFFF8FAFC);
  static const surface = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF1E293B);
  static const textSecondary = Color(0xFF64748B);
  static const textTertiary = Color(0xFF94A3B8);

  static const offline = Color(0xFFEF4444);
  static const online = Color(0xFF22C55E);

  static const cardBorder = Color(0xFFE2E8F0);
  static const divider = Color(0xFFE2E8F0);

  static const streak = Color(0xFFF97316);
  static const points = Color(0xFFEAB308);
  static const mastery = Color(0xFF8B5CF6);

  // High Contrast Mode Colors (WCAG AAA compliant)
  static const highContrastPrimary = Color(0xFF0000FF); // Pure blue
  static const highContrastBackground = Color(0xFFFFFFFF); // Pure white
  static const highContrastSurface = Color(0xFFFFFFFF);
  static const highContrastTextPrimary = Color(0xFF000000); // Pure black
  static const highContrastTextSecondary = Color(0xFF000000);
  static const highContrastSuccess = Color(0xFF008000); // Pure green
  static const highContrastError = Color(0xFFFF0000); // Pure red
  static const highContrastWarning = Color(0xFFFF8C00); // Dark orange
  static const highContrastCardBorder = Color(0xFF000000);
  static const highContrastDivider = Color(0xFF000000);

  // Dark mode high contrast
  static const highContrastDarkBackground = Color(0xFF000000); // Pure black
  static const highContrastDarkSurface = Color(0xFF000000);
  static const highContrastDarkTextPrimary = Color(0xFFFFFFFF); // Pure white
  static const highContrastDarkTextSecondary = Color(0xFFFFFFFF);
  static const highContrastDarkCardBorder = Color(0xFFFFFFFF);
  static const highContrastDarkDivider = Color(0xFFFFFFFF);
}

class AppTheme {
  static ThemeData light({double textScale = 1.0}) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: AppColors.primaryLight,
        surface: AppColors.surface,
        error: AppColors.error,
      ),
      scaffoldBackgroundColor: AppColors.background,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.cardBorder),
        ),
        color: AppColors.surface,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: TextStyle(
            fontSize: 16 * textScale,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: AppColors.primary),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(
            fontSize: 32 * textScale,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary),
        displayMedium: TextStyle(
            fontSize: 28 * textScale,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary),
        displaySmall: TextStyle(
            fontSize: 24 * textScale,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary),
        headlineLarge: TextStyle(
            fontSize: 22 * textScale,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary),
        headlineMedium: TextStyle(
            fontSize: 20 * textScale,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary),
        headlineSmall: TextStyle(
            fontSize: 18 * textScale,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary),
        titleLarge: TextStyle(
            fontSize: 16 * textScale,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary),
        titleMedium: TextStyle(
            fontSize: 14 * textScale,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary),
        titleSmall: TextStyle(
            fontSize: 12 * textScale,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary),
        bodyLarge:
            TextStyle(fontSize: 16 * textScale, color: AppColors.textPrimary),
        bodyMedium:
            TextStyle(fontSize: 14 * textScale, color: AppColors.textPrimary),
        bodySmall:
            TextStyle(fontSize: 12 * textScale, color: AppColors.textSecondary),
        labelLarge: TextStyle(
            fontSize: 14 * textScale,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary),
        labelMedium: TextStyle(
            fontSize: 12 * textScale,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary),
        labelSmall: TextStyle(
            fontSize: 10 * textScale,
            fontWeight: FontWeight.w500,
            color: AppColors.textTertiary),
      ),
    );
  }

  static ThemeData dark({double textScale = 1.0}) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.dark,
        primary: AppColors.primaryLight,
        onPrimary: Colors.black,
        secondary: AppColors.primary,
        surface: const Color(0xFF1E293B),
        error: AppColors.error,
      ),
      scaffoldBackgroundColor: const Color(0xFF0F172A),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF1E293B),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF334155)),
        ),
        color: const Color(0xFF1E293B),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF1E293B),
        selectedItemColor: AppColors.primaryLight,
        unselectedItemColor: Color(0xFF94A3B8),
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(
            fontSize: 32 * textScale,
            fontWeight: FontWeight.bold,
            color: Colors.white),
        displayMedium: TextStyle(
            fontSize: 28 * textScale,
            fontWeight: FontWeight.bold,
            color: Colors.white),
        displaySmall: TextStyle(
            fontSize: 24 * textScale,
            fontWeight: FontWeight.bold,
            color: Colors.white),
        headlineLarge: TextStyle(
            fontSize: 22 * textScale,
            fontWeight: FontWeight.w600,
            color: Colors.white),
        headlineMedium: TextStyle(
            fontSize: 20 * textScale,
            fontWeight: FontWeight.w600,
            color: Colors.white),
        headlineSmall: TextStyle(
            fontSize: 18 * textScale,
            fontWeight: FontWeight.w600,
            color: Colors.white),
        titleLarge: TextStyle(
            fontSize: 16 * textScale,
            fontWeight: FontWeight.w600,
            color: Colors.white),
        titleMedium: TextStyle(
            fontSize: 14 * textScale,
            fontWeight: FontWeight.w500,
            color: Colors.white),
        titleSmall: TextStyle(
            fontSize: 12 * textScale,
            fontWeight: FontWeight.w500,
            color: Colors.white),
        bodyLarge: TextStyle(fontSize: 16 * textScale, color: Colors.white),
        bodyMedium: TextStyle(fontSize: 14 * textScale, color: Colors.white),
        bodySmall:
            TextStyle(fontSize: 12 * textScale, color: const Color(0xFF94A3B8)),
        labelLarge: TextStyle(
            fontSize: 14 * textScale,
            fontWeight: FontWeight.w500,
            color: Colors.white),
        labelMedium: TextStyle(
            fontSize: 12 * textScale,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF94A3B8)),
        labelSmall: TextStyle(
            fontSize: 10 * textScale,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF64748B)),
      ),
    );
  }

  /// High contrast light theme for accessibility (WCAG AAA)
  static ThemeData highContrastLight({double textScale = 1.0}) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.highContrastPrimary,
        brightness: Brightness.light,
        primary: AppColors.highContrastPrimary,
        onPrimary: Colors.white,
        secondary: AppColors.highContrastPrimary,
        surface: AppColors.highContrastSurface,
        error: AppColors.highContrastError,
        outline: AppColors.highContrastCardBorder,
      ),
      scaffoldBackgroundColor: AppColors.highContrastBackground,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.highContrastPrimary,
        foregroundColor: Colors.white,
        elevation: 2,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(
            color: AppColors.highContrastCardBorder,
            width: 2,
          ),
        ),
        color: AppColors.highContrastSurface,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.highContrastPrimary,
          foregroundColor: Colors.white,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(
                color: AppColors.highContrastTextPrimary, width: 2),
          ),
          textStyle: TextStyle(
            fontSize: 16 * textScale,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.highContrastTextPrimary,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(
              color: AppColors.highContrastTextPrimary, width: 2),
        ),
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(
          fontSize: 32 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        displayMedium: TextStyle(
          fontSize: 28 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        displaySmall: TextStyle(
          fontSize: 24 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        headlineLarge: TextStyle(
          fontSize: 22 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        headlineMedium: TextStyle(
          fontSize: 20 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        headlineSmall: TextStyle(
          fontSize: 18 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        titleLarge: TextStyle(
          fontSize: 16 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        titleMedium: TextStyle(
          fontSize: 14 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        titleSmall: TextStyle(
          fontSize: 12 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastTextPrimary,
        ),
        bodyLarge: TextStyle(
          fontSize: 16 * textScale,
          color: AppColors.highContrastTextPrimary,
        ),
        bodyMedium: TextStyle(
          fontSize: 14 * textScale,
          color: AppColors.highContrastTextPrimary,
        ),
        bodySmall: TextStyle(
          fontSize: 12 * textScale,
          color: AppColors.highContrastTextSecondary,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.highContrastDivider,
        thickness: 2,
      ),
    );
  }

  /// High contrast dark theme for accessibility (WCAG AAA)
  static ThemeData highContrastDark({double textScale = 1.0}) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.highContrastPrimary,
        brightness: Brightness.dark,
        primary: AppColors.highContrastPrimary,
        onPrimary: Colors.white,
        secondary: AppColors.highContrastPrimary,
        surface: AppColors.highContrastDarkSurface,
        error: AppColors.highContrastError,
        outline: AppColors.highContrastDarkCardBorder,
      ),
      scaffoldBackgroundColor: AppColors.highContrastDarkBackground,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.highContrastDarkSurface,
        foregroundColor: AppColors.highContrastDarkTextPrimary,
        elevation: 2,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(
            color: AppColors.highContrastDarkCardBorder,
            width: 2,
          ),
        ),
        color: AppColors.highContrastDarkSurface,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.highContrastPrimary,
          foregroundColor: Colors.white,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(
                color: AppColors.highContrastDarkTextPrimary, width: 2),
          ),
          textStyle: TextStyle(
            fontSize: 16 * textScale,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(
          fontSize: 32 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        displayMedium: TextStyle(
          fontSize: 28 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        displaySmall: TextStyle(
          fontSize: 24 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        headlineLarge: TextStyle(
          fontSize: 22 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        headlineMedium: TextStyle(
          fontSize: 20 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        headlineSmall: TextStyle(
          fontSize: 18 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        titleLarge: TextStyle(
          fontSize: 16 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        titleMedium: TextStyle(
          fontSize: 14 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        titleSmall: TextStyle(
          fontSize: 12 * textScale,
          fontWeight: FontWeight.bold,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        bodyLarge: TextStyle(
          fontSize: 16 * textScale,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        bodyMedium: TextStyle(
          fontSize: 14 * textScale,
          color: AppColors.highContrastDarkTextPrimary,
        ),
        bodySmall: TextStyle(
          fontSize: 12 * textScale,
          color: AppColors.highContrastDarkTextSecondary,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.highContrastDarkDivider,
        thickness: 2,
      ),
    );
  }
}
