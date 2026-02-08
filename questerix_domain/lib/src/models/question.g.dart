// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'question.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Question _$QuestionFromJson(Map<String, dynamic> json) => _Question(
  id: json['id'] as String,
  skillId: json['skill_id'] as String,
  type: $enumDecode(_$QuestionTypeEnumMap, json['type']),
  content: json['content'] as String,
  options: json['options'] as Map<String, dynamic>,
  solution: json['solution'] as Map<String, dynamic>,
  explanation: json['explanation'] as String?,
  points: (json['points'] as num?)?.toInt() ?? 1,
  isPublished: json['is_published'] as bool? ?? false,
  createdAt: DateTime.parse(json['created_at'] as String),
  updatedAt: DateTime.parse(json['updated_at'] as String),
  deletedAt: json['deleted_at'] == null
      ? null
      : DateTime.parse(json['deleted_at'] as String),
);

Map<String, dynamic> _$QuestionToJson(_Question instance) => <String, dynamic>{
  'id': instance.id,
  'skill_id': instance.skillId,
  'type': _$QuestionTypeEnumMap[instance.type]!,
  'content': instance.content,
  'options': instance.options,
  'solution': instance.solution,
  'explanation': instance.explanation,
  'points': instance.points,
  'is_published': instance.isPublished,
  'created_at': instance.createdAt.toIso8601String(),
  'updated_at': instance.updatedAt.toIso8601String(),
  'deleted_at': instance.deletedAt?.toIso8601String(),
};

const _$QuestionTypeEnumMap = {
  QuestionType.multipleChoice: 'multiple_choice',
  QuestionType.mcqMulti: 'mcq_multi',
  QuestionType.textInput: 'text_input',
  QuestionType.boolean: 'boolean',
  QuestionType.reorderSteps: 'reorder_steps',
};
