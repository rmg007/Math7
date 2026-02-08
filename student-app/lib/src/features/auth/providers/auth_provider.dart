import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:student_app/src/core/supabase/providers.dart';
import 'package:student_app/src/core/services/security_service.dart';

class AuthService {
  final SupabaseClient _client;
  final SecurityService _securityService;

  AuthService(this._client, this._securityService);

  User? get currentUser => _client.auth.currentUser;
  Session? get currentSession => _client.auth.currentSession;
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<void> signInWithPassword({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw Exception('Failed to sign in');
      }

      await _securityService.logLogin(response.user!.id);
    } catch (e) {
      await _securityService.logFailedLogin(email, e.toString());
      rethrow;
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final response = await _client.auth.signUp(
        email: email,
        password: password,
        data: {
          'full_name': fullName,
          'role': 'student',
        },
      );

      if (response.user == null) {
        throw Exception('Failed to create account');
      }

      await _securityService.log(
        eventType: 'register',
        severity: 'info',
        metadata: {'email': email, 'userId': response.user!.id},
      );
    } catch (e) {
      await _securityService.log(
        eventType: 'failed_register',
        severity: 'low',
        metadata: {'email': email, 'reason': e.toString()},
      );
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _securityService.logLogout();
    await _client.auth.signOut();
  }
}

final securityServiceProvider = Provider<SecurityService>((ref) {
  final client = ref.watch(supabaseClientProvider);
  return SecurityService(client);
});

final authServiceProvider = Provider<AuthService>((ref) {
  final client = ref.watch(supabaseClientProvider);
  final securityService = ref.watch(securityServiceProvider);
  return AuthService(client, securityService);
});

final authStateProvider = StreamProvider<AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.authStateChanges;
});

final currentSessionProvider = Provider<Session?>((ref) {
  final authService = ref.watch(authServiceProvider);
  ref.watch(authStateProvider);
  return authService.currentSession;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.whenOrNull(
        data: (state) => state.session != null,
      ) ??
      false;
});

final currentUserProvider = Provider<User?>((ref) {
  final authService = ref.watch(authServiceProvider);
  ref.watch(authStateProvider);
  return authService.currentUser;
});
