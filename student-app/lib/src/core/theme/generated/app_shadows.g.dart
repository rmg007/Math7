// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from design-system/tokens/*.json
// Run: pwsh design-system/generators/generate-flutter.ps1
//
// Unified shadow/elevation tokens for Questerix

// ignore_for_file: constant_identifier_names
import 'package:flutter/material.dart';

/// Elevation/Shadow scale
abstract class AppShadows {
  static const List<BoxShadow> none = [];

  static const List<BoxShadow> xs = [
    BoxShadow(
      color: Color(0x0D000000),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> sm = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> md = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 6,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> lg = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 15,
      offset: Offset(0, 10),
    ),
  ];

  static const List<BoxShadow> xl = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 25,
      offset: Offset(0, 20),
    ),
  ];

  static const List<BoxShadow> xxl = [
    BoxShadow(
      color: Color(0x40000000),
      blurRadius: 50,
      offset: Offset(0, 25),
    ),
  ];

  // Semantic shadows
  static List<BoxShadow> get card => sm;
  static List<BoxShadow> get cardHover => md;
  static List<BoxShadow> get dropdown => lg;
  static List<BoxShadow> get modal => xl;
  static List<BoxShadow> get toast => lg;
}
