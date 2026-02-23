import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Service for logging security events to the server.
/// Corresponds to the security_logs table and log_security_event RPC.
class SecurityService {
  final SupabaseClient _client;

  SecurityService(this._client);

  /// Log a security event.
  /// Fails silently in production to not disrupt the user.
  Future<void> log({
    required String eventType,
    required String severity, // 'info', 'low', 'medium', 'high', 'critical'
    Map<String, dynamic>? metadata,
    String? appId,
  }) async {
    try {
      await _client.rpc('log_security_event', params: {
        'p_event_type': eventType,
        'p_severity': severity,
        'p_metadata': metadata ?? {},
        'p_app_id': appId,
        'p_location': null,
      });

      if (kDebugMode) {
        debugPrint('🔒 Security Event Logged: $eventType ($severity)');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ Failed to log security event: $e');
      }
      // Silently fail in production
    }
  }

  Future<void> logLogin(String userId) async {
    await log(
      eventType: 'login',
      severity: 'info',
      metadata: {'userId': userId},
    );
  }

  Future<void> logFailedLogin(String email, String reason) async {
    await log(
      eventType: 'failed_login',
      severity: 'low',
      metadata: {'email': email, 'reason': reason},
    );
  }

  Future<void> logLogout() async {
    await log(
      eventType: 'logout',
      severity: 'info',
    );
  }
}
