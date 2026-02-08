import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Mock Supabase Service for Integration Tests
///
/// Provides a mock Supabase client that can be used in tests
/// without making real network requests.
class MockSupabaseService {
  SupabaseClient? _client;
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;

  /// Initialize mock Supabase client
  Future<void> initialize() async {
    if (_isInitialized) return;

    // Initialize with fake credentials for testing
    await Supabase.initialize(
      url: 'https://mock.supabase.co',
      anonKey: 'mock-anon-key-for-testing',
      debug: kDebugMode,
    );

    _client = Supabase.instance.client;
    _isInitialized = true;
  }

  /// Get the mock Supabase client
  SupabaseClient getClient() {
    if (!_isInitialized) {
      throw StateError(
          'MockSupabaseService not initialized. Call initialize() first.');
    }
    return _client!;
  }

  /// Clean up resources
  Future<void> cleanup() async {
    _client = null;
    _isInitialized = false;
  }

  /// Mock authentication - simulate successful sign in
  Future<AuthResponse> mockSignIn({
    required String email,
    required String password,
  }) async {
    // TODO: Implement mock authentication response
    // For now, this is a placeholder
    throw UnimplementedError('Mock sign in not yet implemented');
  }

  /// Mock authentication - simulate sign out
  Future<void> mockSignOut() async {
    // TODO: Implement mock sign out
    throw UnimplementedError('Mock sign out not yet implemented');
  }

  /// Mock data fetching
  PostgrestFilterBuilder mockSelect(String table) {
    return getClient().from(table).select();
  }

  /// Mock data insertion
  Future<void> mockInsert(String table, Map<String, dynamic> data) async {
    // TODO: Implement mock insert
    throw UnimplementedError('Mock insert not yet implemented');
  }

  /// Mock data update
  Future<void> mockUpdate(
      String table, Map<String, dynamic> data, String id) async {
    // TODO: Implement mock update
    throw UnimplementedError('Mock update not yet implemented');
  }

  /// Mock data deletion
  Future<void> mockDelete(String table, String id) async {
    // TODO: Implement mock delete
    throw UnimplementedError('Mock delete not yet implemented');
  }
}
