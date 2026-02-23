import 'package:test/test.dart';
import 'package:questerix_domain/questerix_domain.dart';

void main() {
  group('User', () {
    test('supports value comparisons', () {
      final date = DateTime.now();
      final user1 = User(
        id: '1',
        email: 'test@questerix.com',
        createdAt: date,
        updatedAt: date,
        ageGroup: UserAgeGroup.under13,
      );
      final user2 = User(
        id: '1',
        email: 'test@questerix.com',
        createdAt: date,
        updatedAt: date,
        ageGroup: UserAgeGroup.under13,
      );

      expect(user1, equals(user2));
    });

    test('fromJson/toJson works', () {
      final date = DateTime.utc(2023, 1, 1);
      final user = User(
        id: '123',
        email: 'test@test.com',
        createdAt: date,
        updatedAt: date,
        ageGroup: UserAgeGroup.over13,
      );

      final json = user.toJson();
      expect(json['id'], '123');
      expect(json['age_group'], 'over13'); // snake_case

      final parsed = User.fromJson(json);
      expect(parsed, equals(user));
    });
  });
}
