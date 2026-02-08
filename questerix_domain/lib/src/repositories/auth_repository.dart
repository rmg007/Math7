import '../models/user.dart';

abstract class AuthRepository {
  Stream<User?> get authStateChanges;
  User? get currentUser;
  // FIX M2: Added appId for multi-tenant context
  Future<void> signInWithEmail({required String email, required String appId});
  Future<void> signInAnonymously({required String appId});
  Future<void> signOut();
  Future<void> updateProfile({required User user});
}
