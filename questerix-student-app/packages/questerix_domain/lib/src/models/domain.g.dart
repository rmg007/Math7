// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'domain.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Domain _$DomainFromJson(Map<String, dynamic> json) => _Domain(
  id: json['id'] as String,
  slug: json['slug'] as String,
  title: json['title'] as String,
  description: json['description'] as String?,
  sortOrder: (json['sort_order'] as num).toInt(),
  isPublished: json['is_published'] as bool? ?? false,
  createdAt: DateTime.parse(json['created_at'] as String),
  updatedAt: DateTime.parse(json['updated_at'] as String),
  deletedAt: json['deleted_at'] == null
      ? null
      : DateTime.parse(json['deleted_at'] as String),
);

Map<String, dynamic> _$DomainToJson(_Domain instance) => <String, dynamic>{
  'id': instance.id,
  'slug': instance.slug,
  'title': instance.title,
  'description': instance.description,
  'sort_order': instance.sortOrder,
  'is_published': instance.isPublished,
  'created_at': instance.createdAt.toIso8601String(),
  'updated_at': instance.updatedAt.toIso8601String(),
  'deleted_at': instance.deletedAt?.toIso8601String(),
};
