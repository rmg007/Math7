import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/app.dart';

const String _sentryDsn = String.fromEnvironment('SENTRY_DSN', defaultValue: '');
const bool _sentryEnabled = bool.fromEnvironment('SENTRY_ENABLED', defaultValue: false);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // If Sentry is not enabled (or no DSN), run normally.
  if (!_sentryEnabled || _sentryDsn.isEmpty) {
    await _initializeDependencies();
    runApp(
      const ProviderScope(
        child: Math7App(),
      ),
    );
    return;
  }

  await SentryFlutter.init(
    (options) {
      options.dsn = _sentryDsn;
      options.environment = const String.fromEnvironment(
        'ENV',
        defaultValue: 'development',
      );
      options.tracesSampleRate = 1.0;
    },
    appRunner: () async {
      await _initializeDependencies();
      runApp(
        const ProviderScope(
          child: Math7App(),
        ),
      );
    },
  );
}

Future<void> _initializeDependencies() async {
  await Supabase.initialize(
    url: const String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: 'https://qvslbiceoonrgjxzkotb.supabase.co',
    ),
    anonKey: const String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c2xiaWNlb29ucmdqeHprb3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MTE5NjksImV4cCI6MjA4NTA4Nzk2OX0.tksExuWD4OZyb4MoYRliQ71WQ8rywcaYMxbH2UXWe8s',
    ),
  );
}
