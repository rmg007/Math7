import 'package:drift/drift.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/database/mappers.dart';
import '../interfaces/domain_repository.dart';

/// Local implementation of DomainRepository using Drift
class DriftDomainRepository implements DomainRepository {
  final AppDatabase _database;

  DriftDomainRepository(this._database);

  @override
  Stream<List<model.Domain>> watchAllPublished() {
    return (_database.select(_database.domains)
          ..where((d) => d.isPublished.equals(true))
          ..where((d) => d.deletedAt.isNull())
          ..orderBy([(d) => OrderingTerm.asc(d.sortOrder)]))
        .watch()
        .map((rows) => rows.map(DriftMappers.toDomain).toList());
  }

  @override
  Future<model.Domain?> getById(String id) async {
    final row = await (_database.select(_database.domains)
          ..where((d) => d.id.equals(id)))
        .getSingleOrNull();
    return row != null ? DriftMappers.toDomain(row) : null;
  }

  @override
  Future<List<model.Domain>> getAll() async {
    final rows = await (_database.select(_database.domains)
          ..where((d) => d.deletedAt.isNull())
          ..orderBy([(d) => OrderingTerm.asc(d.sortOrder)]))
        .get();
    return rows.map(DriftMappers.toDomain).toList();
  }

  // --- Write methods specific to Local DB (for Sync/Seed) ---

  /// Upsert a domain to local database
  Future<void> upsert(model.Domain domain) async {
    await _database
        .into(_database.domains)
        .insertOnConflictUpdate(DriftMappers.toDomainRow(domain));
  }

  /// Batch upsert domains (for sync)
  Future<void> batchUpsert(List<model.Domain> domains) async {
    await _database.batch((batch) {
      for (final domain in domains) {
        batch.insert(
          _database.domains,
          DriftMappers.toDomainRow(domain),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
  }

  /// Soft delete a domain
  Future<void> softDelete(String id) async {
    await (_database.update(_database.domains)..where((d) => d.id.equals(id)))
        .write(
      DomainsCompanion(
        deletedAt: Value(DateTime.now()),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Batch delete domains (for tombstone sync)
  Future<void> batchDelete(List<String> ids) async {
    await (_database.delete(_database.domains)
          ..where((d) => d.id.isIn(ids)))
        .go();
  }
}
