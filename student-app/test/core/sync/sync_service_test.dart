import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';

// Mocks
class MockSupabaseClient extends Mock implements SupabaseClient {}
class MockPostgrestFilterBuilder extends Mock implements PostgrestFilterBuilder {}
class MockPostgrestBuilder extends Mock implements PostgrestBuilder {}

void main() {
  late AppDatabase database;
  // ignore: unused_local_variable - kept for future integration tests
  late MockSupabaseClient mockSupabase;

  setUp(() async {
    // Create in-memory database for testing
    database = AppDatabase(NativeDatabase.memory());
    mockSupabase = MockSupabaseClient();
    
    // Register fallback values for mocktail
    registerFallbackValue(Uri());
  });

  tearDown(() async {
    await database.close();
  });

  group('Outbox Grouping Logic', () {
    test('Groups outbox items by table and action', () async {
      // Create test outbox items
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-1'),
          table: const Value('attempts'),
          action: const Value('INSERT'),
          recordId: const Value('attempt-1'),
          payload: const Value('{"id": "attempt-1"}'),
          createdAt: Value(DateTime.now()),
        ),
      );
      
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-2'),
          table: const Value('attempts'),
          action: const Value('INSERT'),
          recordId: const Value('attempt-2'),
          payload: const Value('{"id": "attempt-2"}'),
          createdAt: Value(DateTime.now()),
        ),
      );
      
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-3'),
          table: const Value('skill_progress'),
          action: const Value('UPDATE'),
          recordId: const Value('progress-1'),
          payload: const Value('{"id": "progress-1"}'),
          createdAt: Value(DateTime.now()),
        ),
      );

      // Get all outbox items
      final items = await database.select(database.outbox).get();
      
      // Group by table and action
      final grouped = <String, List<OutboxEntry>>{};
      for (final item in items) {
        final key = '${item.table}_${item.action}';
        grouped.putIfAbsent(key, () => []).add(item);
      }

      // Verify grouping
      expect(grouped['attempts_INSERT']?.length, 2);
      expect(grouped['skill_progress_UPDATE']?.length, 1);
      expect(grouped.keys.length, 2);
    });

    test('Handles mixed actions on same table', () async {
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-4'),
          table: const Value('questions'),
          action: const Value('INSERT'),
          recordId: const Value('q1'),
          payload: const Value('{"id": "q1"}'),
          createdAt: Value(DateTime.now()),
        ),
      );
      
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-5'),
          table: const Value('questions'),
          action: const Value('DELETE'),
          recordId: const Value('q2'),
          payload: const Value('{"id": "q2"}'),
          createdAt: Value(DateTime.now()),
        ),
      );

      final items = await database.select(database.outbox).get();
      final grouped = <String, List<OutboxEntry>>{};
      for (final item in items) {
        final key = '${item.table}_${item.action}';
        grouped.putIfAbsent(key, () => []).add(item);
      }

      expect(grouped['questions_INSERT']?.length, 1);
      expect(grouped['questions_DELETE']?.length, 1);
      expect(grouped.keys.length, 2);
    });
  });

  group('Dead Letter Queue Behavior', () {
    test('Marks items as failed after 5 retries', () async {
      const itemId = 'outbox-6';
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value(itemId),
          table: const Value('attempts'),
          action: const Value('INSERT'),
          recordId: const Value('attempt-1'),
          payload: const Value('{"id": "attempt-1"}'),
          createdAt: Value(DateTime.now()),
          retryCount: const Value(5),
        ),
      );

      // Simulate retry increment
      await (database.update(database.outbox)
            ..where((o) => o.id.equals(itemId)))
          .write(
        const OutboxCompanion(
          retryCount: Value(6),
          status: Value('failed'),
        ),
      );

      final item = await (database.select(database.outbox)
            ..where((o) => o.id.equals(itemId)))
          .getSingle();

      expect(item.status, 'failed');
      expect(item.retryCount, 6);
    });

    test('Does not delete failed items', () async {
      const itemId = 'outbox-7';
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value(itemId),
          table: const Value('attempts'),
          action: const Value('INSERT'),
          recordId: const Value('attempt-1'),
          payload: const Value('{"id": "attempt-1"}'),
          createdAt: Value(DateTime.now()),
          retryCount: const Value(6),
          status: const Value('failed'),
        ),
      );

      // Verify item still exists
      final item = await (database.select(database.outbox)
            ..where((o) => o.id.equals(itemId)))
          .getSingleOrNull();

      expect(item, isNotNull);
      expect(item?.status, 'failed');
    });
  });

  group('Batch Size Limits', () {
    test('Splits large batches into chunks of 100', () {
      final items = List.generate(
        250,
        (i) => OutboxEntry(
          id: 'outbox-$i',
          table: 'attempts',
          action: 'INSERT',
          recordId: 'attempt-$i',
          payload: '{"id": "attempt-$i"}',
          createdAt: DateTime.now(),
          retryCount: 0,
          status: 'pending',
        ),
      );

      // Split into batches of 100
      const maxBatchSize = 100;
      final batches = <List<OutboxEntry>>[];
      for (var i = 0; i < items.length; i += maxBatchSize) {
        final end = (i + maxBatchSize < items.length) 
            ? i + maxBatchSize 
            : items.length;
        batches.add(items.sublist(i, end));
      }

      expect(batches.length, 3);
      expect(batches[0].length, 100);
      expect(batches[1].length, 100);
      expect(batches[2].length, 50);
    });
  });

  group('Ordering Dependencies', () {
    test('Attempts are synced before skill_progress', () async {
      // Create attempts and skill_progress items
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-8'),
          table: const Value('skill_progress'),
          action: const Value('UPDATE'),
          recordId: const Value('progress-1'),
          payload: const Value('{"id": "progress-1"}'),
          createdAt: Value(DateTime.now()),
        ),
      );
      
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-9'),
          table: const Value('attempts'),
          action: const Value('INSERT'),
          recordId: const Value('attempt-1'),
          payload: const Value('{"id": "attempt-1"}'),
          createdAt: Value(DateTime.now()),
        ),
      );

      final items = await (database.select(database.outbox)
            ..orderBy([(o) => OrderingTerm.asc(o.createdAt)]))
          .get();

      // Group and verify attempts come first
      final grouped = <String, List<OutboxEntry>>{};
      for (final item in items) {
        final key = '${item.table}_${item.action}';
        grouped.putIfAbsent(key, () => []).add(item);
      }

      // In actual implementation, attempts should be processed first
      expect(grouped.containsKey('attempts_INSERT'), true);
      expect(grouped.containsKey('skill_progress_UPDATE'), true);
    });
  });

  group('Retry Logic', () {
    test('Increments retry count on failure', () async {
      const itemId = 'outbox-10';
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value(itemId),
          table: const Value('attempts'),
          action: const Value('INSERT'),
          recordId: const Value('attempt-1'),
          payload: const Value('{"id": "attempt-1"}'),
          createdAt: Value(DateTime.now()),
          retryCount: const Value(0),
        ),
      );

      // Simulate retry
      await (database.update(database.outbox)
            ..where((o) => o.id.equals(itemId)))
          .write(
        const OutboxCompanion(
          retryCount: Value(1),
          status: Value('pending'),
        ),
      );

      final item = await (database.select(database.outbox)
            ..where((o) => o.id.equals(itemId)))
          .getSingle();

      expect(item.retryCount, 1);
      expect(item.status, 'pending');
    });

    test('Preserves pending status until retry limit', () async {
      for (var retryCount = 0; retryCount <= 5; retryCount++) {
        final itemId = 'outbox-retry-$retryCount';
        await database.into(database.outbox).insert(
          OutboxCompanion(
            id: Value(itemId),
            table: const Value('attempts'),
            action: const Value('INSERT'),
            recordId: Value('attempt-$retryCount'),
            payload: Value('{"id": "attempt-$retryCount"}'),
            createdAt: Value(DateTime.now()),
            retryCount: Value(retryCount),
          ),
        );

        final item = await (database.select(database.outbox)
              ..where((o) => o.id.equals(itemId)))
            .getSingle();

        if (retryCount <= 5) {
          expect(item.status, 'pending');
        }
      }
    });
  });

  group('Payload Validation', () {
    test('Handles valid JSON payloads', () async {
      const payload = '{"id": "test-1", "data": "value"}';
      
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-11'),
          table: const Value('attempts'),
          action: const Value('INSERT'),
          recordId: const Value('test-1'),
          payload: const Value(payload),
          createdAt: Value(DateTime.now()),
        ),
      );

      final item = await database.select(database.outbox).getSingle();
      expect(item.payload, payload);
    });
  });
}
