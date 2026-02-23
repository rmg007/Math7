import 'package:freezed_annotation/freezed_annotation.dart';

part 'skill.freezed.dart';
part 'skill.g.dart';

@freezed
abstract class Skill with _$Skill {
  const factory Skill({
    required String id,
    required String domainId,
    required String slug,
    required String title,
    String? description,
    @Default(1) int difficultyLevel,
    required int sortOrder,
    @Default(false) bool isPublished,
    required DateTime createdAt,
    required DateTime updatedAt,
    DateTime? deletedAt,
  }) = _Skill;

  factory Skill.fromJson(Map<String, dynamic> json) => _$SkillFromJson(json);
}
