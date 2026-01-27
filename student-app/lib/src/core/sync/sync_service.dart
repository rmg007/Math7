import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/database/providers.dart';
import 'package:student_app/src/core/supabase/providers.dart';

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

/// Sync service provider
final syncServiceProvider = StateNotifierProvider<SyncService, SyncState>((ref) {
  final database = ref.watch(databaseProvider);
  final supabase = ref.watch(supabaseClientProvider);
  return SyncService(database, supabase);
});

/// Sync service - handles push/pull synchronization
class SyncService extends StateNotifier<SyncState> {
  final AppDatabase _database;
  final SupabaseClient _supabase;
  Timer? _periodicSync;

  SyncService(this._database, this._supabase) : super(SyncState.idle()) {
    _startPeriodicSync();
  }

  void _startPeriodicSync() {
    // Sync every 30 seconds when online
    _periodicSync = Timer.periodic(const Duration(seconds: 30), (_) {
      sync();
    });
  }

  @override
  void dispose() {
    _periodicSync?.cancel();
    super.dispose();
  }

  /// Full sync: push local changes, then pull remote changes
  Future<void> sync() async {
    if (state.isSyncing) return;
    
    try {
      state = SyncState.syncing();
      await push();
      await pull();
      state = SyncState.success(DateTime.now());
    } catch (e) {
      state = SyncState.error(e.toString());
      // Retry after delay
      await Future.delayed(const Duration(seconds: 5));
      if (!state.isSyncing) sync();
    }
  }

  /// Push: Upload pending changes from outbox to Supabase
  Future<void> push() async {
    final outboxItems = await (_database.select(_database.outbox)
          ..orderBy([(o) => OrderingTerm.asc(o.createdAt)]))
        .get();

    for (final item in outboxItems) {
      try {
        final payload = jsonDecode(item.payload) as Map<String, dynamic>;
        
        switch (item.action) {
          case 'INSERT':
          case 'UPSERT':
            // Use batch_submit_attempts RPC for attempts
            if (item.table == 'attempts') {
              await _supabase.rpc('batch_submit_attempts', params: {
                'attempts_json': [payload],
              });
            } else {
              await _supabase.from(item.table).upsert(payload);
            }
            break;
          case 'DELETE':
            await _supabase
                .from(item.table)
                .delete()
                .eq('id', item.recordId);
            break;
        }

        // Remove from outbox on success
        await (_database.delete(_database.outbox)
              ..where((o) => o.id.equals(item.id)))
            .go();
      } catch (e) {
        // Update retry count
        await (_database.update(_database.outbox)
              ..where((o) => o.id.equals(item.id)))
            .write(
          OutboxCompanion(
            retryCount: Value(item.retryCount + 1),
          ),
        );
        
        // Skip items with too many retries
        if (item.retryCount > 5) {
          await (_database.delete(_database.outbox)
                ..where((o) => o.id.equals(item.id)))
              .go();
        }
        
        rethrow;
      }
    }
  }

  /// Pull: Download changes from Supabase to local database
  Future<void> pull() async {
    await _pullDomains();
    await _pullSkills();
    await _pullQuestions();
  }

  Future<void> _pullDomains() async {
    final lastSync = await _getLastSync('domains');
    
    final response = await _supabase
        .from('domains')
        .select()
        .gt('updated_at', lastSync.toIso8601String())
        .isFilter('deleted_at', null);

    if (response.isNotEmpty) {
      final domains = response.map((json) {
        return DomainsCompanion(
          id: Value(json['id'] as String),
          slug: Value(json['slug'] as String),
          title: Value(json['title'] as String),
          description: Value(json['description'] as String?),
          sortOrder: Value(json['sort_order'] as int? ?? 0),
          isPublished: Value(json['is_published'] as bool? ?? false),
          createdAt: Value(DateTime.parse(json['created_at'] as String)),
          updatedAt: Value(DateTime.parse(json['updated_at'] as String)),
          deletedAt: Value(json['deleted_at'] != null 
              ? DateTime.parse(json['deleted_at'] as String) 
              : null),
        );
      }).toList();

      await _database.batch((batch) {
        for (final domain in domains) {
          batch.insert(_database.domains, domain, mode: InsertMode.insertOrReplace);
        }
      });

      await _updateLastSync('domains', DateTime.now());
    }
  }

  Future<void> _pullSkills() async {
    final lastSync = await _getLastSync('skills');
    
    final response = await _supabase
        .from('skills')
        .select()
        .gt('updated_at', lastSync.toIso8601String())
        .isFilter('deleted_at', null);

    if (response.isNotEmpty) {
      final skills = response.map((json) {
        return SkillsCompanion(
          id: Value(json['id'] as String),
          domainId: Value(json['domain_id'] as String),
          slug: Value(json['slug'] as String),
          title: Value(json['title'] as String),
          description: Value(json['description'] as String?),
          difficultyLevel: Value(json['difficulty_level'] as int? ?? 1),
          sortOrder: Value(json['sort_order'] as int? ?? 0),
          isPublished: Value(json['is_published'] as bool? ?? false),
          createdAt: Value(DateTime.parse(json['created_at'] as String)),
          updatedAt: Value(DateTime.parse(json['updated_at'] as String)),
          deletedAt: Value(json['deleted_at'] != null 
              ? DateTime.parse(json['deleted_at'] as String) 
              : null),
        );
      }).toList();

      await _database.batch((batch) {
        for (final skill in skills) {
          batch.insert(_database.skills, skill, mode: InsertMode.insertOrReplace);
        }
      });

      await _updateLastSync('skills', DateTime.now());
    }
  }

  Future<void> _pullQuestions() async {
    final lastSync = await _getLastSync('questions');
    
    final response = await _supabase
        .from('questions')
        .select()
        .gt('updated_at', lastSync.toIso8601String())
        .isFilter('deleted_at', null);

    if (response.isNotEmpty) {
      final questions = response.map((json) {
        return QuestionsCompanion(
          id: Value(json['id'] as String),
          skillId: Value(json['skill_id'] as String),
          type: Value(json['type'] as String),
          content: Value(json['content'] as String),
          options: Value(jsonEncode(json['options'])),
          solution: Value(jsonEncode(json['solution'])),
          explanation: Value(json['explanation'] as String?),
          points: Value(json['points'] as int? ?? 1),
          isPublished: Value(json['is_published'] as bool? ?? false),
          createdAt: Value(DateTime.parse(json['created_at'] as String)),
          updatedAt: Value(DateTime.parse(json['updated_at'] as String)),
          deletedAt: Value(json['deleted_at'] != null 
              ? DateTime.parse(json['deleted_at'] as String) 
              : null),
        );
      }).toList();

      await _database.batch((batch) {
        for (final question in questions) {
          batch.insert(_database.questions, question, mode: InsertMode.insertOrReplace);
        }
      });

      await _updateLastSync('questions', DateTime.now());
    }
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
