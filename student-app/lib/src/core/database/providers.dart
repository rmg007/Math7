import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'database.dart';

/// Provider for the Drift database instance
/// This is a singleton that will be created once and reused throughout the app
final databaseProvider = Provider<AppDatabase>((ref) {
  final database = AppDatabase();

  // Dispose the database when the provider is disposed
  ref.onDispose(() {
    database.close();
  });

  return database;
});
