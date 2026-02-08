/// Shared domain models and validation for the Questerix platform.
///
/// This package provides core data models, repositories interfaces,
/// and validation logic used across the Questerix ecosystem.
library questerix_domain;

// Export models
export 'src/models/domain.dart';
export 'src/models/skill.dart';
export 'src/models/question.dart';
export 'src/models/attempt.dart';
export 'src/models/user.dart';

// Repositories
export 'src/repositories/auth_repository.dart';

// Validators
export 'src/validation/validators.dart';
