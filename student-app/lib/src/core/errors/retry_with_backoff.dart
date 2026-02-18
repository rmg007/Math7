import 'dart:math' as math;

/// Circuit breaker for preventing cascade failures
class CircuitBreaker {
  final int failureThreshold;
  final Duration resetTimeout;

  int _failureCount = 0;
  DateTime? _lastFailureTime;
  bool _isOpen = false;

  CircuitBreaker({
    this.failureThreshold = 5,
    this.resetTimeout = const Duration(minutes: 1),
  });

  bool get isOpen {
    if (_isOpen && _lastFailureTime != null) {
      if (DateTime.now().difference(_lastFailureTime!) > resetTimeout) {
        _isOpen = false;
        _failureCount = 0;
        _lastFailureTime = null;
      }
    }
    return _isOpen;
  }

  void recordSuccess() {
    _failureCount = 0;
    _isOpen = false;
    _lastFailureTime = null;
  }

  void recordFailure() {
    _failureCount++;
    _lastFailureTime = DateTime.now();
    if (_failureCount >= failureThreshold) {
      _isOpen = true;
    }
  }
}

Future<T> retryWithBackoff<T>(
  Future<T> Function() operation, {
  int maxRetries = 3,
  Duration initialDelay = const Duration(seconds: 1),
  Duration maxDelay = const Duration(seconds: 30),
  // Add jitter to prevent thundering herd
  bool addJitter = true,
  // Circuit breaker for preventing cascade failures
  CircuitBreaker? circuitBreaker,
}) async {
  var attempt = 0;
  var delay = initialDelay;

  while (true) {
    // Check circuit breaker before attempting operation
    if (circuitBreaker?.isOpen == true) {
      throw Exception('Circuit breaker is open - operation blocked');
    }

    try {
      final result = await operation();
      circuitBreaker?.recordSuccess();
      return result;
    } catch (e) {
      circuitBreaker?.recordFailure();

      if (attempt >= maxRetries) {
        rethrow;
      }

      // Add jitter to prevent thundering herd
      var actualDelay = delay;
      if (addJitter) {
        final jitter =
            (math.Random().nextDouble() * 0.3 + 0.85) * delay.inMilliseconds;
        actualDelay = Duration(milliseconds: jitter.round());
      }

      await Future.delayed(actualDelay);

      attempt += 1;
      final nextSeconds = math.min(delay.inSeconds * 2, maxDelay.inSeconds);
      delay = Duration(seconds: nextSeconds);
    }
  }
}
