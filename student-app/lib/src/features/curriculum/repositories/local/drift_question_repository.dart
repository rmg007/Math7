import 'package:drift/drift.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/database/mappers.dart';
import '../interfaces/question_repository.dart';

/// Local implementation of QuestionRepository using Drift
class DriftQuestionRepository implements QuestionRepository {
  final AppDatabase _database;

  DriftQuestionRepository(this._database);

  @override
  Stream<List<model.Question>> watchBySkill(String skillId) {
    return (_database.select(_database.questions)
          ..where((q) => q.skillId.equals(skillId))
          ..where((q) => q.isPublished.equals(true))
          ..where((q) => q.deletedAt.isNull()))
        .watch()
        .map((rows) => rows.map(DriftMappers.toQuestion).toList());
  }

  @override
  Future<model.Question?> getById(String id) async {
    final row = await (_database.select(_database.questions)
          ..where((q) => q.id.equals(id)))
        .getSingleOrNull();
    return row != null ? DriftMappers.toQuestion(row) : null;
  }

  @override
  Future<List<model.Question>> getRandomBySkill(
      String skillId, int limit) async {
    final questions = await (_database.select(_database.questions)
          ..where((q) => q.skillId.equals(skillId))
          ..where((q) => q.isPublished.equals(true))
          ..where((q) => q.deletedAt.isNull()))
        .get();

    questions.shuffle();
    return questions.take(limit).map(DriftMappers.toQuestion).toList();
  }

  // --- Write methods specific to Local DB ---

  Future<void> upsert(model.Question question) async {
    await _database
        .into(_database.questions)
        .insertOnConflictUpdate(DriftMappers.toQuestionRow(question));
  }

  Future<void> batchUpsert(List<model.Question> questions) async {
    await _database.batch((batch) {
      for (final question in questions) {
        batch.insert(
          _database.questions,
          DriftMappers.toQuestionRow(question),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
  }

  /// Batch delete questions (for tombstone sync)
  Future<void> batchDelete(List<String> ids) async {
    await (_database.delete(_database.questions)
          ..where((q) => q.id.isIn(ids)))
        .go();
  }
}
