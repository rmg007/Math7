import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/core_providers.dart';
import 'package:student_app/src/core/services/security_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

import '../repositories/supabase_auth_repository.dart';

// --- SERVICE & REPOSITORY PROVIDERS ---

class AuthService {
  final supabase.SupabaseClient _client;
  final SecurityService _securityService;

  AuthService(this._client, this._securityService);

  supabase.User? get currentUser => _client.auth.currentUser;
  supabase.Session? get currentSession => _client.auth.currentSession;
  Stream<supabase.AuthState> get authStateChanges =>
      _client.auth.onAuthStateChange;

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

  Future<void> resetPasswordForEmail(String email) async {
    try {
      await _client.auth.resetPasswordForEmail(email);
      await _securityService.log(
        eventType: 'password_reset_requested',
        severity: 'info',
        metadata: {'email': email},
      );
    } catch (e) {
      await _securityService.log(
        eventType: 'password_reset_failed',
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

final authRepositoryProvider = Provider<model.AuthRepository>((ref) {
  final client = ref.watch(supabaseClientProvider);
  return SupabaseAuthRepository(client);
});

// --- STATE PROVIDERS ---

/// Raw Supabase Auth State
final supabaseAuthStateProvider = StreamProvider<supabase.AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.authStateChanges;
});

/// Domain User State (Mapped from Supabase)
final authStateProvider = StreamProvider<model.User?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

/// Direct Domain User access
final currentUserProvider = Provider<model.User?>((ref) {
  return ref.watch(authRepositoryProvider).currentUser;
});

/// Raw Supabase Session
final currentSessionProvider = Provider<supabase.Session?>((ref) {
  final authService = ref.watch(authServiceProvider);
  ref.watch(supabaseAuthStateProvider);
  return authService.currentSession;
});

/// Quick check if authenticated
final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(supabaseAuthStateProvider);
  return authState.whenOrNull(
        data: (state) => state.session != null,
      ) ??
      false;
});

/// Raw Supabase User (for metadata access if needed)
final supabaseUserProvider = Provider<supabase.User?>((ref) {
  final authService = ref.watch(authServiceProvider);
  ref.watch(supabaseAuthStateProvider);
  return authService.currentUser;
});
