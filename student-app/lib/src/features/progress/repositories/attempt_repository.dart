import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/database/mappers.dart';
import 'package:student_app/src/core/database/providers.dart';
import 'package:student_app/src/core/supabase/providers.dart';
import 'package:uuid/uuid.dart';

// T2 FIX: Removed AppSignatureService - was security theater (circular integrity)
// Client-side signatures can't protect against client-side tampering

/// Provider for attempt repository
final attemptRepositoryProvider = Provider<AttemptRepository>((ref) {
  final database = ref.watch(databaseProvider);
  final userId = ref.watch(currentUserIdProvider);
  return AttemptRepository(database, userId);
});

/// Repository for attempts (offline-first with outbox pattern)
class AttemptRepository {
  final AppDatabase _database;
  final String? _userId;
  final _uuid = const Uuid();

  AttemptRepository(this._database, this._userId);

  /// Submit an attempt (writes to local DB and outbox)
  Future<String> submitAttempt({
    required String questionId,
    required Map<String, dynamic> response,
    required bool isCorrect,
    required int scoreAwarded,
    int? timeSpentMs,
  }) async {
    final userId = _userId;
    if (userId == null) {
      throw Exception('User not authenticated');
    }

    final attemptId = _uuid.v4();
    final now = DateTime.now();
    final responseJson = jsonEncode(response);

    // T2 FIX: Removed client-side signature - server should do integrity checks
    final attempt = AttemptsCompanion(
      id: Value(attemptId),
      userId: Value(userId),
      questionId: Value(questionId),
      response: Value(responseJson),
      isCorrect: Value(isCorrect),
      scoreAwarded: Value(scoreAwarded),
      timeSpentMs: Value(timeSpentMs),
      createdAt: Value(now),
      updatedAt: Value(now),
    );

    await _database.transaction(() async {
      // Insert attempt locally
      await _database.into(_database.attempts).insert(attempt);

      // Queue for sync
      await _database.into(_database.outbox).insert(
            OutboxCompanion(
              id: Value(_uuid.v4()),
              table: const Value('attempts'),
              action: const Value('INSERT'),
              recordId: Value(attemptId),
              payload: Value(jsonEncode({
                'id': attemptId,
                'user_id': userId,
                'question_id': questionId,
                'response': response,
                'is_correct': isCorrect,
                'score_awarded': scoreAwarded,
                'time_spent_ms': timeSpentMs,
                'created_at': now.toIso8601String(),
                'updated_at': now.toIso8601String(),
              })),
              retryCount: const Value(0),
              createdAt: Value(now),
            ),
          );
    });

    return attemptId;
  }

  /// Get all attempts for the current user
  Stream<List<model.Attempt>> watchMyAttempts() {
    final userId = _userId;
    if (userId == null) {
      return Stream.value([]);
    }

    return (_database.select(_database.attempts)
          ..where((a) => a.userId.equals(userId))
          ..orderBy([(a) => OrderingTerm.desc(a.createdAt)]))
        .watch()
        .map((rows) => rows.map(DriftMappers.toAttempt).toList());
  }

  /// Get attempts for a specific question
  Future<List<model.Attempt>> getByQuestion(String questionId) async {
    final userId = _userId;
    if (userId == null) {
      return [];
    }

    final rows = await (_database.select(_database.attempts)
          ..where((a) => a.userId.equals(userId))
          ..where((a) => a.questionId.equals(questionId))
          ..orderBy([(a) => OrderingTerm.desc(a.createdAt)]))
        .get();
    return rows.map(DriftMappers.toAttempt).toList();
  }

  /// Get attempt statistics for a skill
  Future<Map<String, int>> getStatsBySkill(String skillId) async {
    // This would require a join with questions table
    // For now, return basic stats
    if (_userId == null) {
      return {'total': 0, 'correct': 0};
    }

    // TODO: Improve query to filter by skill via JOIN
    final attempts = await _database.select(_database.attempts).get();
    final total = attempts.length;
    final correct = attempts.where((a) => a.isCorrect).length;

    return {'total': total, 'correct': correct};
  }

  /// Batch upsert attempts (for sync)
  Future<void> batchUpsert(List<model.Attempt> attempts) async {
    await _database.batch((batch) {
      for (final attempt in attempts) {
        batch.insert(
          _database.attempts,
          DriftMappers.toAttemptRow(attempt),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
  }
}
