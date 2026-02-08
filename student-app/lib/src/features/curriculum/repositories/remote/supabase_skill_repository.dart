import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../interfaces/skill_repository.dart';

/// Remote implementation of SkillRepository using Supabase
class SupabaseSkillRepository implements SkillRepository {
  final SupabaseClient _supabase;

  SupabaseSkillRepository(this._supabase);

  @override
  Stream<List<model.Skill>> watchByDomain(String domainId) {
    return _supabase
        .from('skills')
        .select()
        .eq('domain_id', domainId)
        .eq('is_published', true)
        .order('sort_order', ascending: true)
        .asStream()
        .map((data) => data.map((json) => model.Skill.fromJson(json)).toList());
  }

  @override
  Future<List<model.Skill>> getByDomain(String domainId) async {
    final response = await _supabase
        .from('skills')
        .select()
        .eq('domain_id', domainId)
        .order('sort_order', ascending: true);
    return response.map((json) => model.Skill.fromJson(json)).toList();
  }

  @override
  Future<model.Skill?> getById(String id) async {
    final response =
        await _supabase.from('skills').select().eq('id', id).maybeSingle();
    return response != null ? model.Skill.fromJson(response) : null;
  }
}
