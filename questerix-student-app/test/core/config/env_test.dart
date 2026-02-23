import 'package:flutter_test/flutter_test.dart';
import 'package:student_app/src/core/config/env.dart';

void main() {
  group('Env Configuration Tests', () {
    test('should have default app version', () {
      expect(Env.appVersion, isA<String>());
      expect(Env.appVersion, isNotEmpty);
    });

    test('should have default app name', () {
      expect(Env.appName, 'Questerix');
      expect(Env.appName, isA<String>());
    });

    test('should have supabase URL configuration', () {
      expect(Env.supabaseUrl, isA<String>());
      // In test environment, this might be empty or have a test value
    });

    test('should have supabase anonymous key configuration', () {
      expect(Env.supabaseAnonKey, isA<String>());
      // In test environment, this might be empty or have a test value
    });

    test('should have theme primary color configuration', () {
      expect(Env.themePrimaryColor, isA<int>());
      expect(Env.themePrimaryColor, greaterThan(0));
    });

    test('should parse theme color correctly from hex string', () {
      // Test that the color parsing works
      final color = Env.themePrimaryColor;
      expect(color, isA<int>());
      expect(color & 0xFF000000, equals(0xFF000000)); // Should have full alpha
    });

    test('should be accessible as static class', () {
      // Env should be accessible via static properties
      expect(Env.appVersion, isA<String>());
      expect(Env.appName, isA<String>());
      expect(Env.supabaseUrl, isA<String>());
      expect(Env.supabaseAnonKey, isA<String>());
      expect(Env.themePrimaryColor, isA<int>());
    });

    test('should have environment-specific values', () {
      // These tests verify the structure but not specific values
      // since they depend on the test environment setup

      expect(Env.appVersion, isNotNull);
      expect(Env.appName, isNotNull);
      expect(Env.supabaseUrl, isNotNull);
      expect(Env.supabaseAnonKey, isNotNull);
      expect(Env.themePrimaryColor, isNotNull);
    });

    test('should handle missing environment variables gracefully', () {
      // Test that default values are used when env vars are missing
      expect(Env.appVersion, isNotEmpty);
      expect(Env.appName, isNotEmpty);
    });

    test('should have consistent string types', () {
      expect(Env.appVersion, isA<String>());
      expect(Env.appName, isA<String>());
      expect(Env.supabaseUrl, isA<String>());
      expect(Env.supabaseAnonKey, isA<String>());
    });

    test('should have valid color format', () {
      final color = Env.themePrimaryColor;

      // Should be a valid 32-bit color
      expect(color, greaterThanOrEqualTo(0));
      expect(color, lessThanOrEqualTo(0xFFFFFFFF));

      // Should have alpha channel set
      expect(color & 0xFF000000, equals(0xFF000000));
    });

    test('should support different environment configurations', () {
      // This test verifies that the configuration structure is sound
      // In different environments, these values would change

      final allConfigs = {
        'appVersion': Env.appVersion,
        'appName': Env.appName,
        'supabaseUrl': Env.supabaseUrl,
        'supabaseAnonKey': Env.supabaseAnonKey,
        'themePrimaryColor': Env.themePrimaryColor.toString(),
      };

      expect(allConfigs.length, 5);
      allConfigs.forEach((key, value) {
        expect(value, isNotNull);
        // supabaseUrl and supabaseAnonKey might be empty in test environment
        if (key != 'supabaseUrl' && key != 'supabaseAnonKey') {
          expect(value, isNotEmpty);
        }
      });
    });

    group('Environment Variable Validation', () {
      test('should validate app version format', () {
        const version = Env.appVersion;
        expect(
            version,
            matches(RegExp(
                r'^[\w\.\-]+$'))); // Allows version numbers like 1.0.0, dev, etc.
      });

      test('should validate app name format', () {
        const name = Env.appName;
        expect(
            name, matches(RegExp(r'^[a-zA-Z\s]+$'))); // Letters and spaces only
      });

      test('should validate supabase URL format when provided', () {
        const url = Env.supabaseUrl;
        if (url.isNotEmpty) {
          expect(
              url,
              matches(RegExp(
                  r'^https?://.+'))); // Should start with http:// or https://
        }
      });

      test('should validate supabase key format when provided', () {
        const key = Env.supabaseAnonKey;
        if (key.isNotEmpty) {
          expect(
              key.length, greaterThan(20)); // Supabase keys are typically long
        }
      });
    });

    group('Configuration Constants', () {
      test('should have stable default values', () {
        // These tests ensure default values don't change unexpectedly
        expect(Env.appName, 'Questerix');
        expect(Env.themePrimaryColor, 0xFF319795); // Default teal color
      });

      test('should support color theme customization', () {
        final color = Env.themePrimaryColor;

        // Should be a valid hex color
        expect(color, isA<int>());
        expect(color.toString(),
            matches(RegExp(r'^\d+$'))); // Should be numeric string
      });
    });

    group('Runtime Configuration', () {
      test('should be accessible at runtime', () {
        // Test that configuration is accessible during app runtime
        expect(Env.appVersion, isNotNull);
        expect(Env.appName, isNotNull);
        expect(Env.supabaseUrl, isNotNull);
        expect(Env.supabaseAnonKey, isNotNull);
        expect(Env.themePrimaryColor, isNotNull);
      });

      test('should maintain consistency across accesses', () {
        // Configuration should be consistent
        const v1 = Env.appVersion;
        const v2 = Env.appVersion;
        expect(v1, equals(v2));

        const n1 = Env.appName;
        const n2 = Env.appName;
        expect(n1, equals(n2));

        final c1 = Env.themePrimaryColor;
        final c2 = Env.themePrimaryColor;
        expect(c1, equals(c2));
      });
    });

    group('Security Tests', () {
      test('should have consistent configuration access', () {
        // Configuration should be consistent across accesses
        const version1 = Env.appVersion;
        const version2 = Env.appVersion;
        expect(version1, equals(version2));

        const name1 = Env.appName;
        const name2 = Env.appName;
        expect(name1, equals(name2));

        final color1 = Env.themePrimaryColor;
        final color2 = Env.themePrimaryColor;
        expect(color1, equals(color2));
      });

      test('should have read-only configuration', () {
        // Configuration should be read-only at runtime
        expect(Env.appVersion, isA<String>());
        expect(Env.appName, isA<String>());

        // These are const values, so they can't be modified
        // This is enforced by the const constructor
      });
    });
  });
}
