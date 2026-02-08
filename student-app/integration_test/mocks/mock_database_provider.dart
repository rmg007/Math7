import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:student_app/src/core/database/database.dart';

/// Mock Database Provider for Integration Tests
///
/// Provides an in-memory Drift database for testing
/// without persisting data to disk.
class MockDatabaseProvider {
  AppDatabase? _database;
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;

  /// Initialize in-memory test database
  Future<void> initialize() async {
    if (_isInitialized) return;

    // Create in-memory database
    _database = AppDatabase(NativeDatabase.memory());
    _isInitialized = true;
  }

  /// Get the mock database instance
  AppDatabase getDatabase() {
    if (!_isInitialized) {
      throw StateError(
          'MockDatabaseProvider not initialized. Call initialize() first.');
    }
    return _database!;
  }

  /// Seed test data into database
  Future<void> seedTestData() async {
    final db = getDatabase();
    final now = DateTime.now();

    // Insert test domains (updated for current schema)
    await db.into(db.domains).insert(DomainsCompanion.insert(
          id: 'test-domain-1',
          slug: 'test-algebra',
          title: 'Test Algebra',
          description: const Value('Test algebra domain'),
          sortOrder: const Value(1),
          isPublished: const Value(true),
          createdAt: now,
          updatedAt: now,
        ));

    await db.into(db.domains).insert(DomainsCompanion.insert(
          id: 'test-domain-2',
          slug: 'test-geometry',
          title: 'Test Geometry',
          description: const Value('Test geometry domain'),
          sortOrder: const Value(2),
          isPublished: const Value(true),
          createdAt: now,
          updatedAt: now,
        ));

    // Insert test skills (updated for current schema)
    await db.into(db.skills).insert(SkillsCompanion.insert(
          id: 'test-skill-1',
          domainId: 'test-domain-1',
          slug: 'linear-equations',
          title: 'Linear Equations',
          description: const Value('Solving linear equations'),
          sortOrder: const Value(1),
          difficultyLevel: const Value(2),
          isPublished: const Value(true),
          createdAt: now,
          updatedAt: now,
        ));

    await db.into(db.skills).insert(SkillsCompanion.insert(
          id: 'test-skill-2',
          domainId: 'test-domain-2',
          slug: 'triangles',
          title: 'Triangles',
          description: const Value('Triangle properties'),
          sortOrder: const Value(1),
          difficultyLevel: const Value(1),
          isPublished: const Value(true),
          createdAt: now,
          updatedAt: now,
        ));

    // Insert test questions (updated for current schema)
    await db.into(db.questions).insert(QuestionsCompanion.insert(
          id: 'test-question-1',
          skillId: 'test-skill-1',
          type: 'multiple_choice',
          content: 'Solve for x: 2x + 5 = 15',
          options: '["3", "5", "7", "10"]',
          solution: '{"correct_answer": "5"}',
          explanation:
              const Value('Subtract 5 from both sides, then divide by 2'),
          points: const Value(10),
          isPublished: const Value(true),
          createdAt: now,
          updatedAt: now,
        ));

    await db.into(db.questions).insert(QuestionsCompanion.insert(
          id: 'test-question-2',
          skillId: 'test-skill-2',
          type: 'true_false',
          content: 'The sum of angles in a triangle is 180 degrees',
          options: '["true", "false"]',
          solution: '{"correct_answer": "true"}',
          explanation:
              const Value('This is a fundamental property of triangles'),
          points: const Value(5),
          isPublished: const Value(true),
          createdAt: now,
          updatedAt: now,
        ));
  }

  /// Clear all data from database
  Future<void> clearData() async {
    final db = getDatabase();

    await db.delete(db.attempts).go();
    await db.delete(db.questions).go();
    await db.delete(db.skills).go();
    await db.delete(db.domains).go();
  }

  /// Close database and clean up
  Future<void> cleanup() async {
    if (_database != null) {
      await _database!.close();
      _database = null;
    }
    _isInitialized = false;
  }

  /// Verify database has test data
  Future<bool> hasTestData() async {
    final db = getDatabase();

    final domains = await db.select(db.domains).get();
    final skills = await db.select(db.skills).get();
    final questions = await db.select(db.questions).get();

    return domains.isNotEmpty && skills.isNotEmpty && questions.isNotEmpty;
  }
}
