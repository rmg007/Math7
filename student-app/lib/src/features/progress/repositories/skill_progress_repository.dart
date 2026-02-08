import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/core/database/providers.dart';
import 'package:student_app/src/core/supabase/providers.dart';

final skillProgressRepositoryProvider =
    Provider<SkillProgressRepository>((ref) {
  final database = ref.watch(databaseProvider);
  final userId = ref.watch(currentUserIdProvider);
  return SkillProgressRepository(database, userId);
});

class SkillProgressRepository {
  final AppDatabase _database;
  final String? _userId;
  final _uuid = const Uuid();

  SkillProgressRepository(this._database, this._userId);

  Future<SkillProgressData?> getProgressForSkill(String skillId) async {
    if (_userId == null) return null;

    return (_database.select(_database.skillProgress)
          ..where((p) => p.userId.equals(_userId))
          ..where((p) => p.skillId.equals(skillId))
          ..limit(1))
        .getSingleOrNull();
  }

  Stream<List<SkillProgressData>> watchAllProgress() {
    if (_userId == null) return Stream.value([]);

    return (_database.select(_database.skillProgress)
          ..where((p) => p.userId.equals(_userId))
          ..orderBy([(p) => OrderingTerm.desc(p.lastAttemptAt)]))
        .watch();
  }

  Future<void> recordAttempt({
    required String skillId,
    required bool isCorrect,
    required int pointsEarned,
  }) async {
    if (_userId == null) {
      throw Exception('User not authenticated');
    }

    final now = DateTime.now();
    final existing = await getProgressForSkill(skillId);

    if (existing == null) {
      final progressId = _uuid.v4();
      final newStreak = isCorrect ? 1 : 0;
      final masteryLevel = _calculateMastery(1, isCorrect ? 1 : 0);

      await _database.into(_database.skillProgress).insert(
            SkillProgressCompanion(
              id: Value(progressId),
              userId: Value(_userId),
              skillId: Value(skillId),
              totalAttempts: const Value(1),
              correctAttempts: Value(isCorrect ? 1 : 0),
              totalPoints: Value(pointsEarned),
              masteryLevel: Value(masteryLevel),
              currentStreak: Value(newStreak),
              longestStreak: Value(newStreak),
              lastAttemptAt: Value(now),
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );
    } else {
      final newTotal = existing.totalAttempts + 1;
      final newCorrect = existing.correctAttempts + (isCorrect ? 1 : 0);
      final newPoints = existing.totalPoints + pointsEarned;
      final newStreak = isCorrect ? existing.currentStreak + 1 : 0;
      final newLongest = newStreak > existing.longestStreak
          ? newStreak
          : existing.longestStreak;
      final masteryLevel = _calculateMastery(newTotal, newCorrect);

      await (_database.update(_database.skillProgress)
            ..where((p) => p.id.equals(existing.id)))
          .write(
        SkillProgressCompanion(
          totalAttempts: Value(newTotal),
          correctAttempts: Value(newCorrect),
          totalPoints: Value(newPoints),
          masteryLevel: Value(masteryLevel),
          currentStreak: Value(newStreak),
          longestStreak: Value(newLongest),
          lastAttemptAt: Value(now),
          updatedAt: Value(now),
        ),
      );
    }
  }

  int _calculateMastery(int total, int correct) {
    if (total < 3) return 0;
    final percentage = (correct / total * 100).round();
    return percentage.clamp(0, 100);
  }

  Future<Map<String, dynamic>> getOverallStats() async {
    if (_userId == null) {
      return {
        'totalPoints': 0,
        'totalAttempts': 0,
        'totalCorrect': 0,
        'averageMastery': 0,
        'longestStreak': 0,
        'currentStreak': 0,
      };
    }

    final progress = await (_database.select(_database.skillProgress)
          ..where((p) => p.userId.equals(_userId)))
        .get();

    if (progress.isEmpty) {
      return {
        'totalPoints': 0,
        'totalAttempts': 0,
        'totalCorrect': 0,
        'averageMastery': 0,
        'longestStreak': 0,
        'currentStreak': 0,
      };
    }

    int totalPoints = 0;
    int totalAttempts = 0;
    int totalCorrect = 0;
    int totalMastery = 0;
    int longestStreak = 0;
    int currentStreak = 0;

    for (final p in progress) {
      totalPoints += p.totalPoints;
      totalAttempts += p.totalAttempts;
      totalCorrect += p.correctAttempts;
      totalMastery += p.masteryLevel;
      if (p.longestStreak > longestStreak) longestStreak = p.longestStreak;
      currentStreak += p.currentStreak;
    }

    return {
      'totalPoints': totalPoints,
      'totalAttempts': totalAttempts,
      'totalCorrect': totalCorrect,
      'averageMastery':
          progress.isNotEmpty ? (totalMastery / progress.length).round() : 0,
      'longestStreak': longestStreak,
      'currentStreak': currentStreak,
    };
  }

  Future<int> getMasteryForDomain(String domainId) async {
    if (_userId == null) return 0;

    final skills = await (_database.select(_database.skills)
          ..where((s) => s.domainId.equals(domainId))
          ..where((s) => s.isPublished.equals(true)))
        .get();

    if (skills.isEmpty) return 0;

    int totalMastery = 0;
    int skillsWithProgress = 0;

    for (final skill in skills) {
      final progress = await getProgressForSkill(skill.id);
      if (progress != null) {
        totalMastery += progress.masteryLevel;
        skillsWithProgress++;
      }
    }

    if (skillsWithProgress == 0) return 0;
    return (totalMastery / skillsWithProgress).round();
  }

  Future<int> getPointsForDomain(String domainId) async {
    if (_userId == null) return 0;

    final skills = await (_database.select(_database.skills)
          ..where((s) => s.domainId.equals(domainId))
          ..where((s) => s.isPublished.equals(true)))
        .get();

    int totalPoints = 0;

    for (final skill in skills) {
      final progress = await getProgressForSkill(skill.id);
      if (progress != null) {
        totalPoints += progress.totalPoints;
      }
    }

    return totalPoints;
  }
}
