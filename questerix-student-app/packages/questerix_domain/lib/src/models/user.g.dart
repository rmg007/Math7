// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_User _$UserFromJson(Map<String, dynamic> json) => _User(
  id: json['id'] as String,
  email: json['email'] as String,
  isParentManaged: json['is_parent_managed'] as bool? ?? false,
  ageGroup:
      $enumDecodeNullable(_$UserAgeGroupEnumMap, json['age_group']) ??
      UserAgeGroup.unknown,
  acceptedTermsDate: json['accepted_terms_date'] == null
      ? null
      : DateTime.parse(json['accepted_terms_date'] as String),
  createdAt: DateTime.parse(json['created_at'] as String),
  updatedAt: DateTime.parse(json['updated_at'] as String),
);

Map<String, dynamic> _$UserToJson(_User instance) => <String, dynamic>{
  'id': instance.id,
  'email': instance.email,
  'is_parent_managed': instance.isParentManaged,
  'age_group': _$UserAgeGroupEnumMap[instance.ageGroup]!,
  'accepted_terms_date': instance.acceptedTermsDate?.toIso8601String(),
  'created_at': instance.createdAt.toIso8601String(),
  'updated_at': instance.updatedAt.toIso8601String(),
};

const _$UserAgeGroupEnumMap = {
  UserAgeGroup.under13: 'under13',
  UserAgeGroup.over13: 'over13',
  UserAgeGroup.unknown: 'unknown',
};
