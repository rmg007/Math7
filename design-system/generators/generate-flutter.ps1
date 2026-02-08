<# 
.SYNOPSIS
    Generates Flutter theme files from design tokens.

.DESCRIPTION
    This script reads JSON token files from design-system/tokens/ and generates
    corresponding Dart files for the Flutter student-app.

.OUTPUTS
    - student-app/lib/src/core/theme/generated/app_colors.g.dart
    - student-app/lib/src/core/theme/generated/app_typography.g.dart
    - student-app/lib/src/core/theme/generated/app_spacing.g.dart
    - student-app/lib/src/core/theme/generated/app_shadows.g.dart
    - student-app/lib/src/core/theme/generated/app_borders.g.dart
    - student-app/lib/src/core/theme/generated/breakpoints.g.dart
#>

param(
    [string]$ProjectRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = "Stop"

# Paths
$TokensDir = Join-Path $ProjectRoot "design-system/tokens"
$OutputDir = Join-Path $ProjectRoot "student-app/lib/src/core/theme/generated"

# Ensure output directory exists
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "🎨 Generating Flutter theme files from design tokens..." -ForegroundColor Cyan

# Helper: Convert hex color to Flutter Color
function ConvertTo-FlutterColor {
    param([string]$Hex)
    $hex = $Hex.TrimStart('#')
    return "Color(0xFF$hex)"
}

# Helper: Generate file header
function Get-FileHeader {
    param([string]$Description)
    return @"
// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from design-system/tokens/*.json
// Run: pwsh design-system/generators/generate-flutter.ps1
//
// $Description

// ignore_for_file: constant_identifier_names

"@
}

# ===== GENERATE app_colors.g.dart =====
Write-Host "  📦 Generating app_colors.g.dart..." -ForegroundColor Yellow

$colorsJson = Get-Content (Join-Path $TokensDir "colors.json") -Raw | ConvertFrom-Json

$colorsContent = Get-FileHeader "Unified color tokens for Questerix"
$colorsContent += @"
import 'package:flutter/material.dart';

/// Brand colors - Primary brand identity
abstract class BrandColors {
  static const Color primary = $(ConvertTo-FlutterColor $colorsJson.brand.primary.value);
  static const Color secondary = $(ConvertTo-FlutterColor $colorsJson.brand.secondary.value);
  static const Color accent = $(ConvertTo-FlutterColor $colorsJson.brand.accent.value);
}

/// Semantic colors - Meaning-based colors
abstract class SemanticColors {
  static const Color success = $(ConvertTo-FlutterColor $colorsJson.semantic.success.value);
  static const Color warning = $(ConvertTo-FlutterColor $colorsJson.semantic.warning.value);
  static const Color error = $(ConvertTo-FlutterColor $colorsJson.semantic.error.value);
  static const Color info = $(ConvertTo-FlutterColor $colorsJson.semantic.info.value);
}

/// Neutral colors - Grayscale palette
abstract class NeutralColors {
  static const Color neutral50 = $(ConvertTo-FlutterColor $colorsJson.neutral.'50'.value);
  static const Color neutral100 = $(ConvertTo-FlutterColor $colorsJson.neutral.'100'.value);
  static const Color neutral200 = $(ConvertTo-FlutterColor $colorsJson.neutral.'200'.value);
  static const Color neutral300 = $(ConvertTo-FlutterColor $colorsJson.neutral.'300'.value);
  static const Color neutral400 = $(ConvertTo-FlutterColor $colorsJson.neutral.'400'.value);
  static const Color neutral500 = $(ConvertTo-FlutterColor $colorsJson.neutral.'500'.value);
  static const Color neutral600 = $(ConvertTo-FlutterColor $colorsJson.neutral.'600'.value);
  static const Color neutral700 = $(ConvertTo-FlutterColor $colorsJson.neutral.'700'.value);
  static const Color neutral800 = $(ConvertTo-FlutterColor $colorsJson.neutral.'800'.value);
  static const Color neutral900 = $(ConvertTo-FlutterColor $colorsJson.neutral.'900'.value);
}

/// Light theme colors
abstract class LightThemeColors {
  static const Color background = $(ConvertTo-FlutterColor $colorsJson.themes.light.background);
  static const Color surface = $(ConvertTo-FlutterColor $colorsJson.themes.light.surface);
  static const Color surfaceVariant = $(ConvertTo-FlutterColor $colorsJson.themes.light.surfaceVariant);
  static const Color text = $(ConvertTo-FlutterColor $colorsJson.themes.light.text);
  static const Color textSecondary = $(ConvertTo-FlutterColor $colorsJson.themes.light.textSecondary);
  static const Color textMuted = $(ConvertTo-FlutterColor $colorsJson.themes.light.textMuted);
  static const Color border = $(ConvertTo-FlutterColor $colorsJson.themes.light.border);
  static const Color borderFocus = $(ConvertTo-FlutterColor $colorsJson.themes.light.borderFocus);
}

/// Dark theme colors
abstract class DarkThemeColors {
  static const Color background = $(ConvertTo-FlutterColor $colorsJson.themes.dark.background);
  static const Color surface = $(ConvertTo-FlutterColor $colorsJson.themes.dark.surface);
  static const Color surfaceVariant = $(ConvertTo-FlutterColor $colorsJson.themes.dark.surfaceVariant);
  static const Color text = $(ConvertTo-FlutterColor $colorsJson.themes.dark.text);
  static const Color textSecondary = $(ConvertTo-FlutterColor $colorsJson.themes.dark.textSecondary);
  static const Color textMuted = $(ConvertTo-FlutterColor $colorsJson.themes.dark.textMuted);
  static const Color border = $(ConvertTo-FlutterColor $colorsJson.themes.dark.border);
  static const Color borderFocus = $(ConvertTo-FlutterColor $colorsJson.themes.dark.borderFocus);
}

/// Gradient definitions
abstract class AppGradients {
  static const LinearGradient primary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      $(ConvertTo-FlutterColor $colorsJson.gradients.primary.start),
      $(ConvertTo-FlutterColor $colorsJson.gradients.primary.end),
    ],
  );

  static const LinearGradient hero = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      $(ConvertTo-FlutterColor $colorsJson.gradients.hero.start),
      $(ConvertTo-FlutterColor $colorsJson.gradients.hero.end),
    ],
  );
}
"@

Set-Content -Path (Join-Path $OutputDir "app_colors.g.dart") -Value $colorsContent -Encoding UTF8

# ===== GENERATE app_spacing.g.dart =====
Write-Host "  📦 Generating app_spacing.g.dart..." -ForegroundColor Yellow

$spacingJson = Get-Content (Join-Path $TokensDir "spacing.json") -Raw | ConvertFrom-Json

$spacingContent = Get-FileHeader "Unified spacing tokens for Questerix"
$spacingContent += @"

/// Spacing scale based on 4px base unit
abstract class AppSpacing {
  static const double space0 = 0;
  static const double space05 = 2;
  static const double space1 = 4;
  static const double space15 = 6;
  static const double space2 = 8;
  static const double space25 = 10;
  static const double space3 = 12;
  static const double space35 = 14;
  static const double space4 = 16;
  static const double space5 = 20;
  static const double space6 = 24;
  static const double space7 = 28;
  static const double space8 = 32;
  static const double space9 = 36;
  static const double space10 = 40;
  static const double space12 = 48;
  static const double space14 = 56;
  static const double space16 = 64;
  static const double space20 = 80;
  static const double space24 = 96;

  // Semantic spacing
  static const double pageMarginMobile = space4;
  static const double pageMarginTablet = space6;
  static const double pageMarginDesktop = space8;

  static const double cardPaddingMobile = space3;
  static const double cardPaddingTablet = space4;
  static const double cardPaddingDesktop = space6;

  static const double inputPaddingX = space3;
  static const double inputPaddingY = space2;

  static const double buttonPaddingX = space4;
  static const double buttonPaddingY = space2;

  static const double listItemGap = space2;
  static const double inlineGap = space2;
  static const double stackGap = space4;
}
"@

Set-Content -Path (Join-Path $OutputDir "app_spacing.g.dart") -Value $spacingContent -Encoding UTF8

# ===== GENERATE app_borders.g.dart =====
Write-Host "  📦 Generating app_borders.g.dart..." -ForegroundColor Yellow

$bordersJson = Get-Content (Join-Path $TokensDir "borders.json") -Raw | ConvertFrom-Json

$bordersContent = Get-FileHeader "Unified border tokens for Questerix"
$bordersContent += @"
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
"@

Set-Content -Path (Join-Path $OutputDir "app_borders.g.dart") -Value $bordersContent -Encoding UTF8

# ===== GENERATE app_shadows.g.dart =====
Write-Host "  📦 Generating app_shadows.g.dart..." -ForegroundColor Yellow

$shadowsContent = Get-FileHeader "Unified shadow/elevation tokens for Questerix"
$shadowsContent += @"
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
"@

Set-Content -Path (Join-Path $OutputDir "app_shadows.g.dart") -Value $shadowsContent -Encoding UTF8

# ===== GENERATE breakpoints.g.dart =====
Write-Host "  📦 Generating breakpoints.g.dart..." -ForegroundColor Yellow

$breakpointsJson = Get-Content (Join-Path $TokensDir "breakpoints.json") -Raw | ConvertFrom-Json

$breakpointsContent = Get-FileHeader "Unified responsive breakpoints for Questerix"
$breakpointsContent += @"
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
  final Widget Function(BuildContext context, bool isMobile, bool isTablet, bool isDesktop) builder;

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
"@

Set-Content -Path (Join-Path $OutputDir "breakpoints.g.dart") -Value $breakpointsContent -Encoding UTF8

# ===== CREATE BARREL FILE =====
Write-Host "  📦 Creating barrel file..." -ForegroundColor Yellow

$barrelContent = @"
// GENERATED CODE - DO NOT MODIFY BY HAND
// Barrel file for generated theme tokens

export 'app_colors.g.dart';
export 'app_spacing.g.dart';
export 'app_borders.g.dart';
export 'app_shadows.g.dart';
export 'breakpoints.g.dart';
"@

Set-Content -Path (Join-Path $OutputDir "generated.dart") -Value $barrelContent -Encoding UTF8

Write-Host "✅ Flutter theme files generated successfully!" -ForegroundColor Green
Write-Host "   Output: $OutputDir" -ForegroundColor Gray
