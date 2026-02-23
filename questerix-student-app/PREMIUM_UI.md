# Premium UI Standards — Questerix Student App

This document outlines the visual and interaction standards for the Questerix Student App. As the "Mobile Engineer", you are responsible for maintaining these standards.

## 🎨 Design Tokens

All UI elements must derive their styles from the central token system. **NEVER** use literal values for colors or dimensions.

### 1. Colors (`AppColors`)

Located in: `lib/src/core/theme/generated/app_colors.g.dart`

- **Primary**: Brand identity. Used for primary buttons and active states.
- **Secondary/Accent**: Decorative or subtle accents.
- **Surface**: Background colors for cards and screens.
- **Feedback**: `AppColors.error`, `AppColors.success`, `AppColors.warning`.

### 2. Spacing & Layout (`AppSpacing`)

Located in: `lib/src/core/theme/generated/app_spacing.g.dart`

- Use `AppSpacing.space4`, `AppSpacing.space16`, etc., for all margins and paddings.
- Standard screen margin: `AppSpacing.screenMargin`.

### 3. Typography (`AppTypography`)

- **Headers**: Outfit (SemiBold/Bold)
- **Body**: Inter (Regular/Medium)
- Use `context.textTheme.headlineLarge` etc., via the `ThemeData`.

---

## ✨ Premium Interactions

### Micro-Animations

A premium app feels alive. Use these techniques:

1. **Implicit Animations**: Use `AnimatedContainer`, `AnimatedOpacity`, and `AnimatedPadding` for state transitions.
2. **Page Transitions**: Use `CupertinoPageRoute` or custom `PageTransitionsBuilder` for smooth side-swap or fade-through effects.
3. **Skeleton Loaders**: Never show a blank screen or a simple spinner. Use `shimmer` package for skeleton content while loading.

### Feedback

1. **Vibrations**: Call `HapticFeedback.lightImpact()` on tap and `HapticFeedback.heavyImpact()` on success/error.
2. **Success States**: Use a "Success Sheet" or a celebratory animation (Lottie) after significant milestones (e.g., finishing a quiz).

---

## 🛠 Usage Examples

### Using Theme Extension

```dart
Container(
  padding: EdgeInsets.all(AppSpacing.md),
  decoration: BoxDecoration(
    color: AppColors.surface,
    boxShadow: [AppShadows.md],
    borderRadius: AppBorders.lg,
  ),
  child: Text(
    'Premium Content',
    style: context.textTheme.titleMedium.copyWith(
      color: AppColors.textPrimary,
    ),
  ),
)
```

### Implementing Responsive Layouts

Always use `LayoutBuilder` or the `Breakpoints` tokens to handle iPad vs. Phone viewports.

```dart
if (MediaQuery.of(context).size.width > AppBreakpoints.tablet) {
  // Desktop/Tablet rail layout
} else {
  // Mobile bottom nav layout
}
```
