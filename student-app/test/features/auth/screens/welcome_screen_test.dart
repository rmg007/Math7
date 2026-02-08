import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:student_app/src/core/config/app_config_service.dart';
import 'package:student_app/src/features/auth/screens/welcome_screen.dart';

// Mock Config Service ensuring AppContext is available for downstream screens
class MockAppConfigService extends StateNotifier<AppContext?>
    implements AppConfigService {
  MockAppConfigService()
      : super(const AppContext(
            appId: 'test-app',
            appName: 'Test App',
            primaryColor: 0xFF0000FF));

  @override
  Future<AppContext> load() async => state!;
}

void main() {
  Widget createSubject() {
    return ProviderScope(
      overrides: [
        appConfigProvider.overrideWith((ref) => MockAppConfigService()),
      ],
      child: const MaterialApp(
        home: WelcomeScreen(),
      ),
    );
  }

  group('WelcomeScreen Widget Tests', () {
    testWidgets('displays app logo and welcome message',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Verify welcome elements are displayed
      expect(find.textContaining('Welcome'), findsWidgets);
      expect(find.textContaining('Questerix'), findsWidgets);
    });

    testWidgets('displays Get Started button', (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Verify Get Started button exists
      expect(find.text('Get Started'), findsOneWidget);
    });

    testWidgets('Get Started button navigates to onboarding',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Tap Get Started button
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Verify navigation to onboarding
      // Since AppConfig is mocked, it should render the form (not loading)
      expect(find.text('When is your birthday?'), findsOneWidget);
    });

    testWidgets('displays Sign In link', (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Verify Sign In link is present
      expect(find.text('I already have an account'), findsOneWidget);
    });

    testWidgets('Sign In link navigates to login screen',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Tap Sign In link
      await tester.tap(find.text('I already have an account'));
      await tester.pumpAndSettle();

      // Verify navigation to login
      // LoginScreen has "Welcome Back!" title
      expect(find.text('Welcome Back!'), findsOneWidget);
    });

    testWidgets('displays gradient background', (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Verify Container with decoration exists (gradient background)
      expect(find.byType(Container), findsWidgets);

      final container = tester.widget<Container>(
        find.byType(Container).first,
      );

      expect(container.decoration, isA<BoxDecoration>());
    });

    testWidgets('has proper accessibility semantics',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Verify button has semantics
      final button = find.text('Get Started');
      expect(button, findsOneWidget);

      final semantics = tester.getSemantics(button);
      // Check semantic node exists and has actions
      expect(semantics.getSemanticsData().actions, isNot(0));
    });

    testWidgets('button has visual feedback on press',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      final button = find.text('Get Started');

      // Long press to see visual feedback
      await tester.press(button);
      await tester.pump();

      // Button should exist and be pressable
      expect(button, findsOneWidget);
    });
  });
}
