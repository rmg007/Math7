import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:student_app/src/features/curriculum/widgets/question_widgets.dart';

void main() {
  group('MultipleChoiceWidget Tests', () {
    // Provide options in the format expected by the widget: List of maps with 'id' and 'text'
    final options = [
      {'id': 'opt1', 'text': 'Choice 1'},
      {'id': 'opt2', 'text': 'Choice 2'},
      {'id': 'opt3', 'text': 'Choice 3'},
    ];

    testWidgets('displays all answer choices', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MultipleChoiceWidget(
              options: options,
              selectedAnswer: null,
              onAnswerChanged: (_) {},
              isAnswered: false,
            ),
          ),
        ),
      );

      for (var opt in options) {
        expect(find.text(opt['text']!), findsOneWidget);
      }
    });

    testWidgets('allows selecting an answer', (WidgetTester tester) async {
      Map<String, dynamic>? result;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MultipleChoiceWidget(
              options: options,
              selectedAnswer: null,
              onAnswerChanged: (answer) {
                result = answer;
              },
              isAnswered: false,
            ),
          ),
        ),
      );

      // Tap on first choice
      await tester.tap(find.text('Choice 1'));
      await tester.pump();

      expect(result, isNotNull);
      expect(result!['selected_option_id'], equals('opt1'));
    });

    testWidgets('highlights selected answer', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MultipleChoiceWidget(
              options: options,
              selectedAnswer: const {'selected_option_id': 'opt1'},
              onAnswerChanged: (_) {},
              isAnswered: false,
            ),
          ),
        ),
      );

      // Verify visual feedback (Check icon is shown when selected)
      expect(find.byIcon(Icons.check), findsOneWidget);
    });

    testWidgets('disabled when isAnswered is true',
        (WidgetTester tester) async {
      bool callbackCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MultipleChoiceWidget(
              options: options,
              selectedAnswer: null,
              onAnswerChanged: (_) {
                callbackCalled = true;
              },
              isAnswered: true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Choice 1'));
      await tester.pump();

      expect(callbackCalled, isFalse);
    });
  });

  group('BooleanWidget Tests', () {
    testWidgets('displays True and False options', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BooleanWidget(
              options: const {},
              selectedAnswer: null,
              onAnswerChanged: (_) {},
              isAnswered: false,
            ),
          ),
        ),
      );

      expect(find.text('True'), findsOneWidget);
      expect(find.text('False'), findsOneWidget);
    });

    testWidgets('allows selecting True', (WidgetTester tester) async {
      Map<String, dynamic>? result;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BooleanWidget(
              options: const {},
              selectedAnswer: null,
              onAnswerChanged: (answer) {
                result = answer;
              },
              isAnswered: false,
            ),
          ),
        ),
      );

      await tester.tap(find.text('True'));
      await tester.pump();

      expect(result, equals({'value': true}));
    });

    testWidgets('allows selecting False', (WidgetTester tester) async {
      Map<String, dynamic>? result;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BooleanWidget(
              options: const {},
              selectedAnswer: null,
              onAnswerChanged: (answer) {
                result = answer;
              },
              isAnswered: false,
            ),
          ),
        ),
      );

      await tester.tap(find.text('False'));
      await tester.pump();

      expect(result, equals({'value': false}));
    });
  });

  group('TextInputWidget Tests', () {
    testWidgets('displays text field', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextInputWidget(
              options: const {},
              selectedAnswer: null,
              onAnswerChanged: (_) {},
              isAnswered: false,
            ),
          ),
        ),
      );

      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('updates value on text entry', (WidgetTester tester) async {
      Map<String, dynamic>? result;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextInputWidget(
              options: const {},
              selectedAnswer: null,
              onAnswerChanged: (answer) {
                result = answer;
              },
              isAnswered: false,
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(TextField), 'Answer Text');
      await tester.pump();

      expect(result, equals({'text': 'Answer Text'}));
    });

    testWidgets('pre-fills existing answer', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextInputWidget(
              options: const {},
              selectedAnswer: const {'text': 'Pre-filled'},
              onAnswerChanged: (_) {},
              isAnswered: false,
            ),
          ),
        ),
      );

      expect(find.text('Pre-filled'), findsOneWidget);
    });
  });

  group('McqMultiWidget Tests', () {
    final options = [
      {'id': 'opt1', 'text': 'Option 1'},
      {'id': 'opt2', 'text': 'Option 2'},
    ];

    testWidgets('allows multiple selections', (WidgetTester tester) async {
      Map<String, dynamic>? lastResult;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: McqMultiWidget(
              options: options,
              selectedAnswer: const {
                'selected_ids': ['opt1']
              },
              onAnswerChanged: (val) => lastResult = val,
              isAnswered: false,
            ),
          ),
        ),
      );

      // Tap Option 2. Should result in ['opt1', 'opt2']
      await tester.tap(find.text('Option 2'));
      await tester.pump();

      expect(lastResult!['selected_ids'], containsAll(['opt1', 'opt2']));

      // Tap Option 1 (deselect). Should result in ['opt2'] (from previous state perspective if we updated)
      // HOWEVER, the widget is stateless regarding 'selectedAnswer' prop - it relies on parent to update it.
      // But the callback logic calculates new list based on prop.
      // Since we haven't updated the prop in this test frame, tapping Option 1 should remove it from the initially passed ['opt1']

      await tester.tap(find.text('Option 1'));
      await tester.pump();

      // Logic: currentIds (['opt1']) remove 'opt1' -> []
      expect(lastResult!['selected_ids'], isEmpty);
    });
  });
}
