import 'package:drift/drift.dart';

/// Domains table - Top level subjects (e.g., "Mathematics", "Physics")
class Domains extends Table {
  TextColumn get id => text()();
  // FIX M7: appId for multi-tenant isolation (nullable locally, required on server)
  TextColumn get appId => text().nullable()();
  TextColumn get subjectId => text().nullable()();
  TextColumn get slug => text().withLength(min: 1, max: 100)();
  TextColumn get title => text().withLength(min: 1, max: 200)();
  TextColumn get description => text().nullable()();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();
  BoolColumn get isPublished => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Skills table - Specific topics within a domain (e.g., "Algebra I")
class Skills extends Table {
  TextColumn get id => text()();
  // FIX M7: appId for multi-tenant isolation (nullable locally, required on server)
  TextColumn get appId => text().nullable()();
  TextColumn get domainId => text().references(Domains, #id)();
  TextColumn get slug => text().withLength(min: 1, max: 100)();
  TextColumn get title => text().withLength(min: 1, max: 200)();
  TextColumn get description => text().nullable()();
  IntColumn get difficultyLevel => integer().withDefault(const Constant(1))();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();
  BoolColumn get isPublished => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Questions table - Quiz content with flexible answer structures
class Questions extends Table {
  TextColumn get id => text()();
  // FIX M7: appId for multi-tenant isolation (nullable locally, required on server)
  TextColumn get appId => text().nullable()();
  TextColumn get skillId => text().references(Skills, #id)();
  TextColumn get type => text()(); // question_type enum
  TextColumn get content => text()();
  TextColumn get options => text()(); // JSON string
  TextColumn get solution => text()(); // JSON string
  TextColumn get explanation => text().nullable()();
  IntColumn get points => integer().withDefault(const Constant(1))();
  BoolColumn get isPublished => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Attempts table - Student question attempts (transactional data)
class Attempts extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get questionId => text().references(Questions, #id)();
  TextColumn get response => text()(); // JSON string
  BoolColumn get isCorrect => boolean().withDefault(const Constant(false))();
  IntColumn get scoreAwarded => integer().withDefault(const Constant(0))();
  IntColumn get timeSpentMs => integer().nullable()();
  // T2 FIX: Removed localSignature - was security theater (client signs, client verifies = pointless)
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Sessions table - Practice session tracking
class Sessions extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get skillId => text().references(Skills, #id).nullable()();
  DateTimeColumn get startedAt => dateTime()();
  DateTimeColumn get endedAt => dateTime().nullable()();
  IntColumn get questionsAttempted =>
      integer().withDefault(const Constant(0))();
  IntColumn get questionsCorrect => integer().withDefault(const Constant(0))();
  IntColumn get totalTimeMs => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// SkillProgress table - Aggregated mastery levels per skill
class SkillProgress extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get skillId => text().references(Skills, #id)();
  IntColumn get totalAttempts => integer().withDefault(const Constant(0))();
  IntColumn get correctAttempts => integer().withDefault(const Constant(0))();
  IntColumn get totalPoints => integer().withDefault(const Constant(0))();
  IntColumn get masteryLevel =>
      integer().withDefault(const Constant(0))(); // 0-100
  IntColumn get currentStreak => integer().withDefault(const Constant(0))();
  IntColumn get longestStreak => integer().withDefault(const Constant(0))();
  DateTimeColumn get lastAttemptAt => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};

  // FIX D3: Unique constraint to prevent ghost records
  @override
  List<Set<Column>> get uniqueKeys => [
        {userId, skillId}
      ];
}

/// Outbox table - Pending operations queue for offline sync
@DataClassName('OutboxEntry')
class Outbox extends Table {
  TextColumn get id => text()();
  TextColumn get table => text()(); // Renamed from tableName to avoid conflict
  TextColumn get action => text()(); // INSERT, UPDATE, DELETE
  TextColumn get recordId => text()();
  TextColumn get payload => text()(); // JSON string
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  // FIX D1: Status for Dead Letter Queue - 'pending', 'failed'
  TextColumn get status => text().withDefault(const Constant('pending'))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// SyncMeta table - Sync watermarks for differential sync
@DataClassName('SyncMetaEntry')
class SyncMeta extends Table {
  TextColumn get table => text()(); // Renamed from tableName to avoid conflict
  DateTimeColumn get lastSyncedAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {table};
}

/// CurriculumMeta table - Version tracking for content updates
class CurriculumMeta extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get version => integer()();
  DateTimeColumn get publishedAt => dateTime()();
  TextColumn get changeLog => text().nullable()();
}
