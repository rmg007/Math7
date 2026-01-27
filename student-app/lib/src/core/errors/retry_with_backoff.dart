import 'dart:math' as math;

Future<T> retryWithBackoff<T>(
  Future<T> Function() operation, {
  int maxRetries = 3,
  Duration initialDelay = const Duration(seconds: 1),
  Duration maxDelay = const Duration(seconds: 30),
}) async {
  var attempt = 0;
  var delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (e) {
      if (attempt >= maxRetries) rethrow;
      await Future.delayed(delay);

      attempt += 1;
      final nextSeconds = math.min(delay.inSeconds * 2, maxDelay.inSeconds);
      delay = Duration(seconds: nextSeconds);
    }
  }
}
