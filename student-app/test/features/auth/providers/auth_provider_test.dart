import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/core/services/security_service.dart';
import 'package:student_app/src/features/auth/providers/auth_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

class MockSupabaseClient extends Mock implements supabase.SupabaseClient {}

class MockGoTrueClient extends Mock implements supabase.GoTrueClient {}

class MockSecurityService extends Mock implements SecurityService {}

class MockUser extends Mock implements supabase.User {}

void main() {
  late AuthService authService;
  late MockSupabaseClient mockClient;
  late MockGoTrueClient mockAuth;
  late MockSecurityService mockSecurity;

  setUp(() {
    mockClient = MockSupabaseClient();
    mockAuth = MockGoTrueClient();
    mockSecurity = MockSecurityService();

    when(() => mockClient.auth).thenReturn(mockAuth);

    authService = AuthService(mockClient, mockSecurity);
  });

  group('AuthService', () {
    test('signInWithPassword calls auth and logs login', () async {
      final mockUser = MockUser();
      when(() => mockUser.id).thenReturn('user-123');

      when(() => mockAuth.signInWithPassword(
            email: 'test@example.com',
            password: 'password',
          )).thenAnswer((_) async => supabase.AuthResponse(user: mockUser));

      when(() => mockSecurity.logLogin(any())).thenAnswer((_) async => {});

      await authService.signInWithPassword(
        email: 'test@example.com',
        password: 'password',
      );

      verify(() => mockAuth.signInWithPassword(
            email: 'test@example.com',
            password: 'password',
          )).called(1);

      verify(() => mockSecurity.logLogin('user-123')).called(1);
    });

    test('signInWithPassword logs failure on error', () async {
      when(() => mockAuth.signInWithPassword(
            email: 'test@example.com',
            password: 'password',
          )).thenThrow(Exception('Invalid credentials'));

      when(() => mockSecurity.logFailedLogin(any(), any()))
          .thenAnswer((_) async => {});

      expect(
        () => authService.signInWithPassword(
          email: 'test@example.com',
          password: 'password',
        ),
        throwsA(isA<Exception>()),
      );

      verify(() => mockSecurity.logFailedLogin('test@example.com', any()))
          .called(1);
    });

    test('signOut logs logout and calls auth.signOut', () async {
      when(() => mockSecurity.logLogout()).thenAnswer((_) async => {});
      when(() => mockAuth.signOut()).thenAnswer((_) async => {});

      await authService.signOut();

      verify(() => mockSecurity.logLogout()).called(1);
      verify(() => mockAuth.signOut()).called(1);
    });
  });
}
