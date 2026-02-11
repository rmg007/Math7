import 'package:flutter_test/flutter_test.dart';
import 'package:student_app/src/core/errors/app_error.dart';

void main() {
  group('AppError Tests', () {
    test('should create concrete error types with message', () {
      const networkError = NetworkError('Test error message');
      const syncError = SyncError('Test error message');
      const validationError = ValidationError('Test error message', {});

      expect(networkError.message, 'Test error message');
      expect(syncError.message, 'Test error message');
      expect(validationError.message, 'Test error message');

      expect(networkError.toString(), 'NetworkError: Test error message');
      expect(syncError.toString(), 'SyncError: Test error message');
      expect(validationError.toString(), 'ValidationError: Test error message');
    });

    test('should be an Exception', () {
      const networkError = NetworkError('Test error');
      const syncError = SyncError('Test error');
      const validationError = ValidationError('Test error', {});

      expect(networkError, isA<Exception>());
      expect(syncError, isA<Exception>());
      expect(validationError, isA<Exception>());
    });

    test('should handle empty message', () {
      const networkError = NetworkError('');
      const syncError = SyncError('');
      const validationError = ValidationError('', {});

      expect(networkError.message, '');
      expect(syncError.message, '');
      expect(validationError.message, '');

      expect(networkError.toString(), 'NetworkError: ');
      expect(syncError.toString(), 'SyncError: ');
      expect(validationError.toString(), 'ValidationError: ');
    });
  });

  group('NetworkError Tests', () {
    test('should create NetworkError with message', () {
      const error = NetworkError('Network connection failed');

      expect(error.message, 'Network connection failed');
      expect(error.toString(), 'NetworkError: Network connection failed');
      expect(error, isA<AppError>());
      expect(error, isA<Exception>());
    });

    test('should inherit from AppError', () {
      const error = NetworkError('Network error');

      expect(error, isA<AppError>());
      expect(error.message, 'Network error');
    });
  });

  group('SyncError Tests', () {
    test('should create SyncError with message only', () {
      const error = SyncError('Sync failed');

      expect(error.message, 'Sync failed');
      expect(error.toString(), 'SyncError: Sync failed');
      expect(error.retryAfterSeconds, isNull);
      expect(error, isA<AppError>());
      expect(error, isA<Exception>());
    });

    test('should create SyncError with message and retry after', () {
      const error = SyncError('Rate limited', retryAfterSeconds: 60);

      expect(error.message, 'Rate limited');
      expect(error.toString(), 'SyncError: Rate limited');
      expect(error.retryAfterSeconds, 60);
      expect(error, isA<AppError>());
      expect(error, isA<Exception>());
    });

    test('should handle zero retry after seconds', () {
      const error = SyncError('Immediate retry', retryAfterSeconds: 0);

      expect(error.retryAfterSeconds, 0);
    });

    test('should handle negative retry after seconds', () {
      const error = SyncError('Negative retry', retryAfterSeconds: -1);

      expect(error.retryAfterSeconds, -1);
    });
  });

  group('ValidationError Tests', () {
    test('should create ValidationError with message and field errors', () {
      final fieldErrors = {
        'email': 'Invalid email format',
        'password': 'Password too short',
      };

      final error = ValidationError('Validation failed', fieldErrors);

      expect(error.message, 'Validation failed');
      expect(error.toString(), 'ValidationError: Validation failed');
      expect(error.fieldErrors, fieldErrors);
      expect(error.fieldErrors['email'], 'Invalid email format');
      expect(error.fieldErrors['password'], 'Password too short');
      expect(error, isA<AppError>());
      expect(error, isA<Exception>());
    });

    test('should handle empty field errors map', () {
      const error = ValidationError('No field errors', {});

      expect(error.fieldErrors, isEmpty);
      expect(error.toString(), 'ValidationError: No field errors');
    });

    test('should handle null field errors', () {
      final error = ValidationError('Null field errors', <String, String>{});

      expect(error.fieldErrors, isA<Map<String, String>>());
      expect(error.fieldErrors, isEmpty);
    });

    test('should handle multiple field errors', () {
      final fieldErrors = {
        'field1': 'Error 1',
        'field2': 'Error 2',
        'field3': 'Error 3',
        'field4': 'Error 4',
      };

      final error = ValidationError('Multiple errors', fieldErrors);

      expect(error.fieldErrors.length, 4);
      expect(error.fieldErrors, containsPair('field1', 'Error 1'));
      expect(error.fieldErrors, containsPair('field2', 'Error 2'));
      expect(error.fieldErrors, containsPair('field3', 'Error 3'));
      expect(error.fieldErrors, containsPair('field4', 'Error 4'));
    });
  });

  group('Error Type Tests', () {
    test('should distinguish between error types', () {
      const appError = AppError('Generic error');
      const networkError = NetworkError('Network error');
      const syncError = SyncError('Sync error');
      const validationError = ValidationError('Validation error', {});

      expect(appError, isA<AppError>());
      expect(appError, isNot(isA<NetworkError>()));

      expect(networkError, isA<AppError>());
      expect(networkError, isA<NetworkError>());
      expect(networkError, isNot(isA<SyncError>()));

      expect(syncError, isA<AppError>());
      expect(syncError, isA<SyncError>());
      expect(syncError, isNot(isA<ValidationError>()));

      expect(validationError, isA<AppError>());
      expect(validationError, isA<ValidationError>());
      expect(validationError, isNot(isA<NetworkError>()));
    });

    test('should have correct runtime types', () {
      const networkError = NetworkError('Test');
      const syncError = SyncError('Test');
      const validationError = ValidationError('Test', {});

      expect(networkError.runtimeType.toString(), 'NetworkError');
      expect(syncError.runtimeType.toString(), 'SyncError');
      expect(validationError.runtimeType.toString(), 'ValidationError');
    });
  });

  group('Error Equality Tests', () {
    test('should have proper equality for concrete types', () {
      const NetworkError error1 = NetworkError('Test');
      const NetworkError error2 = NetworkError('Test');
      const NetworkError error3 = NetworkError('Different');
      const SyncError error4 = SyncError('Test');

      expect(error1, equals(error2));
      expect(error1, isNot(equals(error3)));
      expect(error1, isNot(equals(error4)));
    });

    test('should have proper equality for validation errors', () {
      const ValidationError error1 =
          ValidationError('Test', {'field': 'error'});
      const ValidationError error2 =
          ValidationError('Test', {'field': 'error'});
      const ValidationError error3 =
          ValidationError('Test', {'field': 'different'});
      const NetworkError error4 = NetworkError('Test');

      expect(error1, equals(error2));
      expect(error1, isNot(equals(error3)));
      expect(error1, isNot(equals(error4)));
    });

    test('should have different hash codes for different instances', () {
      const NetworkError error1 = NetworkError('Test');
      const NetworkError error2 = NetworkError('Test');

      expect(error1.hashCode, isNot(equals(error2.hashCode)));
    });
  });

  group('Error Pattern Matching Tests', () {
    test('should support pattern matching with switch', () {
      const NetworkError error = NetworkError('Connection failed');

      String errorMessage;
      switch (error) {
        case NetworkError():
          errorMessage = 'Network: ${error.message}';
          break;
        case SyncError():
          errorMessage = 'Sync: ${error.message}';
          break;
        case ValidationError():
          errorMessage = 'Validation: ${error.message}';
          break;
      }

      expect(errorMessage, 'Network: Connection failed');
    });

    test('should support pattern matching with if-case', () {
      const SyncError error = SyncError('Rate limited', retryAfterSeconds: 30);

      if (error case SyncError(retryAfterSeconds: final retryAfter)) {
        expect(retryAfter, 30);
      } else {
        fail('Should have matched SyncError pattern');
      }
    });

    test('should support pattern matching with validation errors', () {
      const ValidationError error = ValidationError('Form invalid', {
        'email': 'Invalid format',
        'password': 'Too short',
      });

      if (error case ValidationError(fieldErrors: final fields)) {
        expect(fields['email'], 'Invalid format');
        expect(fields['password'], 'Too short');
      } else {
        fail('Should have matched ValidationError pattern');
      }
    });
  });
}
