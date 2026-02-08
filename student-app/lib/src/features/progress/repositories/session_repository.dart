import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/database/providers.dart';
import 'package:student_app/src/core/supabase/providers.dart';

final practiceSessionRepositoryProvider =
    Provider<PracticeSessionRepository>((ref) {
  final database = ref.watch(databaseProvider);
  final userId = ref.watch(currentUserIdProvider);
  return PracticeSessionRepository(database, userId);
});

class PracticeSessionRepository {
  final AppDatabase _database;
  final String? _userId;
  final _uuid = const Uuid();

  PracticeSessionRepository(this._database, this._userId);

  Future<String> startSession({required String skillId}) async {
    if (_userId == null) {
      throw Exception('User not authenticated');
    }

    final sessionId = _uuid.v4();
    final now = DateTime.now();

    await _database.into(_database.sessions).insert(
          SessionsCompanion(
            id: Value(sessionId),
            userId: Value(_userId),
            skillId: Value(skillId),
            startedAt: Value(now),
            questionsAttempted: const Value(0),
            questionsCorrect: const Value(0),
            totalTimeMs: const Value(0),
            createdAt: Value(now),
            updatedAt: Value(now),
          ),
        );

    return sessionId;
  }

  Future<void> updateSession({
    required String sessionId,
    required int questionsAttempted,
    required int questionsCorrect,
    required int totalTimeMs,
  }) async {
    final now = DateTime.now();

    await (_database.update(_database.sessions)
          ..where((s) => s.id.equals(sessionId)))
        .write(
      SessionsCompanion(
        questionsAttempted: Value(questionsAttempted),
        questionsCorrect: Value(questionsCorrect),
        totalTimeMs: Value(totalTimeMs),
        updatedAt: Value(now),
      ),
    );
  }

  Future<void> endSession(String sessionId) async {
    final now = DateTime.now();

    await (_database.update(_database.sessions)
          ..where((s) => s.id.equals(sessionId)))
        .write(
      SessionsCompanion(
        endedAt: Value(now),
        updatedAt: Value(now),
      ),
    );
  }

  Future<Session?> getActiveSession() async {
    if (_userId == null) return null;

    return (_database.select(_database.sessions)
          ..where((s) => s.userId.equals(_userId))
          ..where((s) => s.endedAt.isNull())
          ..orderBy([(s) => OrderingTerm.desc(s.startedAt)])
          ..limit(1))
        .getSingleOrNull();
  }

  Future<List<Session>> getCompletedSessions({int limit = 10}) async {
    if (_userId == null) return [];

    return (_database.select(_database.sessions)
          ..where((s) => s.userId.equals(_userId))
          ..where((s) => s.endedAt.isNotNull())
          ..orderBy([(s) => OrderingTerm.desc(s.endedAt)])
          ..limit(limit))
        .get();
  }

  Stream<List<Session>> watchRecentSessions({int limit = 10}) {
    if (_userId == null) return Stream.value([]);

    return (_database.select(_database.sessions)
          ..where((s) => s.userId.equals(_userId))
          ..orderBy([(s) => OrderingTerm.desc(s.startedAt)])
          ..limit(limit))
        .watch();
  }

  Future<Map<String, dynamic>> getSessionStats() async {
    if (_userId == null) {
      return {
        'totalSessions': 0,
        'totalQuestions': 0,
        'totalCorrect': 0,
        'totalTimeMs': 0,
      };
    }

    final sessions = await (_database.select(_database.sessions)
          ..where((s) => s.userId.equals(_userId))
          ..where((s) => s.endedAt.isNotNull()))
        .get();

    int totalQuestions = 0;
    int totalCorrect = 0;
    int totalTimeMs = 0;

    for (final session in sessions) {
      totalQuestions += session.questionsAttempted;
      totalCorrect += session.questionsCorrect;
      totalTimeMs += session.totalTimeMs;
    }

    return {
      'totalSessions': sessions.length,
      'totalQuestions': totalQuestions,
      'totalCorrect': totalCorrect,
      'totalTimeMs': totalTimeMs,
    };
  }
}
