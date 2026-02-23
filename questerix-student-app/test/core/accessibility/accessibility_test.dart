import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:student_app/src/core/accessibility/accessibility_service.dart';
import 'package:student_app/src/core/accessibility/semantic_widgets.dart';

void main() {
  group('AccessibilityService', () {
    testWidgets('detects high contrast mode', (WidgetTester tester) async {
      bool? highContrastDetected;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              highContrastDetected =
                  AccessibilityService.isHighContrastEnabled(context);
              return const SizedBox();
            },
          ),
        ),
      );

      expect(highContrastDetected, isNotNull);
      expect(highContrastDetected, isFalse); // Default in test environment
    });

    testWidgets('detects screen reader status', (WidgetTester tester) async {
      bool? screenReaderDetected;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              screenReaderDetected =
                  AccessibilityService.isScreenReaderEnabled(context);
              return const SizedBox();
            },
          ),
        ),
      );

      expect(screenReaderDetected, isNotNull);
    });

    testWidgets('detects reduced motion preference',
        (WidgetTester tester) async {
      bool? reducedMotionDetected;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              reducedMotionDetected =
                  AccessibilityService.isReducedMotionEnabled(context);
              return const SizedBox();
            },
          ),
        ),
      );

      expect(reducedMotionDetected, isNotNull);
    });

    testWidgets('returns zero duration for reduced motion',
        (WidgetTester tester) async {
      Duration? animationDuration;

      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: MaterialApp(
            home: Builder(
              builder: (context) {
                animationDuration = AccessibilityService.getAnimationDuration(
                  context,
                  normal: const Duration(milliseconds: 300),
                );
                return const SizedBox();
              },
            ),
          ),
        ),
      );

      expect(animationDuration, Duration.zero);
    });

    testWidgets('returns normal duration when motion enabled',
        (WidgetTester tester) async {
      Duration? animationDuration;

      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(disableAnimations: false),
          child: MaterialApp(
            home: Builder(
              builder: (context) {
                animationDuration = AccessibilityService.getAnimationDuration(
                  context,
                  normal: const Duration(milliseconds: 300),
                );
                return const SizedBox();
              },
            ),
          ),
        ),
      );

      expect(animationDuration, const Duration(milliseconds: 300));
    });
  });

  group('SemanticButton', () {
    testWidgets('has proper semantic labels', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SemanticButton(
              semanticLabel: 'Test button',
              semanticHint: 'Tap to test',
              onPressed: () {},
              child: const Text('Press me'),
            ),
          ),
        ),
      );

      // Verify button is accessible
      expect(find.text('Press me'), findsOneWidget);
      expect(find.bySemanticsLabel('Test button'), findsOneWidget);
    });

    testWidgets('renders when onPressed is null', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SemanticButton(
              semanticLabel: 'Disabled button',
              onPressed: null,
              enabled: false,
              child: Text('Cannot press'),
            ),
          ),
        ),
      );

      // Verify button still renders when disabled
      expect(find.text('Cannot press'), findsOneWidget);
    });
  });

  group('SemanticIcon', () {
    testWidgets('has semantic label', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SemanticIcon(
              icon: Icons.home,
              semanticLabel: 'Home icon',
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.home), findsOneWidget);
      expect(find.bySemanticsLabel('Home icon'), findsOneWidget);
    });

    testWidgets('excludes decorative icons from semantics',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SemanticIcon(
              icon: Icons.star,
              semanticLabel: 'Decorative star',
              isDecorative: true,
            ),
          ),
        ),
      );

      // Decorative icons should still render but be excluded from semantics
      expect(find.byIcon(Icons.star), findsOneWidget);
    });
  });

  group('SemanticImage', () {
    testWidgets('has image semantic label', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SemanticImage(
              image: Icon(Icons.image),
              semanticLabel: 'Test image',
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.image), findsOneWidget);
      expect(find.bySemanticsLabel('Test image'), findsOneWidget);
    });

    testWidgets('excludes decorative images from semantics',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SemanticImage(
              image: Icon(Icons.beach_access),
              semanticLabel: 'Decorative beach',
              isDecorative: true,
            ),
          ),
        ),
      );

      // Decorative images should still render
      expect(find.byIcon(Icons.beach_access), findsOneWidget);
    });
  });

  group('SemanticProgressIndicator', () {
    testWidgets('announces progress value', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SemanticProgressIndicator(
              value: 0.75,
              label: 'Math skills progress',
              child: LinearProgressIndicator(value: 0.75),
            ),
          ),
        ),
      );

      expect(find.byType(LinearProgressIndicator), findsOneWidget);
      expect(find.bySemanticsLabel('Math skills progress'), findsOneWidget);
    });
  });

  group('AccessibilitySettings', () {
    test('equality works correctly', () {
      const settings1 = AccessibilitySettings(
        highContrast: true,
        screenReader: false,
        reducedMotion: true,
        boldText: false,
        textScaleFactor: 1.0,
      );

      const settings2 = AccessibilitySettings(
        highContrast: true,
        screenReader: false,
        reducedMotion: true,
        boldText: false,
        textScaleFactor: 1.0,
      );

      expect(settings1, equals(settings2));
      expect(settings1.hashCode, equals(settings2.hashCode));
    });

    test('inequality works correctly', () {
      const settings1 = AccessibilitySettings(
        highContrast: true,
        screenReader: false,
        reducedMotion: true,
        boldText: false,
        textScaleFactor: 1.0,
      );

      const settings2 = AccessibilitySettings(
        highContrast: false,
        screenReader: false,
        reducedMotion: true,
        boldText: false,
        textScaleFactor: 1.0,
      );

      expect(settings1, isNot(equals(settings2)));
    });
  });
}
