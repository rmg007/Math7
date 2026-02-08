import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/core/database/providers.dart';
import 'package:student_app/src/core/supabase/providers.dart';

import 'interfaces/skill_repository.dart';
import 'local/drift_skill_repository.dart';
import 'remote/supabase_skill_repository.dart';

export 'interfaces/skill_repository.dart';
export 'local/drift_skill_repository.dart';

/// Provider for skill repository
final skillRepositoryProvider = Provider<SkillRepository>((ref) {
  if (kIsWeb) {
    final supabase = ref.watch(supabaseClientProvider);
    return SupabaseSkillRepository(supabase);
  } else {
    final database = ref.watch(databaseProvider);
    return DriftSkillRepository(database);
  }
});

/// Provider specifically for Local Skill Repository
final localSkillRepositoryProvider = Provider<DriftSkillRepository>((ref) {
  final database = ref.watch(databaseProvider);
  return DriftSkillRepository(database);
});
