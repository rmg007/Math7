import 'error_tracker.dart';
import 'app_error.dart';

/// Wraps an async operation with error handling.
/// Captures exceptions to Supabase (zero-cost alternative to Sentry).
Future<T> handleAppError<T>(
  Future<T> Function() operation, {
  T Function(AppError error)? onError,
}) async {
  try {
    return await operation();
  } on AppError catch (e, st) {
    await errorTracker.captureException(e, stackTrace: st);
    if (onError != null) {
      return onError(e);
    }
    rethrow;
  } catch (e, st) {
    await errorTracker.captureException(e, stackTrace: st);
    rethrow;
  }
}
