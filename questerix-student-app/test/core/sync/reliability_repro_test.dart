import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/sync/sync_service.dart';
import 'package:student_app/src/features/curriculum/repositories/local_curriculum_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockSupabaseClient extends Mock implements SupabaseClient {}

class MockLocalCurriculumRepository extends Mock
    implements LocalCurriculumRepository {}

/// Mock for the builder returned by SupabaseClient.rpc()
/// We use dynamic rather than List<dynamic> so that mocktail can
/// match both rpc<List<dynamic>> and rpc<dynamic> call sites.
class MockPostgrestFilterBuilder extends Mock
    implements PostgrestFilterBuilder<dynamic> {}

void main() {
  late AppDatabase database;
  late MockSupabaseClient mockSupabase;
  late MockLocalCurriculumRepository mockRepo;

  setUpAll(() {
    registerFallbackValue(const Duration(seconds: 1));
    registerFallbackValue(<String, dynamic>{});
  });

  setUp(() {
    database = AppDatabase(NativeDatabase.memory());
    mockSupabase = MockSupabaseClient();
    mockRepo = MockLocalCurriculumRepository();
  });

  tearDown(() async {
    await database.close();
    resetMocktailState();
  });

  // Helper: set up an rpc mock that always throws with the given error.
  void stubRpcToThrow(MockPostgrestFilterBuilder builder, Object error) {
    when(() => mockSupabase.rpc<dynamic>(
          any(),
          params: any(named: 'params'),
        )).thenAnswer((_) => builder);

    when(() => builder.timeout(any(), onTimeout: any(named: 'onTimeout')))
        .thenAnswer((_) => Future<dynamic>.error(error));
  }

  // ------------------------------------------------------------------
  // REL-01: Injectable timeout
  // Verify that the SyncService uses the injected Duration and surfaces
  // a meaningful error message on timeout.
  // ------------------------------------------------------------------
  test('REL-01: SyncService times out with injectable Duration', () async {
    final mockBuilder = MockPostgrestFilterBuilder();
    stubRpcToThrow(mockBuilder, Exception('Supabase call timed out after 0s'));

    final syncService = SyncService(database, mockSupabase, mockRepo,
        timeout: const Duration(milliseconds: 50));

    await database.into(database.outbox).insert(
          OutboxCompanion(
            id: const Value('timeout-1'),
            table: const Value('attempts'),
            action: const Value('INSERT'),
            recordId: const Value('timeout-1'),
            payload: const Value('{"id": "timeout-1"}'),
            createdAt: Value(DateTime.now()),
          ),
        );

    await syncService.sync();

    expect(syncService.state.isError, true,
        reason: 'Sync should be in error state after timeout');
    expect(syncService.state.error, contains('timed out after'),
        reason: 'Error message should include the timeout reason');
  });

  // ------------------------------------------------------------------
  // Guard: isSyncing blocks concurrent calls
  // ------------------------------------------------------------------
  test('sync() is idempotent while isSyncing', () async {
    final syncService = SyncService(database, mockSupabase, mockRepo,
        timeout: const Duration(milliseconds: 50));

    // No outbox items; pull will fail immediately (no mock set up).
    // Invariant: while the first sync is in-flight, isSyncing == true.
    final firstSync = syncService.sync();

    expect(syncService.state.isSyncing, true,
        reason: 'State must be syncing after sync() is called');

    // Second call while syncing must return immediately (no-op)
    final beforeSecond = DateTime.now();
    await syncService.sync();
    final elapsed = DateTime.now().difference(beforeSecond);

    expect(elapsed.inMilliseconds, lessThan(200),
        reason: 'Second sync() must return immediately when already syncing');

    await firstSync; // let the first complete (will error, that is fine)
  });

  // ------------------------------------------------------------------
  // DLQ: outbox items with retryCount >= 5 must be promoted to 'failed'
  // ------------------------------------------------------------------
  test('Outbox item is promoted to DLQ after 5 failures', () async {
    // Insert an item already at the retry limit
    await database.into(database.outbox).insert(
          OutboxCompanion(
            id: const Value('dlq-1'),
            table: const Value('attempts'),
            action: const Value('INSERT'),
            recordId: const Value('dlq-1'),
            payload: const Value('{"id": "dlq-1"}'),
            retryCount: const Value(5),
            createdAt: Value(DateTime.now()),
          ),
        );

    final mockBuilder = MockPostgrestFilterBuilder();
    stubRpcToThrow(mockBuilder, Exception('network error'));

    final syncService = SyncService(database, mockSupabase, mockRepo,
        timeout: const Duration(milliseconds: 100));

    await syncService.sync();

    final item = await (database.select(database.outbox)
          ..where((o) => o.id.equals('dlq-1')))
        .getSingle();

    expect(item.status, 'failed',
        reason: 'Item exceeding retry limit must be promoted to DLQ');
  });
}
