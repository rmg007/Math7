import 'package:drift/drift.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/database/mappers.dart';
import 'curriculum_repositories.dart';

/// Consolidated Local Repository for all Curriculum entities via Drift
class LocalCurriculumRepository implements CurriculumRepository {
  final AppDatabase _database;

  LocalCurriculumRepository(this._database);

  // --- DOMAINS ---
  @override
  Stream<List<model.Domain>> watchAllDomains() {
    return (_database.select(_database.domains)
          ..where((d) => d.deletedAt.isNull())
          ..orderBy([(d) => OrderingTerm.asc(d.sortOrder)]))
        .watch()
        .map((rows) => rows.map(DriftMappers.toDomain).toList());
  }

  @override
  Future<model.Domain?> getDomainById(String id) async {
    final row = await (_database.select(_database.domains)
          ..where((d) => d.id.equals(id)))
        .getSingleOrNull();
    return row != null ? DriftMappers.toDomain(row) : null;
  }

  // --- SKILLS ---
  @override
  Stream<List<model.Skill>> watchSkillsByDomain(String domainId) {
    return (_database.select(_database.skills)
          ..where((s) => s.domainId.equals(domainId))
          ..where((s) => s.deletedAt.isNull())
          ..orderBy([(s) => OrderingTerm.asc(s.sortOrder)]))
        .watch()
        .map((rows) => rows.map(DriftMappers.toSkill).toList());
  }

  @override
  Future<model.Skill?> getSkillById(String id) async {
    final row = await (_database.select(_database.skills)
          ..where((s) => s.id.equals(id)))
        .getSingleOrNull();
    return row != null ? DriftMappers.toSkill(row) : null;
  }

  // --- QUESTIONS ---
  @override
  Future<List<model.Question>> getQuestionsBySkill(String skillId) async {
    final rows = await (_database.select(_database.questions)
          ..where((q) => q.skillId.equals(skillId))
          ..where((q) => q.deletedAt.isNull()))
        .get();
    return rows.map(DriftMappers.toQuestion).toList();
  }

  @override
  Future<model.Question?> getQuestionById(String id) async {
    final row = await (_database.select(_database.questions)
          ..where((q) => q.id.equals(id)))
        .getSingleOrNull();
    return row != null ? DriftMappers.toQuestion(row) : null;
  }

  // --- Aliases ---
  @override
  Stream<List<model.Domain>> watchAllPublished() => watchAllDomains();
  @override
  Future<model.Domain?> getById(String id) => getDomainById(id);
  @override
  Stream<List<model.Skill>> watchByDomain(String domainId) =>
      watchSkillsByDomain(domainId);
  @override
  Future<List<model.Question>> getBySkill(String skillId) =>
      getQuestionsBySkill(skillId);

  @override
  Future<List<model.Question>> getRandomBySkill(String skillId,
      [int count = 1]) async {
    final questions = await getBySkill(skillId);
    if (questions.isEmpty) return [];
    questions.shuffle();
    return questions.take(count).toList();
  }

  // --- WRITE METHODS (for Sync) ---

  Future<void> batchUpsertDomains(List<model.Domain> domains) async {
    await _database.batch((batch) {
      for (final domain in domains) {
        batch.insert(_database.domains, DriftMappers.toDomainRow(domain),
            mode: InsertMode.insertOrReplace);
      }
    });
  }

  Future<void> batchUpsertSkills(List<model.Skill> skills) async {
    await _database.batch((batch) {
      for (final skill in skills) {
        batch.insert(_database.skills, DriftMappers.toSkillRow(skill),
            mode: InsertMode.insertOrReplace);
      }
    });
  }

  Future<void> batchUpsertQuestions(List<model.Question> questions) async {
    await _database.batch((batch) {
      for (final question in questions) {
        batch.insert(_database.questions, DriftMappers.toQuestionRow(question),
            mode: InsertMode.insertOrReplace);
      }
    });
  }

  Future<void> executeBatchDelete(List<String> ids,
      {required String table}) async {
    if (table == 'domains') {
      await (_database.delete(_database.domains)..where((d) => d.id.isIn(ids)))
          .go();
    } else if (table == 'skills') {
      await (_database.delete(_database.skills)..where((s) => s.id.isIn(ids)))
          .go();
    } else if (table == 'questions') {
      await (_database.delete(_database.questions)
            ..where((q) => q.id.isIn(ids)))
          .go();
    }
  }
}
