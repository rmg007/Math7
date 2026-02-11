import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/core/config/app_config_service.dart';
import 'package:student_app/src/features/auth/repositories/session_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockSupabaseClient extends Mock implements SupabaseClient {}

class MockGoTrueClient extends Mock implements GoTrueClient {}

class MockRef extends Mock implements Ref {}

class MockUser extends Mock implements User {}

class MockSession extends Mock implements Session {}

class MockAppContext extends Mock implements AppContext {}

void main() {
  late SessionRepository repository;
  late MockSupabaseClient mockClient;
  late MockGoTrueClient mockAuth;
  late MockRef mockRef;

  setUp(() {
    mockClient = MockSupabaseClient();
    mockAuth = MockGoTrueClient();
    mockRef = MockRef();

    when(() => mockClient.auth).thenReturn(mockAuth);

    repository = SessionRepository(mockClient, mockRef);
  });

  group('SessionRepository', () {
    test('currentUser returns user from auth client', () {
      final mockUser = MockUser();
      when(() => mockAuth.currentUser).thenReturn(mockUser);

      expect(repository.currentUser, mockUser);
    });

    test('currentSession returns session from auth client', () {
      final mockSession = MockSession();
      when(() => mockAuth.currentSession).thenReturn(mockSession);

      expect(repository.currentSession, mockSession);
    });

    test(
        'signInAnonymously calls auth.signInAnonymously with app_id if config exists',
        () async {
      final mockAppContext = MockAppContext();
      when(() => mockAppContext.appId).thenReturn('test-app-id');
      when(() => mockRef.read(appConfigProvider)).thenReturn(mockAppContext);

      when(() => mockAuth.signInAnonymously(data: any(named: 'data')))
          .thenAnswer((_) async => AuthResponse());

      await repository.signInAnonymously();

      verify(() => mockAuth.signInAnonymously(
            data:
                any(named: 'data', that: containsPair('app_id', 'test-app-id')),
          )).called(1);
    });

    test('signOut calls auth.signOut', () async {
      when(() => mockAuth.signOut()).thenAnswer((_) async => {});

      await repository.signOut();

      verify(() => mockAuth.signOut()).called(1);
    });
  });
}
