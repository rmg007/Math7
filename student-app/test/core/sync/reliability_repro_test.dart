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

class MockPostgrestFilterBuilder extends Mock
    implements PostgrestFilterBuilder<List<dynamic>> {}

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
  });

  test('SyncService should time out with injectable Duration', () async {
    final mockBuilder = MockPostgrestFilterBuilder();

    when(() => mockSupabase.rpc<List<dynamic>>(
          any(),
          params: any(named: 'params'),
        )).thenAnswer((_) => mockBuilder);

    when(() => mockBuilder.timeout(any(), onTimeout: any(named: 'onTimeout')))
        .thenAnswer((invocation) {
      final duration = invocation.positionalArguments[0] as Duration;
      final onTimeout = invocation.namedArguments[#onTimeout] as Function;
      return Future.delayed(duration, () => onTimeout());
    });

    final syncService = SyncService(database, mockSupabase, mockRepo,
        timeout: const Duration(seconds: 1));

    await database.into(database.outbox).insert(
          OutboxCompanion(
            id: const Value('1'),
            table: const Value('attempts'),
            action: const Value('INSERT'),
            recordId: const Value('1'),
            payload: const Value('{"id": "1"}'),
            createdAt: Value(DateTime.now()),
          ),
        );

    await syncService.sync();

    expect(syncService.state.isError, true);
    expect(syncService.state.error, contains('timed out after 1s'));
  });
}
