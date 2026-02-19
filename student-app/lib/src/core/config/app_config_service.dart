import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core_providers.dart';
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
    StateNotifierProvider<AppConfigService, AsyncValue<AppContext>>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return AppConfigService(supabase);
});

// For backward compatibility if needed, or just use appConfigProvider.notifier
final appConfigServiceProvider = Provider<AppConfigService>((ref) {
  return ref.watch(appConfigProvider.notifier);
});

class AppConfigService extends StateNotifier<AsyncValue<AppContext>> {
  final SupabaseClient _supabase;

  AppConfigService(this._supabase) : super(const AsyncLoading());

  Future<void> load({String? manualSubdomain}) async {
    state = const AsyncLoading();

    try {
      // 1. Detect Subdomain (Web)
      String? subdomain = manualSubdomain;

      if (subdomain == null && kIsWeb) {
        final uri = Uri.base;
        final host = uri.host;

        if (host != 'localhost' && host != '127.0.0.1') {
          final parts = host.split('.');
          if (parts.isNotEmpty) {
            subdomain = parts[0];
          }
        } else if (Env.devSubdomain.isNotEmpty) {
          subdomain = Env.devSubdomain;
        }
      }

      if (subdomain == null) {
        throw AppInitializationException(
          'No tenant context detected.',
          subdomain: 'null',
        );
      }

      // 2. Fetch Config from Database
      final response = await _supabase
          .from('apps')
          .select('app_id, display_name, subdomain')
          .ilike('subdomain', subdomain)
          .eq('is_active', true)
          .maybeSingle();

      if (response != null) {
        final context = AppContext(
          appId: response['app_id'] as String,
          appName: (response['display_name'] as String?) ?? Env.appName,
          primaryColor: Env.themePrimaryColor,
        );

        state = AsyncData(context);
      } else {
        throw AppInitializationException(
          'Tenant not found for subdomain: $subdomain',
          subdomain: subdomain,
        );
      }
    } catch (e, st) {
      debugPrint('Error loading app config: $e');
      state = AsyncError(e, st);
    }
  }
}
