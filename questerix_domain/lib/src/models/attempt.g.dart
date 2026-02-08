// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attempt.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Attempt _$AttemptFromJson(Map<String, dynamic> json) => _Attempt(
  id: json['id'] as String,
  userId: json['user_id'] as String,
  questionId: json['question_id'] as String,
  response: json['response'],
  isCorrect: json['is_correct'] as bool? ?? false,
  scoreAwarded: (json['score_awarded'] as num?)?.toInt() ?? 0,
  timeSpentMs: (json['time_spent_ms'] as num?)?.toInt(),
  createdAt: DateTime.parse(json['created_at'] as String),
  updatedAt: DateTime.parse(json['updated_at'] as String),
  deletedAt: json['deleted_at'] == null
      ? null
      : DateTime.parse(json['deleted_at'] as String),
);

Map<String, dynamic> _$AttemptToJson(_Attempt instance) => <String, dynamic>{
  'id': instance.id,
  'user_id': instance.userId,
  'question_id': instance.questionId,
  'response': instance.response,
  'is_correct': instance.isCorrect,
  'score_awarded': instance.scoreAwarded,
  'time_spent_ms': instance.timeSpentMs,
  'created_at': instance.createdAt.toIso8601String(),
  'updated_at': instance.updatedAt.toIso8601String(),
  'deleted_at': instance.deletedAt?.toIso8601String(),
};
