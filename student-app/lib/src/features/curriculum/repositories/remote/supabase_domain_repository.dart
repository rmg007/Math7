import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../interfaces/domain_repository.dart';

/// Remote implementation of DomainRepository using Supabase
class SupabaseDomainRepository implements DomainRepository {
  final SupabaseClient _supabase;

  SupabaseDomainRepository(this._supabase);

  @override
  Stream<List<model.Domain>> watchAllPublished() {
    return _supabase
        .from('domains')
        .select()
        .eq('is_published', true)
        .order('sort_order', ascending: true)
        .asStream()
        .map(
            (data) => data.map((json) => model.Domain.fromJson(json)).toList());
  }

  @override
  Future<model.Domain?> getById(String id) async {
    final response =
        await _supabase.from('domains').select().eq('id', id).maybeSingle();
    return response != null ? model.Domain.fromJson(response) : null;
  }

  @override
  Future<List<model.Domain>> getAll() async {
    final response = await _supabase
        .from('domains')
        .select()
        .order('sort_order', ascending: true);
    return response.map((json) => model.Domain.fromJson(json)).toList();
  }
}
