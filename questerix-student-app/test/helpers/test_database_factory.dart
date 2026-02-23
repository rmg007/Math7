import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:student_app/src/core/database/database.dart';

import '../fixtures/question_fixtures.dart' as fixtures;

/// Factory for creating in-memory databases for testing.
class TestDatabaseFactory {
  /// Creates an empty in-memory database.
  static AppDatabase createEmptyDb() {
    return AppDatabase(NativeDatabase.memory());
  }

  /// Creates an in-memory database seeded with standard test fixtures.
  static Future<AppDatabase> createSeededDb() async {
    final db = createEmptyDb();

    // 1. Seed a default Domain
    const domainId = 'test-domain-1';
    await db.into(db.domains).insert(DomainsCompanion.insert(
          id: domainId,
          slug: 'test-domain',
          title: 'Test Domain',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ));

    // 2. Seed a default Skill
    const skillId = 'test-skill-1';
    await db.into(db.skills).insert(SkillsCompanion.insert(
          id: skillId,
          domainId: domainId,
          slug: 'test-skill',
          title: 'Test Skill',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ));

    // 3. Seed Questions from fixtures
    for (final fixture in fixtures.allFixtures) {
      final index = fixtures.allFixtures.indexOf(fixture);
      final id = 'test-question-$index';

      await db.into(db.questions).insert(QuestionsCompanion.insert(
            id: id,
            skillId: skillId,
            type: fixture.questionType.toJson(),
            content: fixture.text,
            options: jsonEncode(fixture.metadata['options'] ?? []),
            solution: jsonEncode(fixture.metadata['correct_answer'] ??
                fixture.metadata['sample_answer'] ??
                ''),
            explanation: Value(fixture.metadata['explanation'] as String?),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ));
    }

    return db;
  }
}
