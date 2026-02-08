---
description: Autopilot workflow for efficient Flutter/Dart development
---

# Autopilot Workflow for Flutter/Dart Projects

This workflow ensures efficient, automated command execution for common development tasks.

## General Principles

1. **Always use `SafeToAutoRun: true`** for read-only and standard development commands
2. **Set appropriate `WaitMsBeforeAsync`** values based on expected command duration
3. **Run commands in parallel** when there are no dependencies between them
4. **Capture output to files** for long-running commands to avoid truncation

## Common Commands

### Code Analysis & Testing

// turbo
```bash
# Run analyzer (always safe to auto-run)
flutter analyze
```

// turbo
```bash
# Run specific tests (safe to auto-run)
flutter test test/path/to/test_file.dart
```

// turbo
```bash
# Run all tests (safe to auto-run, but may take time)
flutter test
```

### Code Generation

// turbo
```bash
# Run build_runner for code generation (safe to auto-run)
dart run build_runner build --delete-conflicting-outputs
```

// turbo
```bash
# Watch mode for build_runner (safe to auto-run, runs in background)
dart run build_runner watch --delete-conflicting-outputs
```

### Dependency Management

// turbo
```bash
# Get dependencies (always safe)
flutter pub get
```

// turbo
```bash
# Upgrade dependencies (safe, but may change versions)
flutter pub upgrade
```

### Build Commands

// turbo
```bash
# Build for web (safe to auto-run)
flutter build web --release
```

// turbo
```bash
# Build APK for Android (safe if SDK is configured)
flutter build apk --debug
```

// turbo
```bash
# Build for iOS (safe if Xcode is configured)
flutter build ios --debug
```

### Running the App

// turbo
```bash
# Run app in debug mode (safe to auto-run)
flutter run -d chrome
```

// turbo
```bash
# Run app on specific device (safe to auto-run)
flutter run -d <device-id>
```

### Git Operations

// turbo
```bash
# Check git status (always safe)
git status
```

// turbo
```bash
# View git diff (always safe)
git diff
```

## Best Practices for Long Commands

For commands that may produce extensive output or take significant time:

1. **Redirect output to a file:**
   ```bash
   flutter analyze > analysis_output.txt 2>&1
   ```

2. **Use appropriate wait times:**
   - Quick commands (analyze, status): `WaitMsBeforeAsync: 500-2000`
   - Medium commands (test, build): `WaitMsBeforeAsync: 5000-10000`
   - Long commands (full build): Send to background and poll with `command_status`

3. **Check command status for background tasks:**
   - Use `command_status` with appropriate `WaitDurationSeconds`
   - For very long tasks, poll multiple times with increasing intervals

## Project-Specific Commands

### Math7 Student App

// turbo
```bash
# Run mappers and App Flow tests
flutter test test/core/database/mappers_test.dart test/ui/app_flow_test.dart
```

// turbo
```bash
# Analyze specific directories
flutter analyze lib/src/features/curriculum/repositories/
```

## Error Handling

When a command fails:

1. **Capture full output** by redirecting to a file
2. **Read the error file** to understand the issue
3. **Fix the issue** before re-running
4. **Don't retry blindly** - understand the root cause first

## Notes

- The `// turbo` annotation above each command block indicates it's safe to auto-run
- Always verify the working directory (`Cwd`) is correct before running commands
- For destructive operations (delete, clean), consider asking for user confirmation
- When in doubt about safety, set `SafeToAutoRun: false`
