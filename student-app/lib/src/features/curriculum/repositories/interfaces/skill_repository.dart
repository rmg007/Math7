import 'package:questerix_domain/questerix_domain.dart' as model;

/// Abstract repository for skills
abstract class SkillRepository {
  /// Watch skills for a specific domain
  Stream<List<model.Skill>> watchByDomain(String domainId);

  /// Get skills by domain ID
  Future<List<model.Skill>> getByDomain(String domainId);

  /// Get a single skill by ID
  Future<model.Skill?> getById(String id);
}
