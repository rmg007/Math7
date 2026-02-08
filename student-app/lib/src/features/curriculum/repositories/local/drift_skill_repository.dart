import 'package:drift/drift.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/database/mappers.dart';
import '../interfaces/skill_repository.dart';

/// Local implementation of SkillRepository using Drift
class DriftSkillRepository implements SkillRepository {
  final AppDatabase _database;

  DriftSkillRepository(this._database);

  @override
  Stream<List<model.Skill>> watchByDomain(String domainId) {
    return (_database.select(_database.skills)
          ..where((s) => s.domainId.equals(domainId))
          ..where((s) => s.isPublished.equals(true))
          ..where((s) => s.deletedAt.isNull())
          ..orderBy([(s) => OrderingTerm.asc(s.sortOrder)]))
        .watch()
        .map((rows) => rows.map(DriftMappers.toSkill).toList());
  }

  @override
  Future<List<model.Skill>> getByDomain(String domainId) async {
    final rows = await (_database.select(_database.skills)
          ..where((s) => s.domainId.equals(domainId))
          ..where((s) => s.deletedAt.isNull())
          ..orderBy([(s) => OrderingTerm.asc(s.sortOrder)]))
        .get();
    return rows.map(DriftMappers.toSkill).toList();
  }

  @override
  Future<model.Skill?> getById(String id) async {
    final row = await (_database.select(_database.skills)
          ..where((s) => s.id.equals(id)))
        .getSingleOrNull();
    return row != null ? DriftMappers.toSkill(row) : null;
  }

  // --- Write methods specific to Local DB ---

  Future<void> upsert(model.Skill skill) async {
    await _database
        .into(_database.skills)
        .insertOnConflictUpdate(DriftMappers.toSkillRow(skill));
  }

  Future<void> batchUpsert(List<model.Skill> skills) async {
    await _database.batch((batch) {
      for (final skill in skills) {
        batch.insert(
          _database.skills,
          DriftMappers.toSkillRow(skill),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
  }

  Future<void> softDelete(String id) async {
    await (_database.update(_database.skills)..where((s) => s.id.equals(id)))
        .write(
      SkillsCompanion(
        deletedAt: Value(DateTime.now()),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Batch delete skills (for tombstone sync)
  Future<void> batchDelete(List<String> ids) async {
    await (_database.delete(_database.skills)
          ..where((s) => s.id.isIn(ids)))
        .go();
  }
}
