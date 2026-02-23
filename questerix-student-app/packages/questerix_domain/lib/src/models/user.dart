import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

enum UserAgeGroup { under13, over13, unknown }

@freezed
abstract class User with _$User {
  const factory User({
    required String id,
    required String email,
    @Default(false) bool isParentManaged,
    @Default(UserAgeGroup.unknown) UserAgeGroup ageGroup,
    DateTime? acceptedTermsDate,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
