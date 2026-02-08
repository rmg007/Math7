# Accessibility Implementation Plan

## Status
**Current:** Documented / Implementation Pending
**Target:** WCAG 2.1 AA Compliance

## 1. high Priority: "Quick Wins" (Immediate Action)

These changes require minimal effort but provide significant value to screen reader users.

### A. Semantic Labeling in Question Widgets
**Objective:** Ensure screen readers announce "Question X of Y" and the question content clearly.

**Implementation Pattern:**
```dart
// Wrap the main question container
Semantics(
  label: 'Question ${currentIndex + 1} of ${totalQuestions}',
  hint: 'Double tap to select an answer',
  child: Column(
    children: [
      // ... content
    ],
  ),
)
```

**Target Widgets:**
* `McqSingleWidget`
* `McqMultiWidget`
* `BooleanWidget`
* `TextInputWidget`

### B. Header Semantics
**Objective:** Ensure the app bar or screen title is read as a header.

```dart
Semantics(
  header: true,
  child: Text('Domain: Algebra'),
)
```

## 2. Medium Priority: Keyboard & Navigation

### A. Focus Order
**Problem:** Default traversal order might skip elements or go in an illogical order.
**Solution:** Use `FocusTraversalGroup` to define clear zones (e.g., Question Text -> Options -> Action Button).

### B. Action Buttons
**Requirement:** All interactive buttons (Next, Submit, Verify) must have:
1. `Tooltip` property set.
2. `Semantics(button: true)` (usually automatic for `ElevatedButton`).
3. Distinct label if the text is icon-only.

## 3. High Contrast & Visual Accessibility

### A. Dynamic Text Sizing
**Requirement:** All `Text` widgets must use `MediaQuery.textScaleFactor` (handled by default in Flutter if not explicitly overridden with fixed sizes).
* **Audit:** Check for `fontSize: 14` vs `style: Theme.of(context).textTheme.bodyMedium`.

### B. Color Contrast
**Standard:** Text must have a 4.5:1 contrast ratio against the background.
**Action:** Review the `AppTheme` colors. Ensure the 'primary' color text on 'background' meets this ratio.

## 4. Voice Control Integration (Future)

**Plan:**
* Integrate platform specific voice control APIs.
* Add "Speak Question" button using `flutter_tts` for users with reading difficulties (dyslexia considerations).

## Implementation Checklist

- [ ] Audit all Question Widgets for `Semantics`.
- [ ] Add `Semantics(label: ...)` to progress bars.
- [ ] Verify Tab order on Web build.
- [ ] Test with TalkBack (Android) and VoiceOver (iOS).
