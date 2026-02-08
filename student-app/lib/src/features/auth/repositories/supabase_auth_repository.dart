import 'package:questerix_domain/questerix_domain.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

class SupabaseAuthRepository implements AuthRepository {
  final supabase.SupabaseClient _client;

  SupabaseAuthRepository(this._client);

  @override
  Stream<User?> get authStateChanges {
    return _client.auth.onAuthStateChange.map((event) {
      final session = event.session;
      final user = session?.user;
      if (user == null) return null;
      return _mapSupabaseUserToDomainUser(user);
    });
  }

  @override
  User? get currentUser {
    final user = _client.auth.currentUser;
    if (user == null) return null;
    return _mapSupabaseUserToDomainUser(user);
  }

  @override
  Future<void> signInAnonymously({required String appId}) async {
    // CRITICAL: Pass app_id to stamp user with correct tenant
    await _client.auth.signInAnonymously(
      data: {'app_id': appId},
    );
  }

  @override
  Future<void> signInWithEmail(
      {required String email, required String appId}) async {
    // Note: This sends a magic link.
    // CRITICAL: Pass app_id to stamp user with correct tenant
    await _client.auth.signInWithOtp(
      email: email,
      data: {'app_id': appId},
    );
  }

  @override
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  @override
  Future<void> updateProfile({required User user}) async {
    // Update metadata in Supabase
    await _client.auth.updateUser(
      supabase.UserAttributes(data: {
        'is_parent_managed': user.isParentManaged,
        'age_group': user.ageGroup.index, // Store as int
        'accepted_terms_date': user.acceptedTermsDate?.toIso8601String(),
      }),
    );
  }

  User _mapSupabaseUserToDomainUser(supabase.User sUser) {
    final metadata = sUser.userMetadata ?? {};

    // Parse age group
    UserAgeGroup ageGroup = UserAgeGroup.unknown;
    if (metadata.containsKey('age_group') && metadata['age_group'] is int) {
      final index = metadata['age_group'] as int;
      if (index >= 0 && index < UserAgeGroup.values.length) {
        ageGroup = UserAgeGroup.values[index];
      }
    }

    return User(
      id: sUser.id,
      email: sUser.email ?? '', // Anonymous users might have empty email
      createdAt: DateTime.tryParse(sUser.createdAt) ?? DateTime.now(),
      updatedAt: DateTime.tryParse(sUser.updatedAt ?? '') ?? DateTime.now(),
      isParentManaged: metadata['is_parent_managed'] as bool? ?? false,
      ageGroup: ageGroup,
      acceptedTermsDate: metadata['accepted_terms_date'] != null
          ? DateTime.tryParse(metadata['accepted_terms_date'] as String)
          : null,
    );
  }
}
