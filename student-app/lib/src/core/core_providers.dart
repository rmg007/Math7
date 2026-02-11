import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'database/database.dart' hide Session;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

// --- DATABASE & SUPABASE PROVIDERS ---

/// Provider for the Drift database instance
final databaseProvider = Provider<AppDatabase>((ref) {
  final database = AppDatabase();
  ref.onDispose(() => database.close());
  return database;
});

/// Provider for Supabase client
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

// --- CONNECTIVITY MONITORING ---

enum ConnectivityStatus { online, offline, unknown }

final connectivityServiceProvider = StreamProvider<ConnectivityStatus>((ref) {
  final controller = StreamController<ConnectivityStatus>.broadcast();
  final connectivity = Connectivity();

  void updateStatus(List<ConnectivityResult> results) {
    if (results.isEmpty || results.every((r) => r == ConnectivityResult.none)) {
      controller.add(ConnectivityStatus.offline);
    } else {
      controller.add(ConnectivityStatus.online);
    }
  }

  // Initial check
  connectivity.checkConnectivity().then(updateStatus);

  // Listen to changes
  final subscription = connectivity.onConnectivityChanged.listen(updateStatus);

  ref.onDispose(() {
    subscription.cancel();
    controller.close();
  });

  return controller.stream;
});
