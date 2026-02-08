import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/features/auth/providers/auth_provider.dart';
import 'package:student_app/src/features/auth/screens/login_screen.dart';

class MockAuthService extends Mock implements AuthService {}

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
    // Default success for most tests
    when(() => mockAuthService.signInWithPassword(
          email: any(named: 'email'),
          password: any(named: 'password'),
        )).thenAnswer((_) async => {});
  });

  Widget createSubject() {
    return ProviderScope(
      overrides: [
        authServiceProvider.overrideWithValue(mockAuthService),
      ],
      child: const MaterialApp(
        home: LoginScreen(),
      ),
    );
  }

  group('LoginScreen Widget Tests', () {
    testWidgets('displays email and password fields',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Verify fields exist
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('displays login button', (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Verify button
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('email field validates empty input',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Tap Sign In without typing
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      // Verify validation error "Please enter your email"
      expect(find.text('Please enter your email'), findsOneWidget);
    });

    testWidgets('email field validates invalid format',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Enter invalid email
      await tester.enterText(
        find.byType(TextFormField).first,
        'invalid-email',
      );
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      // Verify validation error
      expect(find.textContaining('valid email'), findsWidgets);
    });

    testWidgets('password field is obscured', (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Find password field
      final passwordFieldFinder = find.byType(TextFormField).last;
      await tester.enterText(passwordFieldFinder, 'secret');
      
      // Find the TextField widget inside TextFormField
      final textFieldFinder = find.descendant(
        of: passwordFieldFinder,
        matching: find.byType(TextField),
      );
      final textField = tester.widget<TextField>(textFieldFinder);

      expect(textField.obscureText, isTrue);
    });

    testWidgets('password visibility toggle works',
        (WidgetTester tester) async {
      await tester.pumpWidget(createSubject());

      // Find toggle button (initially showing 'eye' to trigger visibility)
      final toggleButton = find.byIcon(Icons.visibility_outlined);
      expect(toggleButton, findsOneWidget);

      // Tap it
      await tester.tap(toggleButton);
      await tester.pumpAndSettle();

      // Password should be visible - check for 'crossed eye' (hide)
      expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);

      final passwordFieldFinder = find.byType(TextFormField).last;
      final textFieldFinder = find.descendant(
        of: passwordFieldFinder,
        matching: find.byType(TextField),
      );
      final textField = tester.widget<TextField>(textFieldFinder);
      expect(textField.obscureText, isFalse);
    });

    testWidgets('displays loading indicator during login',
        (WidgetTester tester) async {
      // Setup mock to delay
      when(() => mockAuthService.signInWithPassword(
            email: any(named: 'email'),
            password: any(named: 'password'),
          )).thenAnswer((_) async {
        await Future.delayed(const Duration(milliseconds: 200));
      });

      await tester.pumpWidget(createSubject());

      // Enter valid data
      await tester.enterText(
          find.byType(TextFormField).first, 'test@example.com');
      await tester.enterText(
          find.byType(TextFormField).last, 'password123');

      // Tap login
      await tester.tap(find.text('Sign In'));
      
      // Pump for short duration to catch loading state
      await tester.pump(const Duration(milliseconds: 50));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Finish calls
      await tester.pumpAndSettle();
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('displays error message on login failure',
        (WidgetTester tester) async {
      // Mock failure
      when(() => mockAuthService.signInWithPassword(
            email: any(named: 'email'),
            password: any(named: 'password'),
          )).thenAnswer((_) async => throw Exception('Login Failed'));

      await tester.pumpWidget(createSubject());

      // Enter valid data
      await tester.enterText(
          find.byType(TextFormField).first, 'test@example.com');
      await tester.enterText(
          find.byType(TextFormField).last, 'password123');

      // Tap login
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      // Expect error message (Login Failed)
      // Note: LoginScreen strips "Exception: " prefix
      expect(find.text('Login Failed'), findsOneWidget);
    });
  });
}
