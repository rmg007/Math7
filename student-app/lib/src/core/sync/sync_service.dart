import 'dart:convert';
import 'dart:math' as math;

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart'; // For debugPrint
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/core_providers.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/errors/retry_with_backoff.dart';
import 'package:student_app/src/features/curriculum/repositories/curriculum_repositories.dart';
import 'package:student_app/src/features/curriculum/repositories/local_curriculum_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Sync state
class SyncState {
  final bool isSyncing;
  final String? error;
  final DateTime? lastSyncAt;

  SyncState({
    this.isSyncing = false,
    this.error,
    this.lastSyncAt,
  });

  SyncState.idle() : this();
  SyncState.syncing() : this(isSyncing: true);
  SyncState.success(DateTime time) : this(lastSyncAt: time);
  SyncState.error(String message) : this(error: message);

  SyncState copyWith({bool? isSyncing, String? error, DateTime? lastSyncAt}) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      error: error ?? this.error,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
    );
  }
}

// Global circuit breakers for different sync operations
final _pushCircuitBreaker = CircuitBreaker(
  failureThreshold: 3,
  resetTimeout: const Duration(minutes: 5),
);

final _pullCircuitBreaker = CircuitBreaker(
  failureThreshold: 3,
  resetTimeout: const Duration(minutes: 2),
);

/// Sync service provider
final syncServiceProvider =
    StateNotifierProvider<SyncService, SyncState>((ref) {
  final database = ref.watch(databaseProvider);
  final supabase = ref.watch(supabaseClientProvider);
  final curriculumRepo = ref.watch(localCurriculumRepositoryProvider);
  return SyncService(database, supabase, curriculumRepo);
});

/// Sync service - handles push/pull synchronization (manual only)
class SyncService extends StateNotifier<SyncState> {
  final AppDatabase _database;
  final SupabaseClient _supabase;
  final LocalCurriculumRepository _curriculumRepo;

  SyncService(
    this._database,
    this._supabase,
    this._curriculumRepo,
  ) : super(SyncState.idle());

  /// Full sync: push local changes, then pull remote changes
  /// Implements safety limits on retries to prevent infinite loops
  /// Uses circuit breakers to prevent cascade failures
  Future<void> sync({int retryCount = 0}) async {
    if (state.isSyncing && retryCount == 0) return;

    try {
      if (retryCount == 0) {
        state = SyncState.syncing();
      }

      // Use enhanced retry with circuit breaker and jitter
      // Uses module-level _pushCircuitBreaker so failures accumulate across calls
      await retryWithBackoff(
        () async {
          await _performPush();
          await _performPull();
        },
        maxRetries: 2, // Reduced from 3 to prevent excessive retries
        initialDelay: const Duration(seconds: 2),
        maxDelay: const Duration(seconds: 15),
        addJitter: true,
        circuitBreaker: _pushCircuitBreaker,
      );

      state = SyncState.success(DateTime.now());
    } catch (e) {
      debugPrint('SYNC: Error during sync (attempt ${retryCount + 1}): $e');

      // Stop retrying after 2 failed attempts (reduced from 3)
      if (retryCount >= 2) {
        state = SyncState.error('Sync failed after multiple attempts: $e');
        return;
      }

      state = SyncState.error(e.toString());

      // Enhanced exponential backoff with jitter: 2s, 4s
      final baseDelay = Duration(seconds: 2 * (1 << retryCount));
      final jitter = Duration(
        milliseconds:
            (baseDelay.inMilliseconds * 0.3 * (math.Random().nextDouble()))
                .round(),
      );
      final delay = baseDelay + jitter;

      await Future.delayed(delay);

      // Only retry if the state hasn't been changed to syncing again by a manual trigger
      if (!state.isSyncing) {
        await sync(retryCount: retryCount + 1);
      }
    }
  }

  /// Separate push operation with circuit breaker
  Future<void> _performPush() async {
    if (_pushCircuitBreaker.isOpen) {
      throw Exception('Push circuit breaker is open - skipping push operation');
    }

    try {
      await push();
      _pushCircuitBreaker.recordSuccess();
    } catch (e) {
      _pushCircuitBreaker.recordFailure();
      rethrow;
    }
  }

  /// Separate pull operation with circuit breaker
  Future<void> _performPull() async {
    if (_pullCircuitBreaker.isOpen) {
      throw Exception('Pull circuit breaker is open - skipping pull operation');
    }

    try {
      await pull();
      _pullCircuitBreaker.recordSuccess();
    } catch (e) {
      _pullCircuitBreaker.recordFailure();
      rethrow;
    }
  }

  /// Push: Upload pending changes from outbox to Supabase
  /// FIX D4: Guard against concurrent push operations
  /// Push: Upload pending changes from outbox to Supabase
  /// Uses batched operations to reduce network overhead
  Future<void> push() async {
    // Prevent concurrent push
    if (state.isSyncing) {
      debugPrint('SYNC: Push skipped - already syncing');
      return;
    }

    final outboxItems = await (_database.select(_database.outbox)
          ..where((o) => o.status.equals('pending'))
          ..orderBy([(o) => OrderingTerm.asc(o.createdAt)]))
        .get();

    if (outboxItems.isEmpty) return;

    // Group items by Table and Action
    final groups = <String, List<OutboxEntry>>{};
    for (final item in outboxItems) {
      final key = '${item.table}:${item.action}';
      groups.putIfAbsent(key, () => []).add(item);
    }

    for (final groupKey in groups.keys) {
      final items = groups[groupKey]!;
      final parts = groupKey.split(':');
      final tableName = parts[0];
      final action = parts[1];

      // Process in batches of 50 to avoid payload limits
      const int batchSize = 50;
      for (var i = 0; i < items.length; i += batchSize) {
        final batch = items.sublist(
            i, i + batchSize > items.length ? items.length : i + batchSize);

        try {
          if (action == 'INSERT' || action == 'UPSERT') {
            final payloads = batch
                .map((item) => jsonDecode(item.payload) as Map<String, dynamic>)
                .toList();

            if (tableName == 'attempts') {
              // RPC handles progress updates automatically
              final List<dynamic> response = await _supabase.rpc(
                'submit_attempt_and_update_progress',
                params: {
                  'attempts_json': payloads,
                },
              );

              // Update local skill progress if returned
              if (response.isNotEmpty) {
                final progressList = response.map((json) {
                  return SkillProgressCompanion(
                    id: Value(json['id'] as String),
                    userId: Value(json['user_id'] as String),
                    skillId: Value(json['skill_id'] as String),
                    totalAttempts: Value(json['total_attempts'] as int),
                    correctAttempts: Value(json['correct_attempts'] as int),
                    totalPoints: Value(json['total_points'] as int),
                    masteryLevel: Value((json['mastery_level'] as num).round()),
                    currentStreak: Value(json['current_streak'] as int),
                    longestStreak: Value(json['longest_streak'] as int),
                    lastAttemptAt: Value(json['last_attempt_at'] != null
                        ? DateTime.parse(json['last_attempt_at'] as String)
                        : null),
                    createdAt:
                        Value(DateTime.parse(json['created_at'] as String)),
                    updatedAt:
                        Value(DateTime.parse(json['updated_at'] as String)),
                  );
                }).toList();

                await _database.batch((batch) {
                  for (final progress in progressList) {
                    batch.insert(
                      _database.skillProgress,
                      progress,
                      mode: InsertMode.insertOrReplace,
                    );
                  }
                });
              }
            } else {
              await _supabase.from(tableName).upsert(payloads);
            }
          } else if (action == 'DELETE') {
            final ids =
                batch.map((item) => item.recordId).whereType<String>().toList();
            await _supabase.from(tableName).delete().inFilter('id', ids);
          }

          // Remove batch from outbox on success
          await (_database.delete(_database.outbox)
                ..where((o) => o.id.isIn(batch.map((b) => b.id))))
              .go();
        } catch (e) {
          debugPrint('SYNC: Error processing batch for $tableName: $e');
          // For batches, we fail the items individually to respect retry limits
          await _database.batch((batchWriter) {
            for (final item in batch) {
              final newRetryCount = item.retryCount + 1;
              batchWriter.update(
                _database.outbox,
                OutboxCompanion(
                  retryCount: Value(newRetryCount),
                  status: Value(newRetryCount > 5 ? 'failed' : 'pending'),
                ),
                where: (o) => o.id.equals(item.id),
              );
            }
          });
          // Continue to next group/batch instead of rethrowing, to maximize progress
        }
      }
    }
  }

  /// Pull: Download changes from Supabase to local database
  Future<void> pull() async {
    await _pullDomains();
    await _pullSkills();
    await _pullQuestions();
    await _pullSkillProgress();
  }

  Future<void> _pullDomains() async {
    final lastSync = await _getLastSync('domains');

    // Use pull_changes RPC for tombstone support
    final response = await _supabase.rpc('pull_changes', params: {
      'table_name': 'domains',
      'last_sync_time': lastSync.toIso8601String(),
    }) as Map<String, dynamic>;

    final active = response['active'] as List;
    final deleted = response['deleted'] as List;

    // Upsert active records
    if (active.isNotEmpty) {
      final domains =
          active.map((json) => model.Domain.fromJson(json)).toList();
      await _curriculumRepo.batchUpsertDomains(domains);
    }

    // Delete tombstoned records
    if (deleted.isNotEmpty) {
      final deletedIds = deleted.map((json) => json['id'] as String).toList();
      await _curriculumRepo.executeBatchDelete(deletedIds, table: 'domains');
    }

    await _updateLastSync('domains', DateTime.now());
  }

  Future<void> _pullSkills() async {
    final lastSync = await _getLastSync('skills');

    // Use pull_changes RPC for tombstone support
    final response = await _supabase.rpc('pull_changes', params: {
      'table_name': 'skills',
      'last_sync_time': lastSync.toIso8601String(),
    }) as Map<String, dynamic>;

    final active = response['active'] as List;
    final deleted = response['deleted'] as List;

    // Upsert active records
    if (active.isNotEmpty) {
      final skills = active.map((json) => model.Skill.fromJson(json)).toList();
      await _curriculumRepo.batchUpsertSkills(skills);
    }

    // Delete tombstoned records
    if (deleted.isNotEmpty) {
      final deletedIds = deleted.map((json) => json['id'] as String).toList();
      await _curriculumRepo.executeBatchDelete(deletedIds, table: 'skills');
    }

    await _updateLastSync('skills', DateTime.now());
  }

  Future<void> _pullQuestions() async {
    final lastSync = await _getLastSync('questions');

    // Use pull_changes RPC for tombstone support
    final response = await _supabase.rpc('pull_changes', params: {
      'table_name': 'questions',
      'last_sync_time': lastSync.toIso8601String(),
    }) as Map<String, dynamic>;

    final active = response['active'] as List;
    final deleted = response['deleted'] as List;

    // Upsert active records
    if (active.isNotEmpty) {
      final questions =
          active.map((json) => model.Question.fromJson(json)).toList();
      await _curriculumRepo.batchUpsertQuestions(questions);
    }

    // Delete tombstoned records
    if (deleted.isNotEmpty) {
      final deletedIds = deleted.map((json) => json['id'] as String).toList();
      await _curriculumRepo.executeBatchDelete(deletedIds, table: 'questions');
    }

    await _updateLastSync('questions', DateTime.now());
  }

  Future<void> _pullSkillProgress() async {
    final lastSync = await _getLastSync('skill_progress');

    final response = await _supabase.rpc('pull_changes', params: {
      'table_name': 'skill_progress',
      'last_sync_time': lastSync.toIso8601String(),
    }) as Map<String, dynamic>;

    final active = response['active'] as List;
    final deleted = response['deleted'] as List;

    // Upsert active records
    if (active.isNotEmpty) {
      final progressList = active.map((json) {
        return SkillProgressCompanion(
          id: Value(json['id'] as String),
          userId: Value(json['user_id'] as String),
          skillId: Value(json['skill_id'] as String),
          totalAttempts: Value(json['total_attempts'] as int),
          correctAttempts: Value(json['correct_attempts'] as int),
          totalPoints: Value(json['total_points'] as int),
          masteryLevel: Value((json['master_level'] as num).round()),
          currentStreak: Value(json['current_streak'] as int),
          longestStreak: Value(json['longest_streak'] as int),
          lastAttemptAt: Value(json['last_attempt_at'] != null
              ? DateTime.parse(json['last_attempt_at'] as String)
              : null),
          createdAt: Value(DateTime.parse(json['created_at'] as String)),
          updatedAt: Value(DateTime.parse(json['updated_at'] as String)),
        );
      }).toList();

      await _database.batch((batch) {
        for (final progress in progressList) {
          batch.insert(
            _database.skillProgress,
            progress,
            mode: InsertMode.insertOrReplace,
          );
        }
      });
    }

    // Delete tombstoned records
    if (deleted.isNotEmpty) {
      final deletedIds = deleted.map((json) => json['id'] as String).toList();
      await (_database.delete(_database.skillProgress)
            ..where((t) => t.id.isIn(deletedIds)))
          .go();
    }

    await _updateLastSync('skill_progress', DateTime.now());
  }

  Future<DateTime> _getLastSync(String tableName) async {
    final meta = await (_database.select(_database.syncMeta)
          ..where((s) => s.table.equals(tableName))
          ..limit(1))
        .getSingleOrNull();
    return meta?.lastSyncedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
  }

  Future<void> _updateLastSync(String tableName, DateTime time) async {
    await _database.into(_database.syncMeta).insertOnConflictUpdate(
          SyncMetaCompanion(
            table: Value(tableName),
            lastSyncedAt: Value(time),
            updatedAt: Value(time),
          ),
        );
  }
}
