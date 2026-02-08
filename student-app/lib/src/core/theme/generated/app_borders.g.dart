// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from design-system/tokens/*.json
// Run: pwsh design-system/generators/generate-flutter.ps1
//
// Unified border tokens for Questerix

// ignore_for_file: constant_identifier_names
import 'package:flutter/material.dart';

/// Border radius scale
abstract class AppBorderRadius {
  static const double none = 0;
  static const double sm = 4;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double xxl = 24;
  static const double full = 9999;

  // Semantic radius
  static BorderRadius get button => BorderRadius.circular(lg);
  static BorderRadius get card => BorderRadius.circular(xl);
  static BorderRadius get input => BorderRadius.circular(md);
  static BorderRadius get modal => BorderRadius.circular(xxl);
  static BorderRadius get avatar => BorderRadius.circular(full);
  static BorderRadius get chip => BorderRadius.circular(full);
}

/// Border width scale
abstract class AppBorderWidth {
  static const double none = 0;
  static const double thin = 1;
  static const double medium = 2;
  static const double thick = 4;
}
