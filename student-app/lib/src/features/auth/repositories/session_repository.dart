import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:student_app/src/core/supabase/providers.dart';
import 'package:student_app/src/core/config/app_config_service.dart';

class SessionRepository {
  final SupabaseClient _client;
  final Ref _ref;

  SessionRepository(this._client, this._ref);

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  User? get currentUser => _client.auth.currentUser;

  Session? get currentSession => _client.auth.currentSession;

  Future<void> signInAnonymously() async {
    final appConfig = _ref.read(appConfigProvider);
    final data = <String, dynamic>{};

    if (appConfig != null) {
      data['app_id'] = appConfig.appId;
    }

    await _client.auth.signInAnonymously(data: data);
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }
}

final sessionRepositoryProvider = Provider<SessionRepository>((ref) {
  final client = ref.watch(supabaseClientProvider);
  return SessionRepository(client, ref);
});
