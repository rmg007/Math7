import 'package:questerix_domain/questerix_domain.dart' as model;

/// Abstract repository for domains
abstract class DomainRepository {
  /// Watch all published, non-deleted domains
  Stream<List<model.Domain>> watchAllPublished();

  /// Get a single domain by ID
  Future<model.Domain?> getById(String id);

  /// Get all domains (for admin or offline access)
  Future<List<model.Domain>> getAll();
}
