import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/core/database/providers.dart';
import 'package:student_app/src/core/supabase/providers.dart';

import 'interfaces/question_repository.dart';
import 'local/drift_question_repository.dart';
import 'remote/supabase_question_repository.dart';

export 'interfaces/question_repository.dart';
export 'local/drift_question_repository.dart';

/// Provider for question repository
final questionRepositoryProvider = Provider<QuestionRepository>((ref) {
  if (kIsWeb) {
    final supabase = ref.watch(supabaseClientProvider);
    return SupabaseQuestionRepository(supabase);
  } else {
    final database = ref.watch(databaseProvider);
    return DriftQuestionRepository(database);
  }
});

/// Provider specifically for Local Question Repository
final localQuestionRepositoryProvider =
    Provider<DriftQuestionRepository>((ref) {
  final database = ref.watch(databaseProvider);
  return DriftQuestionRepository(database);
});
