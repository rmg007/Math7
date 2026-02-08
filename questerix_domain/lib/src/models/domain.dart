import 'package:freezed_annotation/freezed_annotation.dart';

part 'domain.freezed.dart';
part 'domain.g.dart';

@freezed
abstract class Domain with _$Domain {
  const factory Domain({
    required String id,
    required String slug,
    required String title,
    String? description,
    required int sortOrder,
    @Default(false) bool isPublished,
    required DateTime createdAt,
    required DateTime updatedAt,
    DateTime? deletedAt,
  }) = _Domain;

  factory Domain.fromJson(Map<String, dynamic> json) => _$DomainFromJson(json);
}
