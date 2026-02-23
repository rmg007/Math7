import 'package:drift/drift.dart';

import 'connection/unsupported.dart'
    if (dart.library.js_interop) 'connection/web.dart'
    if (dart.library.io) 'connection/native.dart';
import 'tables.dart';

export 'connection/unsupported.dart'
    if (dart.library.js_interop) 'connection/web.dart'
    if (dart.library.io) 'connection/native.dart';

part 'database.g.dart';

// ---------------------------------------------------------------------------
// AppDatabase
// ---------------------------------------------------------------------------

@DriftDatabase(tables: [
  Domains,
  Skills,
  Questions,
  Attempts,
  Sessions,
  SkillProgress,
  Outbox,
  SyncMeta,
  CurriculumMeta,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? e]) : super(e ?? openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        // Handle schema migrations here when upgrading versions.
      },
    );
  }
}
