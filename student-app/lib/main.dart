import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/app.dart';
import 'src/core/config/app_config_service.dart';
import 'src/core/config/env.dart';
import 'src/core/database/database.dart';
import 'src/core/errors/error_tracker.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // F-15: Initialise SQLCipher native library loader on Android.
  // Must be called before any NativeDatabase is opened.
  await setupSqlCipher();

  try {
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
      // Don't crash entirely here, let QuesterixApp handle the null config state gracefully
    }

    // Set up Flutter error handling (moved inside try block for consistency)
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
  } catch (e, stack) {
    // Critical initialization failure (e.g. Env.validate() failed)
    // Prevent white screen of death with a fallback UI
    debugPrint('CRITICAL: App initialization failed: $e');
    debugPrintStack(
        stackTrace: stack, label: 'main.dart critical init failure');
    runApp(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: Colors.white,
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 24),
                  const Text(
                    'Application Error',
                    style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    e.toString().replaceAll('StateError: ', ''),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16, color: Colors.black54),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'Please contact support if this persists.',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> _initializeSupabase() async {
  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );
}
