# Repository Pattern - Quick Reference

## Overview

This guide provides quick examples for working with the platform-gated repository pattern in the Math7 Student App.

## Using Repositories in UI

### Basic Pattern

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/features/curriculum/repositories/domain_repository.dart';

class MyWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Automatically gets the right implementation (Supabase or Drift)
    final domainRepo = ref.watch(domainRepositoryProvider);
    
    // Use the repository
    return StreamBuilder(
      stream: domainRepo.watchAllPublished(),
      builder: (context, snapshot) {
        // Build UI
      },
    );
  }
}
```

### Using Async Data with Riverpod

```dart
// Define a provider that uses the repository
final domainsProvider = StreamProvider<List<Domain>>((ref) {
  final repo = ref.watch(domainRepositoryProvider);
  return repo.watchAllPublished();
});

// Use in widget
class DomainListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final domainsAsync = ref.watch(domainsProvider);
    
    return domainsAsync.when(
      data: (domains) => ListView.builder(
        itemCount: domains.length,
        itemBuilder: (context, index) => DomainCard(domains[index]),
      ),
      loading: () => CircularProgressIndicator(),
      error: (error, stack) => ErrorWidget(error),
    );
  }
}
```

## Repository Methods

### DomainRepository

```dart
// Watch all published domains (Stream)
Stream<List<Domain>> watchAllPublished()

// Get domain by ID (Future)
Future<Domain?> getById(String id)

// Get all domains (Future)
Future<List<Domain>> getAll()

// Local only (via localDomainRepositoryProvider)
Future<void> upsert(Domain domain)
Future<void> batchUpsert(List<Domain> domains)
Future<void> softDelete(String id)
```

### SkillRepository

```dart
// Watch skills for a domain (Stream)
Stream<List<Skill>> watchByDomain(String domainId)

// Get skills by domain (Future)
Future<List<Skill>> getByDomain(String domainId)

// Get skill by ID (Future)
Future<Skill?> getById(String id)

// Local only (via localSkillRepositoryProvider)
Future<void> upsert(Skill skill)
Future<void> batchUpsert(List<Skill> skills)
Future<void> softDelete(String id)
```

### QuestionRepository

```dart
// Watch questions for a skill (Stream)
Stream<List<Question>> watchBySkill(String skillId)

// Get question by ID (Future)
Future<Question?> getById(String id)

// Get random questions for practice (Future)
Future<List<Question>> getRandomBySkill(String skillId, int limit)

// Local only (via localQuestionRepositoryProvider)
Future<void> upsert(Question question)
Future<void> batchUpsert(List<Question> questions)
Future<void> softDelete(String id)
```

## When to Use Local Providers

**Use `domainRepositoryProvider`** (generic):
- ✅ In UI code for reading data
- ✅ In view models for displaying data
- ✅ Anywhere you only need read access

**Use `localDomainRepositoryProvider`** (specific):
- ✅ In `SyncService` for writing synced data
- ✅ In `DataSeedingService` for initial data load
- ✅ In background jobs that modify local database
- ❌ Never in UI code (use generic provider instead)

## Common Patterns

### Pattern 1: Display List of Items

```dart
final skillsProvider = StreamProvider.family<List<Skill>, String>((ref, domainId) {
  final repo = ref.watch(skillRepositoryProvider);
  return repo.watchByDomain(domainId);
});

class SkillListScreen extends ConsumerWidget {
  final String domainId;
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final skillsAsync = ref.watch(skillsProvider(domainId));
    
    return skillsAsync.when(
      data: (skills) => ListView(
        children: skills.map((s) => SkillTile(s)).toList(),
      ),
      loading: () => LoadingIndicator(),
      error: (e, st) => ErrorMessage(e),
    );
  }
}
```

### Pattern 2: Fetch Single Item

```dart
final domainProvider = FutureProvider.family<Domain?, String>((ref, id) async {
  final repo = ref.watch(domainRepositoryProvider);
  return repo.getById(id);
});

class DomainDetailScreen extends ConsumerWidget {
  final String domainId;
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final domainAsync = ref.watch(domainProvider(domainId));
    
    return domainAsync.when(
      data: (domain) => domain != null 
        ? DomainDetail(domain)
        : NotFoundWidget(),
      loading: () => LoadingIndicator(),
      error: (e, st) => ErrorMessage(e),
    );
  }
}
```

### Pattern 3: Random Questions for Practice

```dart
final practiceQuestionsProvider = FutureProvider.family<List<Question>, String>(
  (ref, skillId) async {
    final repo = ref.watch(questionRepositoryProvider);
    return repo.getRandomBySkill(skillId, 10); // 10 questions
  },
);

class PracticeScreen extends ConsumerWidget {
  final String skillId;
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final questionsAsync = ref.watch(practiceQuestionsProvider(skillId));
    
    return questionsAsync.when(
      data: (questions) => QuestionCarousel(questions),
      loading: () => LoadingIndicator(),
      error: (e, st) => ErrorMessage(e),
    );
  }
}
```

### Pattern 4: Sync Service (Write Operations)

```dart
class SyncService extends StateNotifier<SyncState> {
  final DriftDomainRepository _domainRepo;  // Note: Drift, not interface
  final DriftSkillRepository _skillRepo;
  final DriftQuestionRepository _questionRepo;
  final SupabaseClient _supabase;
  
  SyncService(
    this._domainRepo,
    this._skillRepo,
    this._questionRepo,
    this._supabase,
  ) : super(SyncState.idle());
  
  Future<void> pull() async {
    // Fetch from Supabase
    final response = await _supabase.from('domains').select();
    
    // Convert to domain models
    final domains = response.map((json) => Domain.fromJson(json)).toList();
    
    // Write to local database using Drift repository
    await _domainRepo.batchUpsert(domains);
  }
}

// Provider configuration
final syncServiceProvider = StateNotifierProvider<SyncService, SyncState>((ref) {
  return SyncService(
    ref.watch(localDomainRepositoryProvider),    // Local for writes
    ref.watch(localSkillRepositoryProvider),
    ref.watch(localQuestionRepositoryProvider),
    ref.watch(supabaseClientProvider),
  );
});
```

## Testing

### Mocking Repositories in Tests

```dart
class MockDomainRepository extends Mock implements DomainRepository {}

void main() {
  testWidgets('displays domains', (tester) async {
    final mockRepo = MockDomainRepository();
    
    when(mockRepo.watchAllPublished()).thenAnswer(
      (_) => Stream.value([
        Domain(id: '1', title: 'Algebra', /* ... */),
      ]),
    );
    
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          domainRepositoryProvider.overrideWithValue(mockRepo),
        ],
        child: MyApp(),
      ),
    );
    
    expect(find.text('Algebra'), findsOneWidget);
  });
}
```

## Platform Detection

The repositories automatically detect the platform using `kIsWeb`:

```dart
import 'package:flutter/foundation.dart';

final domainRepositoryProvider = Provider<DomainRepository>((ref) {
  if (kIsWeb) {
    // Web: Use Supabase (connected-only)
    return SupabaseDomainRepository(ref.watch(supabaseClientProvider));
  } else {
    // Mobile/Desktop: Use Drift (offline-first)
    return DriftDomainRepository(ref.watch(databaseProvider));
  }
});
```

You don't need to worry about this in your code - just use the provider and it will work correctly on all platforms.

## Troubleshooting

### Issue: "Type 'DriftDomainRepository' is not a subtype of type 'DomainRepository'"

**Cause**: Trying to use a local provider where a generic provider is expected.

**Solution**: Use the generic provider (`domainRepositoryProvider`) in UI code.

### Issue: "Cannot call 'upsert' on DomainRepository"

**Cause**: The interface only exposes read methods. Write methods are only available on concrete implementations.

**Solution**: 
- If in UI: Don't write directly, use a service or state notifier
- If in service: Use `localDomainRepositoryProvider` to get the Drift implementation

### Issue: "Stream doesn't update when data changes"

**Cause**: 
- Web: Supabase realtime not enabled
- Mobile: Not watching the stream correctly

**Solution**:
- Ensure you're using `StreamBuilder` or Riverpod's `StreamProvider`
- Check that the repository method returns a `Stream`, not a `Future`

## Best Practices

1. ✅ **Always use repository providers** - Never instantiate repositories directly
2. ✅ **Use generic providers in UI** - Let the platform detection work for you
3. ✅ **Use local providers in services** - When you need write access
4. ✅ **Prefer streams for real-time data** - Use `watch*` methods
5. ✅ **Use futures for one-time fetches** - Use `get*` methods
6. ✅ **Handle all async states** - loading, data, error
7. ✅ **Mock repositories in tests** - Don't test against real databases
8. ❌ **Don't mix platform-specific code in UI** - Keep it in repositories
9. ❌ **Don't bypass repositories** - Always go through the abstraction
10. ❌ **Don't use write methods in UI** - Use services or state notifiers

## Quick Checklist

When adding a new feature:

- [ ] Define interface in `interfaces/` directory
- [ ] Implement Drift version in `local/` directory
- [ ] Implement Supabase version in `remote/` directory
- [ ] Create provider in main repository file
- [ ] Export interface and local implementation
- [ ] Use generic provider in UI code
- [ ] Use local provider in sync service (if needed)
- [ ] Write tests with mocked repository
- [ ] Run `flutter analyze` to check for issues
- [ ] Test on both web and mobile platforms
