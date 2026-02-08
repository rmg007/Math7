// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'skill.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Skill _$SkillFromJson(Map<String, dynamic> json) => _Skill(
  id: json['id'] as String,
  domainId: json['domain_id'] as String,
  slug: json['slug'] as String,
  title: json['title'] as String,
  description: json['description'] as String?,
  difficultyLevel: (json['difficulty_level'] as num?)?.toInt() ?? 1,
  sortOrder: (json['sort_order'] as num).toInt(),
  isPublished: json['is_published'] as bool? ?? false,
  createdAt: DateTime.parse(json['created_at'] as String),
  updatedAt: DateTime.parse(json['updated_at'] as String),
  deletedAt: json['deleted_at'] == null
      ? null
      : DateTime.parse(json['deleted_at'] as String),
);

Map<String, dynamic> _$SkillToJson(_Skill instance) => <String, dynamic>{
  'id': instance.id,
  'domain_id': instance.domainId,
  'slug': instance.slug,
  'title': instance.title,
  'description': instance.description,
  'difficulty_level': instance.difficultyLevel,
  'sort_order': instance.sortOrder,
  'is_published': instance.isPublished,
  'created_at': instance.createdAt.toIso8601String(),
  'updated_at': instance.updatedAt.toIso8601String(),
  'deleted_at': instance.deletedAt?.toIso8601String(),
};
