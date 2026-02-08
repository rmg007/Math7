import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Connectivity state
enum ConnectivityStatus {
  online,
  offline,
  unknown,
}

/// Connectivity service provider
final connectivityServiceProvider = StreamProvider<ConnectivityStatus>((ref) {
  return ConnectivityService().statusStream;
});

/// Connectivity service - hybrid detection
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  final _statusController = StreamController<ConnectivityStatus>.broadcast();

  Stream<ConnectivityStatus> get statusStream => _statusController.stream;

  ConnectivityService() {
    _init();
  }

  Future<void> _init() async {
    // Initial check
    final result = await _connectivity.checkConnectivity();
    _updateStatus(result);

    // Listen to changes
    _connectivity.onConnectivityChanged.listen(_updateStatus);
  }

  void _updateStatus(List<ConnectivityResult> results) {
    // Treat no connectivity as offline
    if (results.isEmpty || results.every((r) => r == ConnectivityResult.none)) {
      _statusController.add(ConnectivityStatus.offline);
      return;
    }

    // Has some form of connectivity
    _statusController.add(ConnectivityStatus.online);
  }

  void dispose() {
    _statusController.close();
  }
}
