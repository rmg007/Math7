// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from design-system/tokens/*.json
// Run: pwsh design-system/generators/generate-flutter.ps1
//
// Unified responsive breakpoints for Questerix

// ignore_for_file: constant_identifier_names
import 'package:flutter/material.dart';

/// Responsive breakpoints
abstract class Breakpoints {
  // Screen size breakpoints
  static const double xs = 0;
  static const double sm = 480;
  static const double md = 640;
  static const double lg = 768;
  static const double xl = 1024;
  static const double xxl = 1280;
  static const double xxxl = 1536;

  // Content max widths
  static const double contentNarrow = 480;
  static const double contentDefault = 680;
  static const double contentWide = 900;
  static const double contentFull = 1200;

  // Navigation breakpoints
  static const double bottomNavMax = 767;
  static const double railMin = 768;
  static const double railMax = 1023;
  static const double drawerMin = 1024;

  /// Check if current screen is mobile
  static bool isMobile(BuildContext context) {
    return MediaQuery.of(context).size.width < lg;
  }

  /// Check if current screen is tablet
  static bool isTablet(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= lg && width < xl;
  }

  /// Check if current screen is desktop
  static bool isDesktop(BuildContext context) {
    return MediaQuery.of(context).size.width >= xl;
  }

  /// Get responsive value based on screen size
  static T responsive<T>(
    BuildContext context, {
    required T mobile,
    T? tablet,
    T? desktop,
  }) {
    final width = MediaQuery.of(context).size.width;
    if (width >= xl && desktop != null) return desktop;
    if (width >= lg && tablet != null) return tablet;
    return mobile;
  }
}

/// Widget that rebuilds based on screen size
class ResponsiveBuilder extends StatelessWidget {
  final Widget Function(
          BuildContext context, bool isMobile, bool isTablet, bool isDesktop)
      builder;

  const ResponsiveBuilder({super.key, required this.builder});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        return builder(
          context,
          width < Breakpoints.lg,
          width >= Breakpoints.lg && width < Breakpoints.xl,
          width >= Breakpoints.xl,
        );
      },
    );
  }
}

/// Content container with max-width constraint
class ContentContainer extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final EdgeInsets padding;

  const ContentContainer({
    super.key,
    required this.child,
    this.maxWidth = Breakpoints.contentDefault,
    this.padding = EdgeInsets.zero,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );
  }
}
