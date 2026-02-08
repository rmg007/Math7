# Math7 Student App - Architecture & Development Guide

## Project Overview

The Math7 Student App is a Flutter application designed for 7th-grade mathematics practice. It supports both **Web** (connected-only) and **Mobile** (offline-first) platforms through a platform-gated architecture.

## Architecture

### Platform-Gated Data Access

The application uses a **Repository Pattern** with platform-specific implementations:

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                         │
│  (Screens, Widgets, View Models)                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│            Repository Interfaces                     │
│  - DomainRepository                                 │
│  - SkillRepository                                  │
│  - QuestionRepository                               │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│   Web (kIsWeb)│      │   Mobile     │
│   Supabase   │      │   Drift      │
│   Remote     │      │   Local      │
└──────────────┘      └──────────────┘
```

### Key Components

#### 1. Repository Interfaces (`lib/src/features/curriculum/repositories/interfaces/`)
- `DomainRepository` - Curriculum domains (algebra, geometry, etc.)
- `SkillRepository` - Individual skills within domains
- `QuestionRepository` - Practice questions

**Contract**: Read-only for UI (Stream/Future), Write methods only in concrete implementations.

#### 2. Local Implementations (`lib/src/features/curriculum/repositories/local/`)
- `DriftDomainRepository`
- `DriftSkillRepository`
- `DriftQuestionRepository`

**Purpose**: Offline-first data access using Drift (SQLite) for mobile platforms.

**Features**:
- Full CRUD operations
- Batch operations for sync
- Soft delete support
- Optimized queries with indexes

#### 3. Remote Implementations (`lib/src/features/curriculum/repositories/remote/`)
- `SupabaseDomainRepository`
- `SupabaseSkillRepository`
- `SupabaseQuestionRepository`

**Purpose**: Connected-only data access for web platform.

**Features**:
- Real-time data streaming via `.select().asStream()`
- Direct Supabase queries
- No local persistence

#### 4. Provider Configuration (`lib/src/features/curriculum/repositories/`)
Platform-aware providers automatically inject the correct implementation:

```dart
final domainRepositoryProvider = Provider<DomainRepository>((ref) {
  if (kIsWeb) {
    return SupabaseDomainRepository(ref.watch(supabaseClientProvider));
  } else {
    return DriftDomainRepository(ref.watch(databaseProvider));
  }
});
```

**Special Providers** for services requiring write access:
- `localDomainRepositoryProvider`
- `localSkillRepositoryProvider`
- `localQuestionRepositoryProvider`

### Data Flow

#### Web Platform
```
User Action → UI → SupabaseRepository → Supabase Cloud → UI Update
```

#### Mobile Platform
```
User Action → UI → DriftRepository → Local SQLite → UI Update
                                    ↓
                              SyncService (background)
                                    ↓
                              Supabase Cloud
```

### Synchronization (Mobile Only)

The `SyncService` (`lib/src/core/sync/sync_service.dart`) handles bidirectional sync:

**Pull**: Downloads new/updated data from Supabase
```dart
await _pullDomains();
await _pullSkills();
await _pullQuestions();
```

**Push**: Uploads local changes from the outbox table
```dart
// Processes outbox items and syncs to Supabase
// Uses RPCs for complex operations (e.g., submit_attempt_and_update_progress)
```

## Database Schema

### Drift Tables (`lib/src/core/database/tables.dart`)
- `Domains` - Curriculum domains
- `Skills` - Skills within domains
- `Questions` - Practice questions
- `Attempts` - User attempt records
- `Sessions` - Practice sessions
- `SkillProgress` - User progress tracking
- `Outbox` - Pending sync operations
- `SyncMeta` - Last sync timestamps
- `CurriculumMeta` - Curriculum metadata

### Supabase Tables
Mirror structure with additional RLS (Row Level Security) policies.

### 5. Authentication & Onboarding

The app implements a polished, COPPA-compliant onboarding flow.

#### Entry Points

1. **Welcome Screen** (`WelcomeScreen`):
   - Primary entry point with gradient background
   - Two clear paths: "Get Started" (new users) and "I already have an account" (returning users)
   - Clickable Terms of Service and Privacy Policy links

2. **Login Screen** (`LoginScreen`):
   - For returning users
   - "Register" link redirects to OnboardingScreen (ensuring age verification)

3. **Onboarding Screen** (`OnboardingScreen`):
   - Beautiful gradient design matching Welcome Screen
   - Age verification with birthday cake icon and date picker
   - Responsive white card UI for date selection

#### Age-Gated Flow

1. **Age Gate**: User selects birth date
   - Clean UI with icon, gradient background, and card-based interaction
   
2. **Under 13**:
   - App requests **Parent's Email**
   - System sends a Magic Link to the parent
   - Parent acts as the account owner/approver
   - Agreement is implicit in the approval request but explicitly noted

3. **Over 13**:
   - Student signs up with their own email
   - Must explicitly agree to Terms & Privacy Policy via checkbox
   - System sends Magic Link for passwordless login

#### Legal Compliance Screens

- **TermsOfServiceScreen**: Comprehensive terms with sections covering acceptance, license, conduct, IP, etc.
- **PrivacyPolicyScreen**: Full privacy policy with COPPA compliance details, data collection, user rights

#### Data Model

- `User` (Domain): Tracks `ageGroup` and `isParentManaged`
- **Note**: Currently uses a "One Email = One User" model

#### Screen Files

```
lib/src/features/auth/screens/
├── welcome_screen.dart        # Entry point with dual paths
├── login_screen.dart          # Returning user login
├── register_screen.dart       # Legacy (deprecated, use OnboardingScreen)
├── onboarding_screen.dart     # Age verification + signup
├── terms_of_service_screen.dart   # Terms of Service
└── privacy_policy_screen.dart     # Privacy Policy
```

## Development Workflow

### 1. Adding a New Feature

**Step 1**: Define the interface (if needed)
```dart
// lib/src/features/curriculum/repositories/interfaces/new_repository.dart
abstract class NewRepository {
  Stream<List<NewEntity>> watchAll();
  Future<NewEntity?> getById(String id);
}
```

**Step 2**: Implement local version
```dart
// lib/src/features/curriculum/repositories/local/drift_new_repository.dart
class DriftNewRepository implements NewRepository {
  final AppDatabase _database;
  // Implementation using Drift queries
}
```

**Step 3**: Implement remote version
```dart
// lib/src/features/curriculum/repositories/remote/supabase_new_repository.dart
class SupabaseNewRepository implements NewRepository {
  final SupabaseClient _supabase;
  // Implementation using Supabase queries
}
```

**Step 4**: Configure provider
```dart
// lib/src/features/curriculum/repositories/new_repository.dart
final newRepositoryProvider = Provider<NewRepository>((ref) {
  if (kIsWeb) {
    return SupabaseNewRepository(ref.watch(supabaseClientProvider));
  } else {
    return DriftNewRepository(ref.watch(databaseProvider));
  }
});
```

### 2. Running Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/features/curriculum/screens/practice_screen_test.dart

# Run with coverage
flutter test --coverage
```

### 3. Code Generation

```bash
# Generate Drift database code
dart run build_runner build --delete-conflicting-outputs

# Watch mode (auto-regenerate on changes)
dart run build_runner watch --delete-conflicting-outputs
```

### 4. Building for Deployment

**Web**:
```bash
flutter build web --release
# Output: build/web/
```

**Android**:
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

**iOS**:
```bash
flutter build ios --release
# Requires Xcode and Apple Developer account
```

## Common Tasks

### Adding a New Question Type

1. Update `Question` model in `math7-domain` package
2. Add corresponding widget in `lib/src/features/curriculum/widgets/question_widgets.dart`
3. Update `QuestionCard` to handle the new type
4. Run code generation if needed
5. Test with sample data

### Modifying Database Schema

1. Update table definition in `lib/src/core/database/tables.dart`
2. Increment `schemaVersion` in `database.dart`
3. Add migration logic in `onUpgrade`
4. Run `dart run build_runner build --delete-conflicting-outputs`
5. Test migration with existing data

### Adding a New Screen

1. Create screen file in `lib/src/features/[feature]/screens/`
2. Define route in `lib/src/app.dart` (using go_router)
3. Create necessary providers for state management
4. Inject repository dependencies via Riverpod
5. Write widget tests in `test/features/[feature]/screens/`

## Testing Strategy

### Unit Tests
- **Mappers**: `test/core/database/mappers_test.dart`
- **Repositories**: Test both Drift and Supabase implementations
- **Business Logic**: Test providers and state notifiers

### Widget Tests
- **UI Flows**: `test/ui/app_flow_test.dart` (Onboarding, Authentication, Home).
- **Screens**: `test/features/curriculum/screens/`
- **Widgets**: `test/features/curriculum/widgets/`
- **Strategy**: Use `ProviderScope` overrides to mock repositories, Supabase, and Drift specifically for widget tests to run on any platform (including Windows).

### Integration Tests
- Test full user flows
- Test sync operations
- Test offline/online transitions (mobile)

## Troubleshooting

### Common Issues

**Issue**: "No Android SDK found"
**Solution**: Install Android Studio and set `ANDROID_HOME` environment variable

**Issue**: "SupabaseStreamBuilder method not found"
**Solution**: Use `.select().asStream()` instead of `.stream()`

**Issue**: "Drift code generation fails"
**Solution**: 
1. Clean build: `flutter clean`
2. Get dependencies: `flutter pub get`
3. Regenerate: `dart run build_runner build --delete-conflicting-outputs`

**Issue**: "Tests fail with provider errors"
**Solution**: Wrap tests in `ProviderScope` and override necessary providers

### Debugging Tips

1. **Enable verbose logging**: Set `kDebugMode` checks in code
2. **Use Dart DevTools**: `flutter pub global activate devtools` then `dart devtools`
3. **Check Supabase logs**: Use Supabase dashboard for backend issues
4. **Inspect Drift database**: Use SQLite browser to examine local database

## Dependencies

### Core
- `flutter` - UI framework
- `dart` - Programming language

### State Management
- `flutter_riverpod` - Dependency injection and state management
- `riverpod_annotation` - Code generation for providers

### Database
- `drift` - Local database (SQLite) for mobile
- `drift_flutter` - Flutter integration for Drift
- `supabase_flutter` - Supabase client for remote data

### Domain Models
- `math7_domain` - Shared domain models (local package)

### Routing
- `go_router` - Declarative routing

### Code Generation
- `build_runner` - Build system
- `drift_dev` - Drift code generator
- `riverpod_generator` - Riverpod code generator

## Project Structure

```
student-app/
├── lib/
│   ├── src/
│   │   ├── app.dart                    # Main app configuration
│   │   ├── core/
│   │   │   ├── database/               # Drift database setup
│   │   │   │   ├── database.dart
│   │   │   │   ├── tables.dart
│   │   │   │   ├── mappers.dart
│   │   │   │   └── providers.dart
│   │   │   ├── supabase/               # Supabase configuration
│   │   │   │   └── providers.dart
│   │   │   └── sync/                   # Sync service
│   │   │       └── sync_service.dart
│   │   └── features/
│   │       └── curriculum/
│   │           ├── repositories/
│   │           │   ├── interfaces/     # Abstract interfaces
│   │           │   ├── local/          # Drift implementations
│   │           │   ├── remote/         # Supabase implementations
│   │           │   ├── domain_repository.dart
│   │           │   ├── skill_repository.dart
│   │           │   └── question_repository.dart
│   │           ├── screens/            # UI screens
│   │           └── widgets/            # Reusable widgets
│   └── main.dart
├── test/                               # Tests mirror lib/ structure
├── .agent/
│   └── workflows/
│       └── autopilot.md               # Development workflow
└── pubspec.yaml
```

## Best Practices

1. **Always use repository interfaces** in UI code, never concrete implementations
2. **Use `localXxxRepositoryProvider`** only in services that need write access
3. **Run `flutter analyze`** before committing code
4. **Write tests** for new features and bug fixes
5. **Use `// turbo` annotations** in workflow files for safe auto-run commands
6. **Keep domain models in `math7-domain`** package for sharing across apps
7. **Use Riverpod for dependency injection** - avoid manual instantiation
8. **Follow Drift best practices** for database queries (use indexes, batch operations)
9. **Handle offline scenarios** gracefully in mobile app
10. **Use semantic versioning** for releases
11. **Use semantic widgets** for accessibility - wrap UI elements with `SemanticButton`, `SemanticCard`, etc.
12. **Test with screen readers** when adding new UI features

## Accessibility Features

The student app implements comprehensive accessibility features to ensure inclusive learning for all students. The implementation targets WCAG 2.1 AA compliance.

### Features Implemented

#### 1. **High Contrast Mode**
- Automatic detection of system high contrast setting
- WCAG AAA compliant color palettes (7:1 contrast ratio)
- Pure black/white themes with highly saturated accent colors
- Separate themes for light and dark modes
- Implementation: `lib/src/core/theme/app_theme.dart`

#### 2. **Screen Reader Support**
- Comprehensive semantic labels throughout the UI
- Proper ARIA-like annotations using Flutter's `Semantics` widget
- Custom semantic widgets for common patterns:
  - `SemanticButton` - Interactive buttons with labels and hints
  - `SemanticIcon` - Icons with descriptions (decorative icons excluded)
  - `SemanticImage` - Images with alt text
  - `SemanticCard` - Cards with header/button announcements
  - `SemanticTextField` - Form fields with labels and hints
  - `SemanticProgressIndicator` - Progress with percentage announcements
- Implementation: `lib/src/core/accessibility/semantic_widgets.dart`

#### 3. **Reduced Motion Support**
- Detects system reduce motion preference
- Automatically disables or shortens animations
- Respects user's motion sensitivity
- Implementation: `AccessibilityService.getAnimationDuration()`

#### 4. **Text Scaling**
- Full support for user-configured text scale
- Uses Flutter's `TextScaler` API (not deprecated `textScaleFactor`)
- Layouts adapt to large text sizes
- Minimum touch targets of 48x48dp maintained

#### 5. **Keyboard Navigation**
- Focus management for all interactive elements
- Logical tab order throughout the app
- Visual focus indicators
- Implementation: Built into Flutter's Material Design widgets

### Accessibility Service

The `AccessibilityService` provides a centralized way to detect and respond to system accessibility settings:

```dart
// Detect high contrast mode
bool isHighContrast = AccessibilityService.isHighContrastEnabled(context);

// Detect screen reader
bool hasScreenReader = AccessibilityService.isScreenReaderEnabled(context);

// Get appropriate animation duration
Duration duration = AccessibilityService.getAnimationDuration(
  context,
  normal: Duration(milliseconds: 300),
);

// Quick semantic wrapper
Widget semantic = AccessibilityService.withSemantics(
  child: myWidget,
  label: 'Descriptive label',
  hint: 'What happens when activated',
);
```

### Testing Accessibility

**Automated Tests:**
- Run `flutter test test/core/accessibility/accessibility_test.dart`
- Tests cover semantic widgets, settings detection, and animation behavior

**Manual Testing:**
- **iOS**: Enable VoiceOver in Settings → Accessibility
- **Android**: Enable TalkBack in Settings → Accessibility  
- **High Contrast**: Enable in system display settings
- **Text Scaling**: Adjust in system display/accessibility settings

###  Compliance

- **WCAG 2.1 Level AA**: Target compliance level
- **Color Contrast**: AAA for high-contrast themes (7:1), AA for standard themes (4.5:1)
- **Touch Targets**: Minimum 48x48dp for all interactive elements
- **Focus Indicators**: Visible focus states on all focusable elements
- **Screen Reader**: Full semantic tree for navigation

### Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Flutter Accessibility](https://docs.flutter.dev/development/accessibility-and-localization/accessibility)
- [Material Design Accessibility](https://m3.material.io/foundations/accessible-design/overview)


## Next Steps

- [x] Implement user authentication (Age-Gated, Email-only)
- [x] Add accessibility features (screen reader support, high contrast mode, keyboard navigation)
- [ ] Add progress analytics dashboard
- [ ] Implement adaptive learning algorithm
- [ ] Add more question types (graphing, word problems)
- [ ] Implement social features (leaderboards, challenges)
- [ ] Add parent/teacher portal
- [ ] Implement push notifications for practice reminders


## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [Drift Documentation](https://drift.simonbinder.eu)
- [Supabase Documentation](https://supabase.com/docs)
- [Material Design 3](https://m3.material.io)

## Support

For questions or issues, refer to:
1. This documentation
2. Code comments in implementation files
3. Test files for usage examples
4. Walkthrough documents in `.gemini/antigravity/brain/` directory
