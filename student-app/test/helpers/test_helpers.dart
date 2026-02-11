import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:drift/native.dart';
import 'package:student_app/src/core/core_providers.dart';
import 'package:student_app/src/core/sync/sync_service.dart';
import 'package:student_app/src/features/auth/providers/auth_provider.dart';
import 'package:student_app/src/core/database/database.dart';

class MockSupabaseClient extends Mock implements SupabaseClient {}

class MockAuthService extends Mock implements AuthService {}

class MockSyncService extends StateNotifier<SyncState> implements SyncService {
  MockSyncService() : super(SyncState());

  @override
  Future<void> sync() async {}

  @override
  Future<void> pull() async {}

  @override
  Future<void> push() async {}
}

List<Override> getTestOverrides({
  MockSupabaseClient? mockSupabaseClient,
  MockAuthService? mockAuthService,
  AppDatabase? database,
}) {
  return [
    supabaseClientProvider
        .overrideWithValue(mockSupabaseClient ?? MockSupabaseClient()),
    authServiceProvider.overrideWithValue(mockAuthService ?? MockAuthService()),
    databaseProvider.overrideWith((ref) {
      final db = database ?? AppDatabase(NativeDatabase.memory());
      ref.onDispose(() => db.close());
      return db;
    }),
    currentUserProvider.overrideWithValue(null),
    connectivityServiceProvider.overrideWith(
      (ref) => Stream.value(ConnectivityStatus.online),
    ),
    syncServiceProvider.overrideWith((ref) => MockSyncService()),
  ];
}
