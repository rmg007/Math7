import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/core_providers.dart';
import 'local_curriculum_repository.dart';
import 'remote_curriculum_repository.dart';

// --- INTERFACES ---

/// Unified Curriculum Repository Interface
abstract class CurriculumRepository {
  // Domain methods
  Stream<List<model.Domain>> watchAllDomains();
  Future<model.Domain?> getDomainById(String id);

  // Skill methods
  Stream<List<model.Skill>> watchSkillsByDomain(String domainId);
  Future<model.Skill?> getSkillById(String id);

  // Question methods
  Future<List<model.Question>> getQuestionsBySkill(String skillId);
  Future<model.Question?> getQuestionById(String id);
  Future<List<model.Question>> getRandomBySkill(String skillId,
      [int count = 1]);

  // --- Aliases for Backward Compatibility ---
  Stream<List<model.Domain>> watchAllPublished() => watchAllDomains();
  Future<model.Domain?> getById(String id) => getDomainById(id);
  Stream<List<model.Skill>> watchByDomain(String domainId) =>
      watchSkillsByDomain(domainId);
  Future<List<model.Question>> getBySkill(String skillId) =>
      getQuestionsBySkill(skillId);
}

// --- PROVIDERS ---

/// Master Local Repository Provider
final localCurriculumRepositoryProvider =
    Provider<LocalCurriculumRepository>((ref) {
  return LocalCurriculumRepository(ref.watch(databaseProvider));
});

/// Master Remote Repository Provider
final remoteCurriculumRepositoryProvider =
    Provider<SupabaseCurriculumRepository>((ref) {
  return SupabaseCurriculumRepository(ref.watch(supabaseClientProvider));
});

/// Legacy Providers (for backward compatibility)
final domainRepositoryProvider = Provider<CurriculumRepository>(
    (ref) => ref.watch(localCurriculumRepositoryProvider));
final skillRepositoryProvider = Provider<CurriculumRepository>(
    (ref) => ref.watch(localCurriculumRepositoryProvider));
final questionRepositoryProvider = Provider<CurriculumRepository>(
    (ref) => ref.watch(localCurriculumRepositoryProvider));

final localDomainRepositoryProvider = Provider<DriftDomainRepository>(
    (ref) => DriftDomainRepository(ref.watch(databaseProvider)));
final localSkillRepositoryProvider = Provider<DriftSkillRepository>(
    (ref) => DriftSkillRepository(ref.watch(databaseProvider)));
final localQuestionRepositoryProvider = Provider<DriftQuestionRepository>(
    (ref) => DriftQuestionRepository(ref.watch(databaseProvider)));
