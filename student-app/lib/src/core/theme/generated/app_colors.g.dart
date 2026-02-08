// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from design-system/tokens/*.json
// Run: pwsh design-system/generators/generate-flutter.ps1
//
// Unified color tokens for Questerix

// ignore_for_file: constant_identifier_names
import 'package:flutter/material.dart';

/// Brand colors - Primary brand identity
abstract class BrandColors {
  static const Color primary = Color(0xFF319795);
  static const Color secondary = Color(0xFF6B46C1);
  static const Color accent = Color(0xFFED8936);
}

/// Semantic colors - Meaning-based colors
abstract class SemanticColors {
  static const Color success = Color(0xFF38A169);
  static const Color warning = Color(0xFFD69E2E);
  static const Color error = Color(0xFFE53E3E);
  static const Color info = Color(0xFF3182CE);
}

/// Neutral colors - Grayscale palette
abstract class NeutralColors {
  static const Color neutral50 = Color(0xFFF7FAFC);
  static const Color neutral100 = Color(0xFFEDF2F7);
  static const Color neutral200 = Color(0xFFE2E8F0);
  static const Color neutral300 = Color(0xFFCBD5E0);
  static const Color neutral400 = Color(0xFFA0AEC0);
  static const Color neutral500 = Color(0xFF718096);
  static const Color neutral600 = Color(0xFF4A5568);
  static const Color neutral700 = Color(0xFF2D3748);
  static const Color neutral800 = Color(0xFF1A202C);
  static const Color neutral900 = Color(0xFF171923);
}

/// Light theme colors
abstract class LightThemeColors {
  static const Color background = Color(0xFFF7FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFEDF2F7);
  static const Color text = Color(0xFF1A202C);
  static const Color textSecondary = Color(0xFF4A5568);
  static const Color textMuted = Color(0xFF718096);
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderFocus = Color(0xFF319795);
}

/// Dark theme colors
abstract class DarkThemeColors {
  static const Color background = Color(0xFF171923);
  static const Color surface = Color(0xFF1A202C);
  static const Color surfaceVariant = Color(0xFF2D3748);
  static const Color text = Color(0xFFF7FAFC);
  static const Color textSecondary = Color(0xFFCBD5E0);
  static const Color textMuted = Color(0xFFA0AEC0);
  static const Color border = Color(0xFF4A5568);
  static const Color borderFocus = Color(0xFF4FD1C5);
}

/// Gradient definitions
abstract class AppGradients {
  static const LinearGradient primary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF319795),
      Color(0xFF6B46C1),
    ],
  );

  static const LinearGradient hero = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF667eea),
      Color(0xFF764ba2),
    ],
  );
}
