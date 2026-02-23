import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/features/auth/providers/auth_provider.dart';
import 'package:student_app/src/features/auth/screens/login_screen.dart';

class MockAuthService extends Mock implements AuthService {}

class MockNavigatorObserver extends Mock implements NavigatorObserver {}

class FakeRoute extends Fake implements Route<dynamic> {
  @override
  RouteSettings get settings => const RouteSettings();
}

void main() {
  late MockAuthService mockAuthService;
  late MockNavigatorObserver mockNavigatorObserver;

  setUpAll(() {
    registerFallbackValue(FakeRoute());
  });

  setUp(() {
    mockAuthService = MockAuthService();
    mockNavigatorObserver = MockNavigatorObserver();
  });

  testWidgets(
      'test_should_fail_when_login_succeeds_but_screen_is_not_dismissed',
      (WidgetTester tester) async {
    when(() => mockAuthService.signInWithPassword(
          email: any(named: 'email'),
          password: any(named: 'password'),
        )).thenAnswer((_) async => {});

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authServiceProvider.overrideWithValue(mockAuthService),
        ],
        child: MaterialApp(
          home: const LoginScreen(),
          navigatorObservers: [mockNavigatorObserver],
        ),
      ),
    );

    // Enter credentials
    await tester.enterText(
        find.byType(TextFormField).first, 'test@example.com');
    await tester.enterText(find.byType(TextFormField).last, 'password123');

    // Tap login
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    // Verify Navigator.pop was called
    // In our buggy state, this should fail because didn'tPop
    verify(() => mockNavigatorObserver.didPop(any(), any())).called(1);
  });
}
