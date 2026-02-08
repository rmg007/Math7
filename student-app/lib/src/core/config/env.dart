/// Environment configuration loaded from compile-time dart-define values.
///
/// These values are injected during `flutter build` via --dart-define flags.
/// See: scripts/deploy/build-student.ps1
///
/// Usage:
/// ```dart
/// import 'package:student_app/src/core/config/env.dart';
///
/// final url = Env.supabaseUrl;
/// final version = Env.appVersion;
/// ```
///
/// To add new environment variables:
/// 1. Add the variable to master-config.json under "student" section
/// 2. Add the --dart-define flag in generate-env.ps1
/// 3. Add the accessor in this file
class Env {
  Env._(); // Prevent instantiation

  /// Application version (synced with master-config.json)
  static const String appVersion = String.fromEnvironment(
    'APP_VERSION',
    defaultValue: 'dev',
  );

  /// Application display name
  static const String appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'Questerix',
  );

  /// Supabase project URL
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  /// Supabase anonymous key (safe for client-side use)
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  /// Primary theme color as hex string (e.g., "0xFF319795")
  static const String _themePrimaryColorRaw = String.fromEnvironment(
    'THEME_PRIMARY_COLOR',
    defaultValue: '0xFF319795',
  );

  /// Parsed theme color as integer
  static int get themePrimaryColor => int.parse(_themePrimaryColorRaw);

  /// Enable offline-first mode with Drift
  static const String _offlineFirstRaw = String.fromEnvironment(
    'ENABLE_OFFLINE_FIRST',
    defaultValue: 'true',
  );

  /// Whether offline-first mode is enabled
  static bool get enableOfflineFirst =>
      _offlineFirstRaw.toLowerCase() == 'true';

  /// Drift database schema version
  static const String _driftDbVersionRaw = String.fromEnvironment(
    'DRIFT_DB_VERSION',
    defaultValue: '1',
  );

  /// Parsed Drift database version
  static int get driftDbVersion => int.parse(_driftDbVersionRaw);

  /// Current environment (development, staging, production)
  static const String environment = String.fromEnvironment(
    'ENV',
    defaultValue: 'development',
  );

  /// Check if running in production
  static bool get isProduction => environment == 'production';

  /// Check if running in development
  static bool get isDevelopment => environment == 'development';

  /// Validate that required environment variables are set.
  ///
  /// Call this at app startup to fail fast if configuration is missing.
  /// Throws [StateError] if required variables are not set.
  ///
  /// Example:
  /// ```dart
  /// void main() {
  ///   Env.validate(); // Throws if SUPABASE_URL or SUPABASE_ANON_KEY missing
  ///   runApp(MyApp());
  /// }
  /// ```
  static void validate() {
    final missing = <String>[];

    if (supabaseUrl.isEmpty) missing.add('SUPABASE_URL');
    if (supabaseAnonKey.isEmpty) missing.add('SUPABASE_ANON_KEY');

    if (missing.isNotEmpty) {
      throw StateError(
        'Missing required environment variables: ${missing.join(', ')}\n'
        'Ensure flutter build includes --dart-define flags.\n'
        'Run: ./scripts/deploy/generate-env.ps1 before building.',
      );
    }
  }

  /// Get a summary of the current environment configuration.
  /// Useful for debugging (masks sensitive values).
  static Map<String, String> get summary => {
        'appVersion': appVersion,
        'appName': appName,
        'environment': environment,
        'supabaseUrl': supabaseUrl.isNotEmpty ? '***configured***' : 'NOT SET',
        'supabaseAnonKey':
            supabaseAnonKey.isNotEmpty ? '***configured***' : 'NOT SET',
        'themePrimaryColor': _themePrimaryColorRaw,
        'enableOfflineFirst': enableOfflineFirst.toString(),
        'driftDbVersion': driftDbVersion.toString(),
      };
}
