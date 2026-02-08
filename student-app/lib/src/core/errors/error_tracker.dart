import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Zero-cost error tracking using Supabase.
/// Replaces Sentry for budget-conscious projects.
class ErrorTracker {
  static final ErrorTracker _instance = ErrorTracker._internal();
  factory ErrorTracker() => _instance;
  ErrorTracker._internal();

  String? _appVersion;
  String? _appId;

  /// Initialize the error tracker with app metadata.
  void init({String? appVersion, String? appId}) {
    _appVersion = appVersion;
    _appId = appId;
  }

  /// Get the current platform as a string.
  String get _platform {
    if (kIsWeb) return 'web';
    if (Platform.isAndroid) return 'android';
    if (Platform.isIOS) return 'ios';
    if (Platform.isWindows) return 'windows';
    if (Platform.isMacOS) return 'macos';
    if (Platform.isLinux) return 'linux';
    return 'web'; // Fallback
  }

  /// Capture an exception and log it to Supabase.
  Future<String?> captureException(
    dynamic exception, {
    StackTrace? stackTrace,
    Map<String, dynamic>? extra,
  }) async {
    try {
      final client = Supabase.instance.client;

      final response = await client.rpc('log_error', params: {
        'p_platform': _platform,
        'p_error_type': exception.runtimeType.toString(),
        'p_error_message': exception.toString(),
        'p_stack_trace': stackTrace?.toString(),
        'p_url': null,
        'p_user_agent': null,
        'p_app_version': _appVersion,
        'p_app_id': _appId,
        'p_extra_context': extra ?? {},
      });

      if (kDebugMode) {
        print('[ErrorTracker] Error logged: $response');
      }

      return response as String?;
    } catch (e) {
      // Fail silently to avoid infinite loops
      if (kDebugMode) {
        print('[ErrorTracker] Failed to log error: $e');
      }
      return null;
    }
  }

  /// Capture a message (non-error event).
  Future<String?> captureMessage(
    String message, {
    String level = 'info',
    Map<String, dynamic>? extra,
  }) async {
    return captureException(
      Exception(message),
      extra: {...?extra, 'level': level},
    );
  }
}

/// Global error tracker instance.
final errorTracker = ErrorTracker();
