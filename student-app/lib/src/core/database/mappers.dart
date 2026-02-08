// ignore_for_file: depend_on_referenced_packages

import 'dart:convert';

import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/database/database.dart' as db;

/// Maps Drift database rows to Shared Domain entities
class DriftMappers {
  // Domain Mappers
  static model.Domain toDomain(db.Domain row) {
    return model.Domain(
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      sortOrder: row.sortOrder,
      isPublished: row.isPublished,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    );
  }

  static db.Domain toDomainRow(model.Domain entity) {
    return db.Domain(
      id: entity.id,
      slug: entity.slug,
      title: entity.title,
      description: entity.description,
      sortOrder: entity.sortOrder,
      isPublished: entity.isPublished,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    );
  }

  // Skill Mappers
  static model.Skill toSkill(db.Skill row) {
    return model.Skill(
      id: row.id,
      domainId: row.domainId,
      slug: row.slug,
      title: row.title,
      description: row.description,
      difficultyLevel: row.difficultyLevel,
      sortOrder: row.sortOrder,
      isPublished: row.isPublished,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    );
  }

  static db.Skill toSkillRow(model.Skill entity) {
    return db.Skill(
      id: entity.id,
      domainId: entity.domainId,
      slug: entity.slug,
      title: entity.title,
      description: entity.description,
      difficultyLevel: entity.difficultyLevel,
      sortOrder: entity.sortOrder,
      isPublished: entity.isPublished,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    );
  }

  // Question Mappers
  static model.Question toQuestion(db.Question row) {
    // However, for simplicity and error handling, we should use dart:convert if not already handled.
    // Drift's 'json_annotation' might handle it? No, Drift tables usually store as String.
    // Let's assume we need to decode. But wait, does Drift automatically convert if we use a ValueConverter?
    // In tables.dart, it's just `text()`. So it's a String.

    // We need to import dart:convert.

    return model.Question(
      id: row.id,
      skillId: row.skillId,
      type: model.QuestionType.values.byName(row.type), // Validate enum?
      content: row.content,
      options: _decodeJson(row.options),
      solution: _decodeJson(row.solution),
      explanation: row.explanation,
      points: row.points,
      isPublished: row.isPublished,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    );
  }

  static db.Question toQuestionRow(model.Question entity) {
    return db.Question(
      id: entity.id,
      skillId: entity.skillId,
      type: entity.type.name,
      content: entity.content,
      options: _encodeJson(entity.options),
      solution: _encodeJson(entity.solution),
      explanation: entity.explanation,
      points: entity.points,
      isPublished: entity.isPublished,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    );
  }

  // Attempt Mappers
  static model.Attempt toAttempt(db.Attempt row) {
    return model.Attempt(
      id: row.id,
      userId: row.userId,
      questionId: row.questionId,
      response: _decodeJson(row.response),
      isCorrect: row.isCorrect,
      scoreAwarded: row.scoreAwarded,
      timeSpentMs: row.timeSpentMs,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    );
  }

  static db.Attempt toAttemptRow(model.Attempt entity) {
    return db.Attempt(
      id: entity.id,
      userId: entity.userId,
      questionId: entity.questionId,
      response: _encodeJson(entity.response),
      isCorrect: entity.isCorrect,
      scoreAwarded: entity.scoreAwarded,
      timeSpentMs: entity.timeSpentMs,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    );
  }

  // Helpers
  static Map<String, dynamic> _decodeJson(String jsonStr) {
    return jsonDecode(jsonStr) as Map<String, dynamic>;
  }

  static String _encodeJson(dynamic jsonMap) {
    return jsonEncode(jsonMap);
  }
}
