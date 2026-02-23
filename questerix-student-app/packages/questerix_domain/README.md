# Questerix Domain

Shared domain logic and data models for the Questerix ecosystem (Student App & Admin Panel).

## Overview

This is a pure Dart package that provides:

- **Domain Models**: Core data classes (Domain, Skill, Question, Attempt, User)
- **Validation**: Shared validators for slugs, titles, and other common patterns
- **Repository Interfaces**: Abstract repository contracts for dependency injection

## Usage

```dart
import 'package:questerix_domain/questerix_domain.dart';

// Create domain model
final domain = Domain(
  id: '1',
  title: 'Integers',
  slug: 'integers',
  description: 'Working with whole numbers',
  createdAt: DateTime.now(),
);

// Validate slugs
final error = QuesterixValidators.validateSlug('my_slug'); // null = valid
```

## Structure

```
lib/
  questerix_domain.dart       # Main library export
  src/
    models/                   # Domain models with Freezed + JSON
    repositories/             # Abstract repository interfaces
    validation/               # Shared validators
```

## Dependencies

- `equatable` - Value equality comparison
- `freezed_annotation` - Immutable data classes
- `json_annotation` - JSON serialization

## Development

```bash
# Get dependencies
dart pub get

# Run code generation
dart run build_runner build --delete-conflicting-outputs

# Run tests
dart test
```
