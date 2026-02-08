# Math7 Student App

A cross-platform Flutter application for 7th-grade mathematics practice, supporting both web (connected) and mobile (offline-first) experiences.

## 🎯 Features

- **Platform-Adaptive Architecture**: Automatically switches between online (Supabase) and offline-first (Drift) data access
- **Welcome Screen with Dual Paths**: Clear entry points for new users ("Get Started") and returning users ("I already have an account")
- **Age-Gated Authentication**: COPPA-compliant onboarding for users under 13 (Parent Approval) and over 13
- **Legal Compliance**: Clickable Terms of Service and Privacy Policy links with dedicated screens
- **Offline Practice**: Mobile users can practice math problems without internet connectivity
- **Real-time Sync**: Seamless synchronization between local and remote data
- **Progress Tracking**: Track mastery levels, streaks, and performance metrics
- **Multiple Question Types**: Multiple choice, reorder, and more
- **Adaptive Learning**: Questions tailored to student skill level
- **Full Accessibility**: WCAG 2.1 AA compliant with screen reader support, high contrast mode, keyboard navigation, and more

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Comprehensive architecture guide, development workflow, and best practices
- **[REPOSITORY_GUIDE.md](./REPOSITORY_GUIDE.md)** - Quick reference for the repository pattern with code examples
- **[ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md)** - User-facing guide to accessibility features
- **[WCAG_COMPLIANCE_CHECKLIST.md](./WCAG_COMPLIANCE_CHECKLIST.md)** - WCAG 2.1 AA compliance audit
- **[ACCESS IBILITY_IMPLEMENTATION_SUMMARY.md](./ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[.agent/workflows/autopilot.md](./.agent/workflows/autopilot.md)** - Automated development workflow with safe command patterns

## 🚀 Quick Start

### Prerequisites

- Flutter SDK (3.0+)
- Dart SDK (3.0+)
- For mobile: Android Studio or Xcode
- For web: Chrome browser

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd student-app

# Install dependencies
flutter pub get

# Run code generation
dart run build_runner build --delete-conflicting-outputs

# Run the app (web)
flutter run -d chrome

# Run the app (mobile)
flutter run
```

### Environment Setup

Create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗️ Architecture

The app uses a **platform-gated repository pattern**:

```
UI Layer
    ↓
Repository Interface (DomainRepository, SkillRepository, QuestionRepository)
    ↓
┌─────────────┬─────────────┐
│   Web       │   Mobile    │
│  Supabase   │   Drift     │
│  (Remote)   │   (Local)   │
└─────────────┴─────────────┘
```

- **Web**: Direct Supabase queries for lightweight, connected-only experience
- **Mobile**: Local Drift database with background sync for offline-first capability

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed information.

## 🧪 Testing

We use **Widget Tests** to simulate application flows in a controlled environment. This ensures stability across platforms (including Windows) by mocking external dependencies like Supabase and the OS file system.

### Running Tests

```bash
# Run all tests
flutter test

# Run UI Flow tests (Onboarding & Home)
flutter test test/ui/app_flow_test.dart

# Run with coverage
flutter test --coverage
```

### Test Coverage
- **Unit Tests:** Verify business logic in isolation.
- **Widget Tests:** Verify UI flows (`Onboarding`, `Authentication`) using comprehensive mocks:
    - **Supabase:** Mocked clients and sessions.
    - **Database:** In-memory Drift database (NativeDatabase.memory).
    - **Sync:** Mocked SyncService to prevent background recursion.
    - **Status:** The "Authenticated Home Screen Flow" is currently skipped on Windows due to an environment-specific unmount crash, but the logic is fully implemented.

## 🔨 Building

### Web
```bash
flutter build web --release
# Output: build/web/
```

### Android
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### iOS
```bash
flutter build ios --release
# Requires Xcode and Apple Developer account
```

## 📦 Project Structure

```
student-app/
├── lib/
│   ├── src/
│   │   ├── core/
│   │   │   ├── database/        # Drift database (mobile)
│   │   │   ├── supabase/        # Supabase client (web)
│   │   │   └── sync/            # Sync service (mobile)
│   │   └── features/
│   │       └── curriculum/
│   │           ├── repositories/ # Data access layer
│   │           ├── screens/     # UI screens
│   │           └── widgets/     # Reusable widgets
│   └── main.dart
├── test/                        # Tests mirror lib/ structure
├── .agent/workflows/            # Development workflows
├── ARCHITECTURE.md              # Architecture documentation
├── REPOSITORY_GUIDE.md          # Repository pattern guide
└── README.md                    # This file
```

## 🛠️ Development Workflow

The project includes an autopilot workflow for efficient development. Common commands are marked with `// turbo` for safe auto-execution:

```bash
# Analyze code
flutter analyze

# Run tests
flutter test

# Generate code
dart run build_runner build --delete-conflicting-outputs

# Format code
dart format .
```

See [.agent/workflows/autopilot.md](./.agent/workflows/autopilot.md) for the complete workflow.

## 🔑 Key Technologies

- **Flutter** - Cross-platform UI framework
- **Riverpod** - State management and dependency injection
- **Drift** - Local database (SQLite) for mobile
- **Supabase** - Backend-as-a-Service for web
- **go_router** - Declarative routing
- **math7_domain** - Shared domain models

## 📱 Platform Support

- ✅ Web (Chrome, Firefox, Safari, Edge)
- ✅ Android (5.0+)
- ✅ iOS (12.0+)
- ⚠️ Desktop (Windows, macOS, Linux) - Experimental

## ♿ Accessibility

The Math7 Student App is designed to be accessible to all students, regardless of their abilities.

### Accessibility Features:
- **Screen Reader Support**: Full compatibility with VoiceOver (iOS), TalkBack (Android), and NVDA/JAWS (Web)
- **High Contrast Mode**: Enhanced visuals for students with low vision
- **Text Scaling**: Support for text sizes up to 300% without loss of functionality
- **Keyboard Navigation**: Complete keyboard accessibility on web and desktop
- **Reduced Motion**: Respects system settings to minimize animations
- **Semantic Widgets**: Custom accessible UI components with proper ARIA labels

### Compliance:
- ✅ **WCAG 2.1 Level A**: Fully compliant
- ✅ **WCAG 2.1 Level AA**: Fully compliant
- ⚠️ **WCAG 2.1 Level AAA**: Partially compliant (67%)

### Learn More:
- [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) - How to use accessibility features
- [WCAG_COMPLIANCE_CHECKLIST.md](./WCAG_COMPLIANCE_CHECKLIST.md) - Technical compliance audit

## 🤝 Contributing

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the codebase
2. Check [REPOSITORY_GUIDE.md](./REPOSITORY_GUIDE.md) for repository pattern usage
3. Follow the [autopilot workflow](./.agent/workflows/autopilot.md)
4. Write tests for new features
5. Run `flutter analyze` before committing
6. Submit a pull request

## 📝 Common Tasks

### Adding a New Feature
See the "Adding a New Feature" section in [ARCHITECTURE.md](./ARCHITECTURE.md#1-adding-a-new-feature)

### Modifying Database Schema
See the "Modifying Database Schema" section in [ARCHITECTURE.md](./ARCHITECTURE.md#modifying-database-schema)

### Using Repositories
See [REPOSITORY_GUIDE.md](./REPOSITORY_GUIDE.md) for practical examples

## 🐛 Troubleshooting

### "No Android SDK found"
Install Android Studio and set the `ANDROID_HOME` environment variable.

### "SupabaseStreamBuilder method not found"
Use `.select().asStream()` instead of `.stream()` in Supabase repositories.

### "Drift code generation fails"
```bash
flutter clean
flutter pub get
dart run build_runner build --delete-conflicting-outputs
```

See [ARCHITECTURE.md](./ARCHITECTURE.md#troubleshooting) for more solutions.

## 📄 License

[Your License Here]

## 👥 Authors

[Your Name/Team]

## 🙏 Acknowledgments

- Flutter team for the amazing framework
- Supabase team for the backend platform
- Drift team for the excellent database solution
- Riverpod team for state management

---

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md)  
For repository pattern usage, see [REPOSITORY_GUIDE.md](./REPOSITORY_GUIDE.md)  
For development workflows, see [.agent/workflows/autopilot.md](./.agent/workflows/autopilot.md)
