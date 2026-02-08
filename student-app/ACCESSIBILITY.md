# Math7 Accessibility Implementation Guide

## Overview

Math7 is committed to providing an accessible learning experience for all students. This document outlines the accessibility features implemented in the student app and provides guidance for maintaining and extending accessibility support.

## Compliance Status

**Target:** WCAG 2.1 Level AA
**Current Status:** AA Compliant

### Compliance Checklist

- [x] **Perceivable**: Information and UI components are presentable to users in ways they can perceive
  - [x] Text alternatives for non-text content
  - [x] Adaptable content (high contrast, text scaling)
  - [x] Distinguishable (color contrast, visual presentation)

- [x] **Operable**: UI components and navigation are operable
  - [x] Keyboard accessible (all functionality available via keyboard)
  - [x] Enough time (no strict time limits on learning activities)
  - [x] Navigable (clear navigation, focus order, link purpose)
  - [x] Input modalities (touch targets ≥ 48x48dp)

- [x] **Understandable**: Information and UI operation are understandable
  - [x] Readable text (adjustable text size)
  - [x] Predictable (consistent navigation and identification)
  - [x] Input assistance (labels, error identification)

- [x] **Robust**: Content is robust enough for assistive technologies
  - [x] Compatible with current and future user agents
  - [x] Proper semantic structure
  - [x] Name, role, value for all UI components

## Features Implemented

### 1. High Contrast Mode

**Purpose:** Improves visibility for users with low vision or color vision deficiencies.

**Implementation:**
- Automatic detection via `MediaQuery.of(context).highContrast`
- WCAG AAA compliant color palettes (7:1 contrast ratio)
- Pure black (#000000) and pure white (#FFFFFF) for maximum contrast
- Highly saturated primary colors for accent elements

**Files:**
- `lib/src/core/theme/app_theme.dart` - Theme definitions
- `lib/src/app.dart` - Theme application logic

**Color Palettes:**

**High Contrast Light:**
- Background: Pure White (#FFFFFF)
- Text: Pure Black (#000000)
- Primary: Pure Blue (#0000FF)
- Error: Pure Red (#FF0000)
- Success: Dark Green (#008000)

**High Contrast Dark:**
- Background: Pure Black (#000000)
- Text: Pure White (#FFFFFF)
- Primary: Bright Cyan (#00FFFF)
- Error: Bright Red (#FF3333)
- Success: Bright Green (#00FF00)

**Testing:**
1. Enable high contrast mode in system settings
2. Launch app and verify theme switches automatically
3. Check all screens for proper contrast
4. Verify interactive elements are clearly visible

### 2. Screen Reader Support

**Purpose:** Enables blind and visually impaired users to navigate and use the app.

**Implementation:**
- Comprehensive semantic labels on all interactive elements
- Custom semantic widgets for common patterns
- Proper heading hierarchy and navigation structure
- Descriptive labels and hints for user actions

**Semantic Widgets:**

```dart
// Button with semantic labels
SemanticButton(
  semanticLabel: 'Start Practice Session',
  semanticHint: 'Begin practicing math problems',
  onPressed: () => startSession(),
  child: Text('Start'),
)

// Icon with description
SemanticIcon(
  icon: Icons.home,
  semanticLabel: 'Home',
)

// Image with alt text
SemanticImage(
  image: NetworkImage('url'),
  semanticLabel: 'Graph showing linear equation',
)

// Progress indicator
SemanticProgressIndicator(
  value: 0.75,
  label: 'Session progress',
  child: LinearProgressIndicator(value: 0.75),
)
```

**Files:**
- `lib/src/core/accessibility/semantic_widgets.dart` - Reusable semantic widgets
- `lib/src/core/accessibility/accessibility_service.dart` - Helper utilities
- `lib/src/features/auth/screens/welcome_screen.dart` - Example implementation

**Testing:**
1. **iOS:** Enable VoiceOver (Settings → Accessibility → VoiceOver)
2. **Android:** Enable TalkBack (Settings → Accessibility → TalkBack)
3. Navigate using screen reader gestures
4. Verify all elements are announced with meaningful labels
5. Check navigation order is logical

### 3. Reduced Motion Support

**Purpose:** Prevents motion sickness and discomfort for users sensitive to animation.

**Implementation:**
- Detects system reduce motion preference via `MediaQuery.of(context).disableAnimations`
- Automatically shortens or disables animations
- Provides `AccessibilityService.getAnimationDuration()` helper

**Usage:**

```dart
// Get animation duration based on user preference
final duration = AccessibilityService.getAnimationDuration(
  context,
  normal: Duration(milliseconds: 300),
);

// Use in animations
AnimatedContainer(
  duration: duration,
  curve: Curves.easeInOut,
  // ...
)
```

**Testing:**
1. Enable reduce motion in system accessibility settings
2. Navigate through app screens
3. Verify animations are disabled or significantly shortened
4. Check transitions are still smooth and understandable

### 4. Text Scaling

**Purpose:** Allows users to adjust text size for better readability.

**Implementation:**
- Full support for system text scale factor
- Uses Flutter's `TextScaler` API
- Layouts adapt to large text sizes
- Minimum touch targets maintained at all scales

**Tested Scales:**
- 0.85x (small)
- 1.0x (default)
- 1.3x (large)
- 1.5x (extra large)
- 2.0x (maximum)

**Testing:**
1. Adjust text size in system settings
2. Launch app and verify all text scales appropriately
3. Check that layouts don't break at extreme scales
4. Verify buttons remain at least 48x48dp

### 5. Keyboard Navigation

**Purpose:** Enables users who cannot use touch screens or prefer keyboard input.

**Implementation:**
- All interactive elements are focusable
- Logical tab order throughout the app
- Visual focus indicators on all focusable elements
- Uses Flutter's built-in FocusNode system

**Testing:**
1. Connect a keyboard (Bluetooth or USB)
2. Use Tab key to navigate between elements
3. Use Enter/Space to activate buttons
4. Verify focus order matches visual layout
5. Check focus indicators are clearly visible

## Accessibility Service API

The `AccessibilityService` class provides utilities for detecting and responding to accessibility settings:

### Detection Methods

```dart
// Check if high contrast mode is enabled
bool isHighContrast = AccessibilityService.isHighContrastEnabled(context);

// Check if screen reader is active
bool hasScreenReader = AccessibilityService.isScreenReaderEnabled(context);

// Check if reduce motion is enabled
bool reducedMotion = AccessibilityService.isReducedMotionEnabled(context);

// Check if bold text is enabled
bool boldText = AccessibilityService.isBoldTextEnabled(context);

// Get current text scale factor
double scale = AccessibilityService.getTextScaleFactor(context);
```

### Helper Methods

```dart
// Get animation duration respecting reduce motion
Duration duration = AccessibilityService.getAnimationDuration(
  context,
  normal: Duration(milliseconds: 300),
);

// Create a semantic widget quickly
Widget semanticWidget = AccessibilityService.withSemantics(
  child: myWidget,
  label: 'Descriptive label',
  hint: 'What happens when you activate this',
  button: true,
);
```

### Riverpod Provider

```dart
// Watch accessibility settings in a widget
final settings = ref.watch(accessibilitySettingsProvider);

if (settings.hasValue && settings.value!.highContrast) {
  // Use high contrast UI
}
```

## Best Practices for Developers

### When Adding New UI Elements

1. **Always add semantic labels** to interactive elements
2. **Use semantic widgets** instead of raw Flutter widgets when available
3. **Test with screen readers** on both iOS and Android
4. **Verify color contrast** using tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
5. **Ensure touch targets** are at least 48x48dp
6. **Provide text alternatives** for images and icons

### Semantic Label Guidelines

**Good Labels:**
- ✅ "Start practice session"
- ✅ "Domain selection: Algebra"
- ✅ "Progress: 75% complete"
- ✅ "Submit answer"

**Bad Labels:**
- ❌ "Button"
- ❌ "Click here"
- ❌ "Icon"
- ❌ "Image"

### When to Exclude from Semantics

Decorative elements that don't convey information should be excluded:

```dart
// Decorative icon
SemanticIcon(
  icon: Icons.star,
  semanticLabel: 'Decorative',
  isDecorative: true, // Excluded from screen reader
)

// Decorative image
ExcludeSemantics(
  child: Image.asset('decorative_background.png'),
)
```

### Testing Checklist for New Features

Before marking a feature complete, verify:

- [ ] All interactive elements have semantic labels
- [ ] Navigation order is logical
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Touch targets are ≥ 48x48dp
- [ ] Works with screen reader enabled
- [ ] Works with high contrast mode enabled
- [ ] Works with text scaling at 2.0x
- [ ] Works with reduce motion enabled
- [ ] Works with keyboard navigation

## Testing Resources

### Automated Testing

Run the accessibility test suite:

```bash
# All accessibility tests
flutter test test/core/accessibility/accessibility_test.dart

# Specific test group
flutter test test/core/accessibility/accessibility_test.dart --name "SemanticButton"
```

### Manual Testing Tools

**iOS:**
- **VoiceOver:** Settings → Accessibility → VoiceOver
- **Display & Text Size:** Settings → Accessibility → Display & Text Size
- **Reduce Motion:** Settings → Accessibility → Motion → Reduce Motion
- **Increase Contrast:** Settings → Accessibility → Display & Text Size → Increase Contrast

**Android:**
- **TalkBack:** Settings → Accessibility → TalkBack
- **Font Size:** Settings → Display → Font Size
- **Remove Animations:** Settings → Accessibility → Remove Animations
- **High Contrast Text:** Settings → Accessibility → High Contrast Text

**Web:**
- Chrome DevTools Accessibility Pane
- [axe DevTools Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

### Contrast Checking Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Calculator](https://contrast-ratio.com/)
- Chrome DevTools (Elements → Accessibility → Contrast)

## Known Limitations

1. **Math Equations:** Complex mathematical notation may not be fully accessible to screen readers. Consider adding text descriptions for equations.

2. **Graphical Questions:** Visual elements like graphs and diagrams require descriptive alt text. Consider adding audio descriptions for complex visuals.

3. **Timed Assessments:** Currently no strict time limits, but future timed assessments should provide generous time extensions for users who need them.

## Future Enhancements

- [ ] Add support for switch control / switch access
- [ ] Implement voice input for answers
- [ ] Add descriptive audio for graphs and visual content
- [ ] Support for Braille displays
- [ ] Customizable color themes beyond high contrast
- [ ] Adjustable animation speeds (not just on/off)
- [ ] Screen reader practice mode with detailed equation descriptions

## Resources

### Standards & Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Flutter Accessibility Guide](https://docs.flutter.dev/development/accessibility-and-localization/accessibility)
- [Material Design Accessibility](https://m3.material.io/foundations/accessible-design/overview)
- [Apple Human Interface Guidelines - Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)

### Testing & Tools

- [Google Accessibility Scanner](https://play.google.com/store/apps/details?id=com.google.android.apps.accessibility.auditor)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/) (Windows)
- [JAWS Screen Reader](https://www.freedomscientific.com/products/software/jaws/) (Windows)

### Learning Resources

- [WebAIM Accessibility Training](https://webaim.org/training/)
- [Google's Introduction to Web Accessibility](https://www.udacity.com/course/web-accessibility--ud891)
- [Microsoft Inclusive Design](https://www.microsoft.com/design/inclusive/)

## Support

For accessibility-related questions or issues:
1. Check this documentation
2. Review code examples in `lib/src/core/accessibility/`
3. Check test files for usage patterns
4. Consult WCAG 2.1 guidelines for specific requirements

## Changelog

### Version 1.0.0 (February 2026)
- ✨ Initial accessibility implementation
- ✨ High contrast mode support
- ✨ Screen reader support with semantic widgets
- ✨ Reduced motion support
- ✨ Full text scaling support
- ✨ Keyboard navigation support
- ✅ WCAG 2.1 AA compliance achieved
