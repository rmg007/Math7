sealed class AppError implements Exception {
  final String message;
  const AppError(this.message);

  @override
  String toString() => '$runtimeType: $message';
}

final class NetworkError extends AppError {
  const NetworkError(super.message);
}

final class SyncError extends AppError {
  final int? retryAfterSeconds;
  const SyncError(super.message, {this.retryAfterSeconds});
}

final class ValidationError extends AppError {
  final Map<String, String> fieldErrors;
  const ValidationError(super.message, this.fieldErrors);
}
