import 'package:freezed_annotation/freezed_annotation.dart';

part 'attempt.freezed.dart';
part 'attempt.g.dart';

@freezed
abstract class Attempt with _$Attempt {
  const factory Attempt({
    required String id,
    required String userId,
    required String questionId,
    // Response is JSON, could be a selected option ID or text or list
    required dynamic response,
    @Default(false) bool isCorrect,
    @Default(0) int scoreAwarded,
    int? timeSpentMs,
    required DateTime createdAt,
    required DateTime updatedAt,
    DateTime? deletedAt,
  }) = _Attempt;

  factory Attempt.fromJson(Map<String, dynamic> json) =>
      _$AttemptFromJson(json);
}
