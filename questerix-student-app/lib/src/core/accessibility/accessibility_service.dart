import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Service that detects and manages accessibility settings
class AccessibilityService {
  /// Check if high contrast mode is enabled
  static bool isHighContrastEnabled(BuildContext context) {
    return MediaQuery.of(context).highContrast;
  }

  /// Check if screen reader (TalkBack/VoiceOver) is enabled
  static bool isScreenReaderEnabled(BuildContext context) {
    return MediaQuery.of(context).accessibleNavigation;
  }

  /// Check if reduced motion is preferred
  static bool isReducedMotionEnabled(BuildContext context) {
    return MediaQuery.of(context).disableAnimations;
  }

  /// Check if bold text is enabled
  static bool isBoldTextEnabled(BuildContext context) {
    return MediaQuery.of(context).boldText;
  }

  /// Get current text scale factor
  static double getTextScaleFactor(BuildContext context) {
    return MediaQuery.textScalerOf(context).scale(1.0);
  }

  /// Get animation duration based on reduced motion preference
  static Duration getAnimationDuration(
    BuildContext context, {
    Duration normal = const Duration(milliseconds: 300),
  }) {
    return isReducedMotionEnabled(context) ? Duration.zero : normal;
  }

  /// Build a widget with semantic information for screen readers
  static Widget withSemantics({
    required Widget child,
    required String label,
    String? hint,
    String? value,
    bool? button,
    bool? header,
    bool? link,
    bool excludeSemantics = false,
    VoidCallback? onTap,
  }) {
    return Semantics(
      label: label,
      hint: hint,
      value: value,
      button: button,
      header: header,
      link: link,
      excludeSemantics: excludeSemantics,
      onTap: onTap,
      child: child,
    );
  }
}

/// Provider that watches accessibility settings
final accessibilitySettingsProvider =
    Provider.family<AccessibilitySettings, BuildContext>((ref, context) {
  return AccessibilitySettings(
    highContrast: AccessibilityService.isHighContrastEnabled(context),
    screenReader: AccessibilityService.isScreenReaderEnabled(context),
    reducedMotion: AccessibilityService.isReducedMotionEnabled(context),
    boldText: AccessibilityService.isBoldTextEnabled(context),
    textScaleFactor: AccessibilityService.getTextScaleFactor(context),
  );
});

/// Data class holding accessibility settings
class AccessibilitySettings {
  final bool highContrast;
  final bool screenReader;
  final bool reducedMotion;
  final bool boldText;
  final double textScaleFactor;

  const AccessibilitySettings({
    required this.highContrast,
    required this.screenReader,
    required this.reducedMotion,
    required this.boldText,
    required this.textScaleFactor,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AccessibilitySettings &&
          runtimeType == other.runtimeType &&
          highContrast == other.highContrast &&
          screenReader == other.screenReader &&
          reducedMotion == other.reducedMotion &&
          boldText == other.boldText &&
          textScaleFactor == other.textScaleFactor;

  @override
  int get hashCode =>
      highContrast.hashCode ^
      screenReader.hashCode ^
      reducedMotion.hashCode ^
      boldText.hashCode ^
      textScaleFactor.hashCode;
}
