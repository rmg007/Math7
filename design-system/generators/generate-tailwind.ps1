<#
.SYNOPSIS
    Generates Tailwind CSS configuration and CSS variables from design tokens.

.DESCRIPTION
    This script reads JSON token files from design-system/tokens/ and generates
    a Tailwind preset and CSS variables for React apps (admin-panel, landing-pages).

.OUTPUTS
    - design-system/generated/tailwind.preset.js
    - design-system/generated/css-variables.css
#>

param(
    [string]$ProjectRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = "Stop"

# Paths
$TokensDir = Join-Path $ProjectRoot "design-system/tokens"
$OutputDir = Join-Path $ProjectRoot "design-system/generated"

# Ensure output directory exists
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "🎨 Generating Tailwind config from design tokens..." -ForegroundColor Cyan

# Load all token files
$colors = Get-Content (Join-Path $TokensDir "colors.json") -Raw | ConvertFrom-Json
$typography = Get-Content (Join-Path $TokensDir "typography.json") -Raw | ConvertFrom-Json
$spacing = Get-Content (Join-Path $TokensDir "spacing.json") -Raw | ConvertFrom-Json
$borders = Get-Content (Join-Path $TokensDir "borders.json") -Raw | ConvertFrom-Json
$shadows = Get-Content (Join-Path $TokensDir "shadows.json") -Raw | ConvertFrom-Json
$breakpoints = Get-Content (Join-Path $TokensDir "breakpoints.json") -Raw | ConvertFrom-Json

# ===== GENERATE tailwind.preset.js =====
Write-Host "  📦 Generating tailwind.preset.js..." -ForegroundColor Yellow

$tailwindPreset = @"
// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from design-system/tokens/*.json
// Run: pwsh design-system/generators/generate-tailwind.ps1

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: '$($colors.brand.primary.value)',
          light: '$($colors.brand.primary.value)33',
          dark: '$($colors.brand.primary.value)',
        },
        secondary: {
          DEFAULT: '$($colors.brand.secondary.value)',
        },
        accent: {
          DEFAULT: '$($colors.brand.accent.value)',
        },

        // Semantic colors
        success: '$($colors.semantic.success.value)',
        warning: '$($colors.semantic.warning.value)',
        error: '$($colors.semantic.error.value)',
        info: '$($colors.semantic.info.value)',

        // Neutral scale
        neutral: {
          50: '$($colors.neutral.'50'.value)',
          100: '$($colors.neutral.'100'.value)',
          200: '$($colors.neutral.'200'.value)',
          300: '$($colors.neutral.'300'.value)',
          400: '$($colors.neutral.'400'.value)',
          500: '$($colors.neutral.'500'.value)',
          600: '$($colors.neutral.'600'.value)',
          700: '$($colors.neutral.'700'.value)',
          800: '$($colors.neutral.'800'.value)',
          900: '$($colors.neutral.'900'.value)',
        },
      },

      fontFamily: {
        sans: ['$($typography.fontFamilies.primary.web -replace "'", "")'],
        mono: ['$($typography.fontFamilies.mono.web -replace "'", "")'],
      },

      fontSize: {
        xs: ['$($typography.fontSizes.xs.rem)', { lineHeight: '1.5' }],
        sm: ['$($typography.fontSizes.sm.rem)', { lineHeight: '1.5' }],
        base: ['$($typography.fontSizes.base.rem)', { lineHeight: '1.5' }],
        lg: ['$($typography.fontSizes.lg.rem)', { lineHeight: '1.5' }],
        xl: ['$($typography.fontSizes.xl.rem)', { lineHeight: '1.375' }],
        '2xl': ['$($typography.fontSizes.'2xl'.rem)', { lineHeight: '1.375' }],
        '3xl': ['$($typography.fontSizes.'3xl'.rem)', { lineHeight: '1.25' }],
        '4xl': ['$($typography.fontSizes.'4xl'.rem)', { lineHeight: '1.25' }],
        '5xl': ['$($typography.fontSizes.'5xl'.rem)', { lineHeight: '1.25' }],
      },

      borderRadius: {
        none: '$($borders.radius.none.rem)',
        sm: '$($borders.radius.sm.rem)',
        DEFAULT: '$($borders.radius.md.rem)',
        md: '$($borders.radius.md.rem)',
        lg: '$($borders.radius.lg.rem)',
        xl: '$($borders.radius.xl.rem)',
        '2xl': '$($borders.radius.'2xl'.rem)',
        full: '$($borders.radius.full.rem)',
      },

      boxShadow: {
        xs: '$($shadows.elevation.xs.css)',
        sm: '$($shadows.elevation.sm.css)',
        DEFAULT: '$($shadows.elevation.md.css)',
        md: '$($shadows.elevation.md.css)',
        lg: '$($shadows.elevation.lg.css)',
        xl: '$($shadows.elevation.xl.css)',
        '2xl': '$($shadows.elevation.'2xl'.css)',
      },

      screens: {
        xs: '$($breakpoints.breakpoints.xs.min)px',
        sm: '$($breakpoints.breakpoints.sm.min)px',
        md: '$($breakpoints.breakpoints.md.min)px',
        lg: '$($breakpoints.breakpoints.lg.min)px',
        xl: '$($breakpoints.breakpoints.xl.min)px',
        '2xl': '$($breakpoints.breakpoints.'2xl'.min)px',
        '3xl': '$($breakpoints.breakpoints.'3xl'.min)px',
      },

      maxWidth: {
        'content-narrow': '$($breakpoints.contentMaxWidths.narrow)px',
        'content-default': '$($breakpoints.contentMaxWidths.default)px',
        'content-wide': '$($breakpoints.contentMaxWidths.wide)px',
        'content-full': '$($breakpoints.contentMaxWidths.full)px',
      },
    },
  },
};
"@

Set-Content -Path (Join-Path $OutputDir "tailwind.preset.js") -Value $tailwindPreset -Encoding UTF8

# ===== GENERATE css-variables.css =====
Write-Host "  📦 Generating css-variables.css..." -ForegroundColor Yellow

$cssVariables = @"
/* GENERATED CODE - DO NOT MODIFY BY HAND */
/* Generated from design-system/tokens/*.json */
/* Run: pwsh design-system/generators/generate-tailwind.ps1 */

:root {
  /* Brand Colors */
  --color-primary: $($colors.brand.primary.value);
  --color-secondary: $($colors.brand.secondary.value);
  --color-accent: $($colors.brand.accent.value);

  /* Semantic Colors */
  --color-success: $($colors.semantic.success.value);
  --color-warning: $($colors.semantic.warning.value);
  --color-error: $($colors.semantic.error.value);
  --color-info: $($colors.semantic.info.value);

  /* Neutral Colors */
  --color-neutral-50: $($colors.neutral.'50'.value);
  --color-neutral-100: $($colors.neutral.'100'.value);
  --color-neutral-200: $($colors.neutral.'200'.value);
  --color-neutral-300: $($colors.neutral.'300'.value);
  --color-neutral-400: $($colors.neutral.'400'.value);
  --color-neutral-500: $($colors.neutral.'500'.value);
  --color-neutral-600: $($colors.neutral.'600'.value);
  --color-neutral-700: $($colors.neutral.'700'.value);
  --color-neutral-800: $($colors.neutral.'800'.value);
  --color-neutral-900: $($colors.neutral.'900'.value);

  /* Light Theme */
  --theme-background: $($colors.themes.light.background);
  --theme-surface: $($colors.themes.light.surface);
  --theme-surface-variant: $($colors.themes.light.surfaceVariant);
  --theme-text: $($colors.themes.light.text);
  --theme-text-secondary: $($colors.themes.light.textSecondary);
  --theme-text-muted: $($colors.themes.light.textMuted);
  --theme-border: $($colors.themes.light.border);
  --theme-border-focus: $($colors.themes.light.borderFocus);

  /* Typography */
  --font-sans: $($typography.fontFamilies.primary.web);
  --font-mono: $($typography.fontFamilies.mono.web);

  /* Font Sizes */
  --text-xs: $($typography.fontSizes.xs.rem);
  --text-sm: $($typography.fontSizes.sm.rem);
  --text-base: $($typography.fontSizes.base.rem);
  --text-lg: $($typography.fontSizes.lg.rem);
  --text-xl: $($typography.fontSizes.xl.rem);
  --text-2xl: $($typography.fontSizes.'2xl'.rem);
  --text-3xl: $($typography.fontSizes.'3xl'.rem);
  --text-4xl: $($typography.fontSizes.'4xl'.rem);

  /* Border Radius */
  --radius-none: $($borders.radius.none.rem);
  --radius-sm: $($borders.radius.sm.rem);
  --radius-md: $($borders.radius.md.rem);
  --radius-lg: $($borders.radius.lg.rem);
  --radius-xl: $($borders.radius.xl.rem);
  --radius-2xl: $($borders.radius.'2xl'.rem);
  --radius-full: $($borders.radius.full.rem);

  /* Shadows */
  --shadow-xs: $($shadows.elevation.xs.css);
  --shadow-sm: $($shadows.elevation.sm.css);
  --shadow-md: $($shadows.elevation.md.css);
  --shadow-lg: $($shadows.elevation.lg.css);
  --shadow-xl: $($shadows.elevation.xl.css);
  --shadow-2xl: $($shadows.elevation.'2xl'.css);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, $($colors.gradients.primary.start) 0%, $($colors.gradients.primary.end) 100%);
  --gradient-hero: linear-gradient(135deg, $($colors.gradients.hero.start) 0%, $($colors.gradients.hero.end) 100%);
}

/* Dark Theme */
.dark, [data-theme="dark"] {
  --theme-background: $($colors.themes.dark.background);
  --theme-surface: $($colors.themes.dark.surface);
  --theme-surface-variant: $($colors.themes.dark.surfaceVariant);
  --theme-text: $($colors.themes.dark.text);
  --theme-text-secondary: $($colors.themes.dark.textSecondary);
  --theme-text-muted: $($colors.themes.dark.textMuted);
  --theme-border: $($colors.themes.dark.border);
  --theme-border-focus: $($colors.themes.dark.borderFocus);
}
"@

Set-Content -Path (Join-Path $OutputDir "css-variables.css") -Value $cssVariables -Encoding UTF8

Write-Host "✅ Tailwind/CSS files generated successfully!" -ForegroundColor Green
Write-Host "   Output: $OutputDir" -ForegroundColor Gray
