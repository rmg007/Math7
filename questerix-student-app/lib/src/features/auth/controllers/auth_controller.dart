import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';

/// Controller for authentication screens (Login/Register).
/// Uses [AsyncValue] to manage loading, error, and success states automatically.
class AuthController extends StateNotifier<AsyncValue<void>> {
  final AuthService _authService;

  AuthController(this._authService) : super(const AsyncData(null));

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _authService.signInWithPassword(
          email: email,
          password: password,
        ));
  }

  Future<void> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _authService.signUp(
          email: email,
          password: password,
          fullName: fullName,
        ));
  }

  Future<void> resetPassword({required String email}) async {
    state = const AsyncLoading();
    state =
        await AsyncValue.guard(() => _authService.resetPasswordForEmail(email));
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<void>>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthController(authService);
});
