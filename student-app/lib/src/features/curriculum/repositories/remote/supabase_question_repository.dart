import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../interfaces/question_repository.dart';

/// Remote implementation of QuestionRepository using Supabase
class SupabaseQuestionRepository implements QuestionRepository {
  final SupabaseClient _supabase;

  SupabaseQuestionRepository(this._supabase);

  @override
  Stream<List<model.Question>> watchBySkill(String skillId) {
    return _supabase
        .from('questions')
        .select()
        .eq('skill_id', skillId)
        .eq('is_published', true)
        .asStream()
        .map((data) =>
            data.map((json) => model.Question.fromJson(json)).toList());
  }

  @override
  Future<model.Question?> getById(String id) async {
    final response =
        await _supabase.from('questions').select().eq('id', id).maybeSingle();
    return response != null ? model.Question.fromJson(response) : null;
  }

  @override
  Future<List<model.Question>> getRandomBySkill(
      String skillId, int limit) async {
    // Note: 'random()' is difficult in standard Supabase select without RPC.
    // For now, we'll fetch all published questions for the skill and shuffle locally.
    // A better approach would be a dedicated RPC 'get_random_questions'.
    final response = await _supabase
        .from('questions')
        .select()
        .eq('skill_id', skillId)
        .eq('is_published', true);

    final questions =
        response.map((json) => model.Question.fromJson(json)).toList();
    questions.shuffle();
    return questions.take(limit).toList();
  }
}
