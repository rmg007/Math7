import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'curriculum_repositories.dart';

/// Consolidated Remote Repository for all Curriculum entities via Supabase
class SupabaseCurriculumRepository implements CurriculumRepository {
  final SupabaseClient _supabase;

  SupabaseCurriculumRepository(this._supabase);

  // --- DOMAINS ---
  @override
  Stream<List<model.Domain>> watchAllDomains() {
    return _supabase
        .from('domains')
        .select()
        .eq('status', 'live')
        .order('sort_order', ascending: true)
        .asStream()
        .map(
            (data) => data.map((json) => model.Domain.fromJson(json)).toList());
  }

  @override
  Future<model.Domain?> getDomainById(String id) async {
    final response =
        await _supabase.from('domains').select().eq('id', id).maybeSingle();
    return response != null ? model.Domain.fromJson(response) : null;
  }

  // --- SKILLS ---
  @override
  Stream<List<model.Skill>> watchSkillsByDomain(String domainId) {
    return _supabase
        .from('skills')
        .select()
        .eq('domain_id', domainId)
        .eq('status', 'live')
        .order('sort_order', ascending: true)
        .asStream()
        .map((data) => data.map((json) => model.Skill.fromJson(json)).toList());
  }

  @override
  Future<model.Skill?> getSkillById(String id) async {
    final response =
        await _supabase.from('skills').select().eq('id', id).maybeSingle();
    return response != null ? model.Skill.fromJson(response) : null;
  }

  // --- QUESTIONS ---
  @override
  Future<List<model.Question>> getQuestionsBySkill(String skillId) async {
    final response = await _supabase
        .from('questions')
        .select()
        .eq('skill_id', skillId)
        .eq('status', 'live')
        .order('sort_order', ascending: true);
    return response.map((json) => model.Question.fromJson(json)).toList();
  }

  @override
  Future<model.Question?> getQuestionById(String id) async {
    final response =
        await _supabase.from('questions').select().eq('id', id).maybeSingle();
    return response != null ? model.Question.fromJson(response) : null;
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
}
