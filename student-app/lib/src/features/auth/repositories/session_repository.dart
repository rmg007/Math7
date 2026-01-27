import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:student_app/src/core/supabase/providers.dart';

class SessionRepository {
  final SupabaseClient _client;

  SessionRepository(this._client);

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  User? get currentUser => _client.auth.currentUser;

  Session? get currentSession => _client.auth.currentSession;

  Future<void> signInAnonymously() async {
    await _client.auth.signInAnonymously();
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }
}

final sessionRepositoryProvider = Provider<SessionRepository>((ref) {
  final client = ref.watch(supabaseClientProvider);
  return SessionRepository(client);
});
