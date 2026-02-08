# Unified Design System Plan: Questerix

## Executive Summary

This plan addresses the critical design fragmentation across the Questerix platform by establishing a **Single Source of Truth** design system that generates platform-specific outputs for Flutter, React, and CSS.

---

## Part 1: Current State Audit

### Design System Fragmentation Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CURRENT STATE (Fragmented)                      │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│    Admin Panel      │   Landing Pages     │       Student App           │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ Framework:          │ Framework:          │ Framework:                  │
│ React + shadcn/ui   │ React + Vite        │ Flutter                     │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ Icons:              │ Icons:              │ Icons:                      │
│ Lucide React ✅     │ Lucide React ✅     │ Material Icons ❌           │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ Colors:             │ Colors:             │ Colors:                     │
│ CSS Variables       │ Tailwind Config     │ Dart Color constants        │
│ --primary: 195 95%  │ primary: #1a1a2e    │ primaryColor: 0xFF319795   │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ Typography:         │ Typography:         │ Typography:                 │
│ Inter (shadcn)      │ System fonts        │ Material Type Scale         │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ Spacing:            │ Spacing:            │ Spacing:                    │
│ Tailwind scale      │ Tailwind scale      │ Custom EdgeInsets           │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ Dark Mode:          │ Dark Mode:          │ Dark Mode:                  │
│ ✅ Full support     │ ❌ Not implemented  │ ✅ Full support             │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
```

### Critical Inconsistencies

| Token Type | Admin Panel | Landing Pages | Student App |
|------------|-------------|---------------|-------------|
| **Primary** | `hsl(195, 95%, 38%)` | `#1a1a2e` | `0xFF319795` |
| **Background** | `hsl(0, 0%, 100%)` | `#0a0a0f` | `Colors.white` |
| **Border Radius** | `0.5rem` | `12px` | `BorderRadius.circular(12)` |
| **Font Family** | Inter | System | Roboto |

---

## Part 2: Target Architecture

### Unified Design System Structure

```
design-system/                    ← NEW: Shared package
├── tokens/                       ← Source of Truth
│   ├── colors.json               ← All color definitions
│   ├── typography.json           ← Font scales & families
│   ├── spacing.json              ← Spacing scale (4, 8, 12, 16...)
│   ├── shadows.json              ← Elevation levels
│   ├── borders.json              ← Radius & widths
│   └── breakpoints.json          ← Responsive breakpoints
│
├── icons/                        ← Unified Icon Set
│   ├── lucide-subset.json        ← Selected icons from Lucide
│   ├── custom/                   ← Brand-specific icons (AI-generated)
│   │   ├── questerix-logo.svg
│   │   ├── mastery-badge.svg
│   │   └── ...
│   └── mappings.json             ← Icon name → usage mapping
│
├── generators/                   ← Platform Generators
│   ├── generate-all.ps1          ← Master script
│   ├── flutter/
│   │   ├── app_colors.dart       ← Output: Color constants
│   │   ├── app_typography.dart   ← Output: TextStyles
│   │   ├── app_spacing.dart      ← Output: Spacing constants
│   │   └── app_theme.dart        ← Output: ThemeData
│   │
│   ├── tailwind/
│   │   ├── tailwind.preset.js    ← Output: Tailwind preset
│   │   └── css-variables.css     ← Output: CSS custom properties
│   │
│   └── figma/
│       └── tokens.json           ← Output: Figma-compatible tokens
│
├── docs/
│   ├── USAGE.md                  ← How to use in each app
│   ├── CONTRIBUTING.md           ← How to add new tokens
│   └── CHANGELOG.md              ← Version history
│
└── package.json                  ← npm package for generators
```

### Token Flow Diagram

```
                    ┌─────────────────────┐
                    │   tokens/*.json     │
                    │  (Single Source)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   generate-all.ps1  │
                    │   (Build Script)    │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Flutter Theme  │  │  Tailwind CSS   │  │   Figma Sync    │
│                 │  │                 │  │                 │
│ app_colors.dart │  │ tailwind.preset │  │  tokens.json    │
│ app_theme.dart  │  │ variables.css   │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   student-app/          admin-panel/          Design Files
                        landing-pages/
```

---

## Part 3: Token Definitions

### 3.1 Color Token Schema

```json
// tokens/colors.json
{
  "$schema": "design-tokens",
  "version": "1.0.0",
  
  "brand": {
    "primary": {
      "value": "#319795",
      "description": "Teal - Primary brand color",
      "usage": "CTAs, active states, links"
    },
    "secondary": {
      "value": "#6B46C1",
      "description": "Purple - Secondary accent",
      "usage": "Gradients, highlights"
    },
    "accent": {
      "value": "#ED8936",
      "description": "Orange - Attention",
      "usage": "Points, rewards, badges"
    }
  },
  
  "semantic": {
    "success": { "value": "#38A169" },
    "warning": { "value": "#D69E2E" },
    "error": { "value": "#E53E3E" },
    "info": { "value": "#3182CE" }
  },
  
  "neutral": {
    "50": { "value": "#F7FAFC" },
    "100": { "value": "#EDF2F7" },
    "200": { "value": "#E2E8F0" },
    "300": { "value": "#CBD5E0" },
    "400": { "value": "#A0AEC0" },
    "500": { "value": "#718096" },
    "600": { "value": "#4A5568" },
    "700": { "value": "#2D3748" },
    "800": { "value": "#1A202C" },
    "900": { "value": "#171923" }
  },
  
  "themes": {
    "light": {
      "background": { "$ref": "neutral.50" },
      "surface": { "value": "#FFFFFF" },
      "text": { "$ref": "neutral.800" },
      "textMuted": { "$ref": "neutral.500" },
      "border": { "$ref": "neutral.200" }
    },
    "dark": {
      "background": { "$ref": "neutral.900" },
      "surface": { "$ref": "neutral.800" },
      "text": { "$ref": "neutral.50" },
      "textMuted": { "$ref": "neutral.400" },
      "border": { "$ref": "neutral.700" }
    }
  }
}
```

### 3.2 Typography Token Schema

```json
// tokens/typography.json
{
  "fontFamilies": {
    "primary": {
      "value": "Inter, system-ui, sans-serif",
      "flutter": "Inter"
    },
    "mono": {
      "value": "JetBrains Mono, monospace",
      "flutter": "JetBrains Mono"
    }
  },
  
  "fontSizes": {
    "xs": { "value": "12px", "flutter": 12 },
    "sm": { "value": "14px", "flutter": 14 },
    "base": { "value": "16px", "flutter": 16 },
    "lg": { "value": "18px", "flutter": 18 },
    "xl": { "value": "20px", "flutter": 20 },
    "2xl": { "value": "24px", "flutter": 24 },
    "3xl": { "value": "30px", "flutter": 30 },
    "4xl": { "value": "36px", "flutter": 36 }
  },
  
  "fontWeights": {
    "normal": { "value": 400 },
    "medium": { "value": 500 },
    "semibold": { "value": 600 },
    "bold": { "value": 700 }
  },
  
  "lineHeights": {
    "tight": { "value": 1.25 },
    "normal": { "value": 1.5 },
    "relaxed": { "value": 1.75 }
  }
}
```

### 3.3 Spacing Token Schema

```json
// tokens/spacing.json
{
  "scale": {
    "0": { "value": "0px", "flutter": 0 },
    "1": { "value": "4px", "flutter": 4 },
    "2": { "value": "8px", "flutter": 8 },
    "3": { "value": "12px", "flutter": 12 },
    "4": { "value": "16px", "flutter": 16 },
    "5": { "value": "20px", "flutter": 20 },
    "6": { "value": "24px", "flutter": 24 },
    "8": { "value": "32px", "flutter": 32 },
    "10": { "value": "40px", "flutter": 40 },
    "12": { "value": "48px", "flutter": 48 },
    "16": { "value": "64px", "flutter": 64 }
  },
  
  "semantic": {
    "pageMargin": { "$ref": "scale.4" },
    "cardPadding": { "$ref": "scale.4" },
    "inputPadding": { "$ref": "scale.3" },
    "buttonPadding": { "x": { "$ref": "scale.4" }, "y": { "$ref": "scale.2" } }
  }
}
```

### 3.4 Border & Shadow Token Schema

```json
// tokens/borders.json
{
  "radius": {
    "none": { "value": "0px", "flutter": 0 },
    "sm": { "value": "4px", "flutter": 4 },
    "md": { "value": "8px", "flutter": 8 },
    "lg": { "value": "12px", "flutter": 12 },
    "xl": { "value": "16px", "flutter": 16 },
    "full": { "value": "9999px", "flutter": 9999 }
  },
  
  "width": {
    "thin": { "value": "1px", "flutter": 1 },
    "medium": { "value": "2px", "flutter": 2 },
    "thick": { "value": "4px", "flutter": 4 }
  }
}
```

```json
// tokens/shadows.json
{
  "elevation": {
    "none": { "value": "none" },
    "sm": { 
      "value": "0 1px 2px rgba(0,0,0,0.05)",
      "flutter": { "blurRadius": 2, "offset": [0, 1], "opacity": 0.05 }
    },
    "md": { 
      "value": "0 4px 6px rgba(0,0,0,0.1)",
      "flutter": { "blurRadius": 6, "offset": [0, 4], "opacity": 0.1 }
    },
    "lg": { 
      "value": "0 10px 15px rgba(0,0,0,0.1)",
      "flutter": { "blurRadius": 15, "offset": [0, 10], "opacity": 0.1 }
    },
    "xl": { 
      "value": "0 20px 25px rgba(0,0,0,0.15)",
      "flutter": { "blurRadius": 25, "offset": [0, 20], "opacity": 0.15 }
    }
  }
}
```

---

## Part 4: Icon Strategy

### Current Icon Audit

| App | Icon Library | Count | Format |
|-----|--------------|-------|--------|
| Admin Panel | Lucide React | ~40 | React Components |
| Landing Pages | Lucide React | ~15 | React Components |
| Student App | Material Icons | ~25 | IconData (font) |

### Unified Icon Approach

**Decision: Standardize on Lucide**

| Aspect | Recommendation |
|--------|----------------|
| Library | Lucide (consistent across React & Flutter) |
| Flutter Package | `lucide_icons` (pub.dev) |
| Custom Icons | AI-generated SVGs in Lucide style |
| Icon Size Scale | 16, 20, 24, 32, 48 (match text sizes) |

### Icon Migration Map

```
Material Icons → Lucide Equivalents
──────────────────────────────────────────────
Icons.home           → LucideIcons.home
Icons.school         → LucideIcons.graduationCap
Icons.settings       → LucideIcons.settings
Icons.menu           → LucideIcons.menu
Icons.arrow_back     → LucideIcons.arrowLeft
Icons.check          → LucideIcons.check
Icons.close          → LucideIcons.x
Icons.star           → LucideIcons.star
Icons.play_arrow     → LucideIcons.play
Icons.pause          → LucideIcons.pause
```

### Custom Icon Set (AI-Generated)

```
custom/
├── brand/
│   ├── questerix-logo.svg
│   ├── questerix-monogram.svg
│   └── questerix-wordmark.svg
│
├── features/
│   ├── mastery-badge-bronze.svg
│   ├── mastery-badge-silver.svg
│   ├── mastery-badge-gold.svg
│   ├── streak-flame.svg
│   ├── points-star.svg
│   └── skill-tree.svg
│
└── illustrations/
    ├── empty-state-learn.svg
    ├── empty-state-progress.svg
    └── success-celebration.svg
```

---

## Part 5: Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal: Create token infrastructure**

| Task | Description | Effort |
|------|-------------|--------|
| 1.1 | Create `design-system/` directory structure | 1h |
| 1.2 | Define `colors.json` (use Admin Panel as base) | 2h |
| 1.3 | Define `typography.json` | 1h |
| 1.4 | Define `spacing.json`, `borders.json`, `shadows.json` | 1h |
| 1.5 | Create Flutter generator script | 3h |
| 1.6 | Create Tailwind generator script | 2h |
| 1.7 | Add `generate-all.ps1` to orchestrator | 1h |

**Deliverable:** Working token → code generation pipeline

---

### Phase 2: Flutter Migration (Week 2)
**Goal: Student App uses generated theme**

| Task | Description | Effort |
|------|-------------|--------|
| 2.1 | Generate `app_colors.dart` from tokens | Auto |
| 2.2 | Generate `app_theme.dart` from tokens | Auto |
| 2.3 | Replace hardcoded colors with token references | 4h |
| 2.4 | Add `lucide_icons` package | 0.5h |
| 2.5 | Replace Material Icons with Lucide | 3h |
| 2.6 | Verify all screens render correctly | 2h |

**Deliverable:** Student App uses unified design tokens

---

### Phase 3: React Migration (Week 2-3)
**Goal: Admin Panel & Landing Pages use shared tokens**

| Task | Description | Effort |
|------|-------------|--------|
| 3.1 | Generate `tailwind.preset.js` from tokens | Auto |
| 3.2 | Generate `css-variables.css` from tokens | Auto |
| 3.3 | Update Admin Panel `tailwind.config.js` to extend preset | 1h |
| 3.4 | Update Landing Pages `tailwind.config.js` to extend preset | 1h |
| 3.5 | Replace hardcoded values with CSS variables | 3h |
| 3.6 | Verify all pages render correctly | 2h |

**Deliverable:** All React apps use unified design tokens

---

### Phase 4: Responsive Layer (Week 3)
**Goal: Add responsive breakpoints to token system**

| Task | Description | Effort |
|------|-------------|--------|
| 4.1 | Add `breakpoints.json` to tokens | 0.5h |
| 4.2 | Generate Flutter `Breakpoints` class | Auto |
| 4.3 | Verify Tailwind breakpoints match tokens | 0.5h |
| 4.4 | Implement `ResponsiveBuilder` widget in Flutter | 2h |
| 4.5 | Apply responsive design per earlier plan | 8h |

**Deliverable:** Consistent responsive breakpoints across all apps

---

### Phase 5: Documentation & Governance (Week 4)
**Goal: Ensure long-term maintainability**

| Task | Description | Effort |
|------|-------------|--------|
| 5.1 | Create `USAGE.md` with examples | 2h |
| 5.2 | Create `CONTRIBUTING.md` for token changes | 1h |
| 5.3 | Add token validation to CI/CD | 2h |
| 5.4 | Create visual token documentation (Storybook-like) | 4h |

**Deliverable:** Self-documenting, governed design system

---

## Part 6: Governance Model

### Token Change Process

```
1. Developer wants to add/change a token
           │
           ▼
2. Edit tokens/*.json in design-system/
           │
           ▼
3. Run `generate-all.ps1` locally
           │
           ▼
4. Verify changes in each app
           │
           ▼
5. Commit all changes together (atomic)
           │
           ▼
6. CI validates token schema
           │
           ▼
7. Orchestrator runs generators on deploy
```

### Version Strategy

| Version | Breaking Changes | Migration |
|---------|------------------|-----------|
| 1.0.x | Patch - no breaking changes | Auto-update safe |
| 1.x.0 | Minor - new tokens added | No action needed |
| x.0.0 | Major - tokens renamed/removed | Migration guide required |

---

## Part 7: Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| **Unique color values** | ~45 across apps | 1 (tokens.json) |
| **Icon libraries** | 2 (Material, Lucide) | 1 (Lucide) |
| **Theme files** | 5+ per app | 1 generated per app |
| **Design sync time** | Manual (hours) | Automated (<1 min) |
| **Brand consistency** | ⚠️ Variable | ✅ Guaranteed |

---

## Part 8: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lucide missing icons we need | Low | Medium | Add custom icons |
| Generator breaks on edge case | Medium | High | Unit tests for generators |
| Token schema becomes complex | Medium | Medium | Strict validation, linting |
| Team forgets to regenerate | High | High | CI enforcement |

---

## Summary

### Total Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Foundation | 11 hours | 🔴 Critical |
| Phase 2: Flutter Migration | 10 hours | 🔴 Critical |
| Phase 3: React Migration | 7 hours | 🟡 High |
| Phase 4: Responsive Layer | 11 hours | 🟡 High |
| Phase 5: Documentation | 9 hours | 🟢 Medium |

**Total: ~48 hours (1-2 weeks)**

### Key Decisions

1. **Single Source of Truth:** `design-system/tokens/*.json`
2. **Icon Standard:** Lucide (all platforms)
3. **Generation:** Build-time, not runtime
4. **Typography:** Inter font family (all platforms)
5. **Color Palette:** Based on Admin Panel (teal primary)
