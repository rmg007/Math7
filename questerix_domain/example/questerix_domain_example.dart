import 'package:questerix_domain/questerix_domain.dart';

void main() {
  // Example: Create a Domain
  final domain = Domain(
    id: '1',
    title: 'Mathematics',
    slug: 'mathematics',
    description: 'Core mathematics curriculum',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    isActive: true,
  );

  print('Domain: ${domain.title}');

  // Example: Validate a slug
  final error = QuesterixValidators.validateSlug('valid_slug');
  print('Validation error: ${error ?? "None (valid)"}');
}
