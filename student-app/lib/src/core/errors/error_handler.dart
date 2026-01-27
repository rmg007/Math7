import 'package:sentry_flutter/sentry_flutter.dart';

import 'app_error.dart';

Future<T> handleAppError<T>(
  Future<T> Function() operation, {
  T Function(AppError error)? onError,
}) async {
  try {
    return await operation();
  } on AppError catch (e, st) {
    await Sentry.captureException(e, stackTrace: st);
    if (onError != null) {
      return onError(e);
    }
    rethrow;
  } catch (e, st) {
    await Sentry.captureException(e, stackTrace: st);
    rethrow;
  }
}
