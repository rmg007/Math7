import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../supabase/providers.dart';
import 'env.dart';

/// Represents the multi-tenant context for the current running session
class AppContext {
  final String appId;
  final String appName;
  final int primaryColor;

  const AppContext({
    required this.appId,
    required this.appName,
    required this.primaryColor,
  });
}

/// Exception thrown when app context cannot be determined
class AppInitializationException implements Exception {
  final String message;
  final String? subdomain;

  AppInitializationException(this.message, {this.subdomain});

  @override
  String toString() =>
      'AppInitializationException: $message (subdomain: $subdomain)';
}

/// Provides access to the current [AppContext] and manages its loading.
final appConfigProvider =
    StateNotifierProvider<AppConfigService, AppContext?>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return AppConfigService(supabase);
});

// For backward compatibility if needed, or just use appConfigProvider.notifier
final appConfigServiceProvider = Provider<AppConfigService>((ref) {
  return ref.watch(appConfigProvider.notifier);
});

class AppConfigService extends StateNotifier<AppContext?> {
  final SupabaseClient _supabase;

  AppConfigService(this._supabase) : super(null);

  Future<AppContext> load() async {
    // 1. Detect Subdomain (Web)
    String? subdomain;

    if (kIsWeb) {
      final uri = Uri.base;
      final host = uri.host;
      // Logic: sub.domain.com -> sub
      if (host != 'localhost' && host != '127.0.0.1') {
        final parts = host.split('.');
        if (parts.isNotEmpty) {
          subdomain = parts[0];
        }
      } else {
        // Dev fallback for localhost - explicit only
        // subdomain = 'app'; // VIOLATION: Commented out for Ironclad Compliance
      }
    }

    if (subdomain == null) {
       throw AppInitializationException(
         'Security Violation: No tenant subdomain detected. Hardcoded fallbacks are disabled.',
         subdomain: 'null'
       );
    }

    // 2. Fetch Config from Database (apps table)
    try {
      final response = await _supabase
          .from('apps')
          .select('app_id, display_name, subdomain')
          .eq('subdomain', subdomain)
          .eq('is_active', true)
          .maybeSingle();

      if (response != null) {
        final context = AppContext(
          appId: response['app_id'] as String,
          appName: (response['display_name'] as String?) ?? Env.appName,
          primaryColor: Env.themePrimaryColor, // Use env config for theme
        );

        state = context;
        return context;
      }
    } catch (e) {
      debugPrint('Error loading app config for subdomain $subdomain: $e');
    }

    // 3. No fallback - tenant context MUST be determined from network
    // Using a hardcoded default would corrupt multi-tenant isolation
    throw AppInitializationException(
      'Unable to determine app context. Please check your internet connection and try again.',
      subdomain: subdomain,
    );
  }
}
