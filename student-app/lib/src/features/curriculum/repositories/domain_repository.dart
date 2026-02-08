import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/core/database/providers.dart';
import 'package:student_app/src/core/supabase/providers.dart';

import 'interfaces/domain_repository.dart';
import 'local/drift_domain_repository.dart';
import 'remote/supabase_domain_repository.dart';

export 'interfaces/domain_repository.dart';
export 'local/drift_domain_repository.dart'; // Export for specific local usage
// Remote impl doesn't need to be exported usually, but can be if needed.

/// Provider for domain repository
/// Returns [SupabaseDomainRepository] on Web, and [DriftDomainRepository] on seeded Mobile platforms.
final domainRepositoryProvider = Provider<DomainRepository>((ref) {
  if (kIsWeb) {
    final supabase = ref.watch(supabaseClientProvider);
    return SupabaseDomainRepository(supabase);
  } else {
    // Mobile/Desktop (Offline capable)
    final database = ref.watch(databaseProvider);
    return DriftDomainRepository(database);
  }
});

/// Provider specifically for the Local Domain Repository (Drift)
/// Used by SyncService and DataSeedingService
final localDomainRepositoryProvider = Provider<DriftDomainRepository>((ref) {
  final database = ref.watch(databaseProvider);
  return DriftDomainRepository(database);
});
