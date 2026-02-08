# Questerix Unified Design System

## Overview

The unified design system provides a single source of truth for all visual design tokens across the Questerix platform. Design tokens are defined once in JSON format and then automatically generated to platform-specific code.

## Architecture

```
design-system/
├── tokens/                    # Source of truth
│   ├── colors.json           # Brand, semantic, neutral colors
│   ├── typography.json       # Font families, sizes, weights
│   ├── spacing.json          # Spacing scale
│   ├── borders.json          # Border radius, widths
│   ├── shadows.json          # Shadow definitions
│   └── breakpoints.json      # Responsive breakpoints
├── icons/
│   └── mappings.json         # Lucide icon name mappings
├── generators/
│   ├── generate-flutter.ps1  # Flutter/Dart generator
│   ├── generate-tailwind.ps1 # Tailwind/CSS generator
│   └── generate-all.ps1      # Run all generators
└── generated/                # Tailwind presets (committed)
    ├── tailwind.preset.js
    └── css-variables.css
```

## Generated Outputs

| Platform | Location | Format |
|----------|----------|--------|
| Flutter | `student-app/lib/src/core/theme/generated/` | Dart classes |
| Tailwind | `design-system/generated/` | JS preset + CSS |

## Usage

### Flutter (Student App)

```dart
import 'package:student_app/src/core/theme/generated/generated.dart';

// Colors
Container(color: BrandColors.primary)
Container(color: SemanticColors.success)
Container(color: NeutralColors.neutral500)

// Icons (Lucide)
Icon(AppIcons.home)
Icon(AppIcons.learn)  // Maps to LucideIcons.bookOpen

// Spacing
Padding(padding: EdgeInsets.all(AppSpacing.md))

// Shadows
Container(decoration: BoxDecoration(boxShadow: [AppShadows.md]))

// Borders
Container(
  decoration: BoxDecoration(
    borderRadius: BorderRadius.circular(AppBorderRadius.lg),
    border: Border.all(width: AppBorderWidth.DEFAULT),
  ),
)

// Responsive
if (screenWidth >= Breakpoints.tablet) {
  // Show NavigationRail instead of BottomNav
}
```

### Tailwind (Admin Panel, Landing Pages)

The Admin Panel uses shadcn/ui which has its own CSS variable system. The generated preset can be imported to extend it:

```js
// tailwind.config.js
import designSystemPreset from '../design-system/generated/tailwind.preset.js';

export default {
  presets: [designSystemPreset],
  // ... existing config
}
```

Or import CSS variables:
```css
@import '../../design-system/generated/css-variables.css';
```

## Icon Standard: Lucide

All apps now use Lucide icons for consistency:

| App | Package | Usage |
|-----|---------|-------|
| Student App | `lucide_icons` | `Icon(AppIcons.home)` |
| Admin Panel | `lucide-react` | `<Home />` |
| Landing Pages | `lucide-react` | `<Home />` |

### Icon Mapping Reference

| Semantic | Lucide Icon |
|----------|-------------|
| Home | `home` |
| Learn | `book-open` |
| Practice | `target` |
| Progress | `trending-up` |
| Settings | `settings` |
| Mastery | `award` |
| Streak | `flame` |
| Points | `star` |
| Check | `check` |
| Error | `alert-circle` |

## Running Generators

```powershell
# Generate all
pwsh design-system/generators/generate-all.ps1

# Flutter only
pwsh design-system/generators/generate-flutter.ps1

# Tailwind only
pwsh design-system/generators/generate-tailwind.ps1
```

## Responsive Breakpoints

| Name | Width | Typical Use |
|------|-------|-------------|
| xs | 0-479px | Small phones |
| sm | 480-599px | Large phones |
| md | 600-767px | Small tablets |
| lg | 768-1023px | Tablets |
| xl | 1024-1279px | Small desktops |
| 2xl | 1280-1535px | Desktops |
| 3xl | 1536px+ | Large screens |

### Flutter Constants

```dart
class Breakpoints {
  static const double mobile = 0;
  static const double mobileL = 480;
  static const double tablet = 600;
  static const double laptop = 1024;
  static const double desktop = 1280;
  static const double desktopL = 1536;
}
```

## Governance

### When to Modify Tokens

1. **Brand changes** - Update `colors.json` brand section
2. **New semantic colors** - Add to `colors.json` semantic section
3. **Typography updates** - Modify `typography.json`
4. **New icons** - Add to `icons/mappings.json`

### Process

1. Edit the relevant `.json` token file
2. Run `generate-all.ps1`
3. Test in both Flutter and React apps
4. Commit both token changes and generated files

### What NOT to Modify

- Generated files directly (they will be overwritten)
- App-specific theme overrides should stay in app-specific theme files
