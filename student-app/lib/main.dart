import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/app.dart';
import 'src/core/config/env.dart';
import 'src/core/config/app_config_service.dart';
import 'src/core/errors/error_tracker.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Validate environment configuration early (fail-fast)
  Env.validate();

  await _initializeSupabase();

  // Initialize error tracker (Supabase-native, zero cost)
  errorTracker.init(
    appVersion: '1.0.0',
    appId: null, // Will be set after app config loads
  );

  final container = ProviderContainer();

  // Initialize App Context (Multi-tenancy)
  try {
    await container.read(appConfigServiceProvider).load();
  } catch (e, stack) {
    debugPrint('Failed to load app config: $e');
    await errorTracker.captureException(e, stackTrace: stack);
  }

  // Set up Flutter error handling
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    errorTracker.captureException(
      details.exception,
      stackTrace: details.stack,
      extra: {
        'library': details.library,
        'context': details.context?.toString()
      },
    );
  };

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const QuesterixApp(),
    ),
  );
}

Future<void> _initializeSupabase() async {
  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );
}
