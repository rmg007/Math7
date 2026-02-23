import 'package:freezed_annotation/freezed_annotation.dart';

part 'question.freezed.dart';
part 'question.g.dart';

enum QuestionType {
  @JsonValue('multiple_choice')
  multipleChoice,
  @JsonValue('mcq_multi')
  mcqMulti,
  @JsonValue('text_input')
  textInput,
  @JsonValue('boolean')
  boolean,
  @JsonValue('reorder_steps')
  reorderSteps,
}

@freezed
abstract class Question with _$Question {
  const factory Question({
    required String id,
    required String skillId,
    required QuestionType type,
    required String content,
    // Using dynamic for flexible JSON structures
    required Map<String, dynamic> options,
    required Map<String, dynamic> solution,
    String? explanation,
    @Default(1) int points,
    @Default(false) bool isPublished,
    required DateTime createdAt,
    required DateTime updatedAt,
    DateTime? deletedAt,
  }) = _Question;

  factory Question.fromJson(Map<String, dynamic> json) =>
      _$QuestionFromJson(json);
}
