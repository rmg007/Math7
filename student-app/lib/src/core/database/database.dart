import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:path_provider/path_provider.dart';

import 'tables.dart';

part 'database.g.dart';

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
  AppDatabase([QueryExecutor? e]) : super(e ?? _openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        // Handle schema migrations here when upgrading versions
      },
    );
  }
}

QueryExecutor _openConnection() {
  return driftDatabase(
    name: 'questerix',
    native: const DriftNativeOptions(
      databaseDirectory: getApplicationDocumentsDirectory,
    ),
    web: DriftWebOptions(
      sqlite3Wasm: Uri.parse('sqlite3.wasm'),
      driftWorker: Uri.parse('drift_worker.js'),
      onResult: (result) {
        if (result.missingFeatures.isNotEmpty) {
          // print('Drift Web: Missing features: ${result.missingFeatures}');
          // print('Drift Web: Using implementation: ${result.chosenImplementation}');
        }
      },
    ),
  );
}
