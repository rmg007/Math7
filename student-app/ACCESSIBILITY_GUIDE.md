# Accessibility Guide for Questerix Student App

**Version**: 1.0  
**Last Updated**: February 2, 2026  
**WCAG Compliance Target**: AA (2.1)

---

## Overview

The Questerix Student App is designed with accessibility as a core principle, ensuring all students can learn effectively regardless of their abilities. This guide explains the accessibility features and how to use them.

---

## ✨ Accessibility Features

### 1. **Screen Reader Support** 🔊

The app fully supports screen readers on all platforms:
- **iOS**: VoiceOver
- **Android**: TalkBack
- **Web**: NVDA, JAWS, VoiceOver (macOS)

#### What's Supported:
- ✅ All UI elements have proper labels
- ✅ Navigation announcements
- ✅ Question reading with answer choices
- ✅ Progress updates
- ✅ Error messages
- ✅ Success confirmations

#### How to Use:
**iOS (VoiceOver)**:
1. Go to Settings > Accessibility > VoiceOver
2. Toggle VoiceOver ON
3. Use swipe gestures to navigate
4. Double-tap to activate elements

**Android (TalkBack)**:
1. Go to Settings > Accessibility > TalkBack
2. Toggle TalkBack ON
3. Swipe to navigate
4. Double-tap to select

### 2. **High Contrast Mode** 🎨

Enhanced visual accessibility for students with low vision or color blindness.

#### Features:
- Increased text contrast (minimum 7:1 ratio)
- Thicker borders and outlines
- Reduced use of color-only indicators
- High-visibility focus indicators

#### How to Enable:
1. Open app settings (gear icon)
2. Go to "Accessibility"
3. Enable "High Contrast Mode"
4. App instantly updates visuals

#### What Changes:
- Background: Pure white (#FFFFFF)
- Text: Pure black (#000000)
- Borders: Thick, high-contrast outlines
- Buttons: Clear, bold appearance
- Icons: Simplified, high-contrast versions

### 3. **Text Scaling** 📏

Adjust text size for better readability.

#### Supported Scale:
- Minimum: 100% (default)
- Maximum: 300%
- Recommended: 150-200% for low vision

#### How to Adjust:
**System-Wide (Recommended)**:
- **iOS**: Settings > Accessibility > Display & Text Size > Larger Text
- **Android**: Settings > Accessibility > Font Size
- **Web**: Browser zoom (Ctrl/Cmd + Plus)

**App-Specific**:
- The app respects system font size settings
- Layouts automatically adjust to accommodate larger text
- No horizontal scrolling required

### 4. **Keyboard Navigation** ⌨️

Full keyboard support for web and desktop versions.

#### Keyboard Shortcuts:
| Action | Shortcut |
|--------|----------|
| Navigate forward | Tab |
| Navigate backward | Shift + Tab |
| Activate button | Enter or Space |
| Select answer | Arrow Keys + Enter |
| Submit question | Enter (when answer selected) |
| Next question | Right Arrow |
| Previous question | Left Arrow |
| Go to menu | Escape |

#### Visual Feedback:
- Clear focus indicators on all interactive elements
- Focus follows logical tab order
- No keyboard traps

### 5. **Reduced Motion** 🎬

Minimizes animations for users sensitive to motion.

#### Features:
- Removes page transitions
- Disables decorative animations
- Keeps essential animations (progress indicators)
- Respects system preferences

#### How to Enable:
**System-Wide (Recommended)**:
- **iOS**: Settings > Accessibility > Motion > Reduce Motion
- **Android**: Settings > Accessibility > Remove Animations
- **Web**: Browser/OS settings

**App automatically detects and adapts**

### 6. **Semantic Widgets** 📱

Custom accessible UI components:
- `SemanticButton`: Buttons with proper ARIA labels
- `SemanticCard`: Cards with descriptive labels
- `SemanticTextField`: Form inputs with hints and errors
- `SemanticDialog`: Modals with proper focus management

---

## 🎯 WCAG 2.1 AA Compliance

### Compliance Status

| Guideline | Level | Status | Notes |
|-----------|-------|--------|-------|
| **1.1 Text Alternatives** | A | ✅ Pass | All images have alt text |
| **1.3 Adaptable** | A | ✅ Pass | Content structure preserved |
| **1.4.3 Contrast (Minimum)** | AA | ✅ Pass | 4.5:1 for normal text |
| **1.4.6 Contrast (Enhanced)** | AAA | ✅ Pass | 7:1 in high contrast mode |
| **1.4.4 Resize Text** | AA | ✅ Pass | Up to 300% without loss |
| **2.1 Keyboard Accessible** | A | ✅ Pass | Full keyboard navigation |
| **2.4.3 Focus Order** | A | ✅ Pass | Logical tab order |
| **2.4.7 Focus Visible** | AA | ✅ Pass | Clear focus indicators |
| **2.5.3 Label in Name** | A | ✅ Pass | Accessible names match visible labels |
| **3.2 Predictable** | A | ✅ Pass | Consistent navigation |
| **3.3 Input Assistance** | A | ✅ Pass | Clear labels and error messages |
| **4.1.2 Name, Role, Value** | A | ✅ Pass | Proper ARIA attributes |

### Tested With:
- ✅ **VoiceOver** (iOS 17+)
- ✅ **TalkBack** (Android 12+)
- ✅ **NVDA** (Windows, latest)
- ✅ **Keyboard Only** (Tab navigation)
- ✅ **High Contrast Mode**
- ✅ **Text Scaling** (up to 300%)

---

## 🛠️ For Developers

### Adding Accessible Widgets

#### Use Semantic Widgets:
```dart
// Instead of regular Button
SemanticButton(
  label: 'Submit Answer',
  hint: 'Submits your current answer',
  onPressed: _handleSubmit,
  child: Text('Submit'),
)

// Instead of regular Card
SemanticCard(
  label: 'Algebra Domain',
  hint: 'Tap to view algebra skills',
  onTap: () => navigateToSkills('algebra'),
  child: DomainCardContent(),
)
```

#### Check Semantics:
```dart
// In widget tests
final semantics = tester.getSemantics(find.text('Submit'));
expect(semantics.label, equals('Submit Answer'));
expect(semantics.hint, equals('Submits your current answer'));
```

### Testing Accessibility

#### Manual Testing:
1. Enable screen reader
2. Navigate through entire app
3. Verify all elements are announced
4. Check focus order makes sense

#### Automated Testing:
```bash
flutter test test/accessibility/
```

---

## 📚 Additional Resources

### Learn More:
- [Flutter Accessibility Guide](https://docs.flutter.dev/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://m3.material.io/foundations/accessible-design/overview)

### Report Issues:
If you encounter accessibility issues, please contact:
- **Email**: accessibility@questerix.com
- **GitHub**: Create an issue with [ACCESSIBILITY] tag

---

## 🎉 Success Stories

> "My son who uses VoiceOver can now independently practice math problems!"  
> *- Parent of 7th grader*

> "High contrast mode makes it so much easier for me to read questions."  
> *- Student with low vision*

> "I can navigate everything with just my keyboard - it's perfect!"  
> *- Student with motor impairment*

---

**Accessibility is not a feature, it's a fundamental right. We're committed to making Questerix usable by everyone.**
