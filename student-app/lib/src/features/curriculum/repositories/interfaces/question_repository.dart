import 'package:questerix_domain/questerix_domain.dart' as model;

/// Abstract repository for questions
abstract class QuestionRepository {
  /// Watch all published questions for a skill
  Stream<List<model.Question>> watchBySkill(String skillId);

  /// Get a single question by ID
  Future<model.Question?> getById(String id);

  /// Get random questions from a skill (for practice)
  Future<List<model.Question>> getRandomBySkill(String skillId, int limit);
}
