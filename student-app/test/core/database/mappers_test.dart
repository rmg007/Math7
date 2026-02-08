import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/database/database.dart' as db;
import 'package:student_app/src/core/database/mappers.dart';

void main() {
  group('DriftMappers', () {
    final now = DateTime.now();

    group('Domain', () {
      final domainRow = db.Domain(
        id: 'domain-1',
        title: 'Numbers',
        slug: 'numbers',
        description: 'Basic arithmetic',
        sortOrder: 1,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      );

      final domainEntity = model.Domain(
        id: 'domain-1',
        title: 'Numbers',
        slug: 'numbers',
        description: 'Basic arithmetic',
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      );

      test('toDomain maps correctly', () {
        final result = DriftMappers.toDomain(domainRow);
        expect(result.id, domainEntity.id);
        expect(result.title, domainEntity.title);
        expect(result.slug, domainEntity.slug);
        expect(result.sortOrder, domainEntity.sortOrder);
      });

      test('toDomainRow maps correctly', () {
        final result = DriftMappers.toDomainRow(domainEntity);
        expect(result.id, domainRow.id);
        expect(result.title, domainRow.title);
        expect(result.sortOrder, domainRow.sortOrder);
      });
    });

    group('Skill', () {
      final skillRow = db.Skill(
        id: 'skill-1',
        domainId: 'domain-1',
        title: 'Addition',
        slug: 'addition',
        description: 'Adding numbers',
        difficultyLevel: 1,
        sortOrder: 1,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      );

      final skillEntity = model.Skill(
        id: 'skill-1',
        domainId: 'domain-1',
        title: 'Addition',
        slug: 'addition',
        description: 'Adding numbers',
        difficultyLevel: 1,
        sortOrder: 1,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      );

      test('toSkill maps correctly', () {
        final result = DriftMappers.toSkill(skillRow);
        expect(result.id, skillEntity.id);
        expect(result.title, skillEntity.title);
        expect(result.sortOrder, skillEntity.sortOrder);
      });

      test('toSkillRow maps correctly', () {
        final result = DriftMappers.toSkillRow(skillEntity);
        expect(result.id, skillRow.id);
        expect(result.title, skillRow.title);
        expect(result.sortOrder, skillRow.sortOrder);
      });
    });

    group('Question', () {
      final questionRow = db.Question(
        id: 'q-1',
        skillId: 'skill-1',
        type: 'multipleChoice',
        content: '1 + 1 = ?',
        options: jsonEncode({'a': '1', 'b': '2'}),
        solution: jsonEncode({'answer': 'b'}),
        explanation: '1 plus 1 is 2',
        points: 10,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      );

      final questionEntity = model.Question(
        id: 'q-1',
        skillId: 'skill-1',
        type: model.QuestionType.multipleChoice,
        content: '1 + 1 = ?',
        options: {'a': '1', 'b': '2'},
        solution: {'answer': 'b'},
        explanation: '1 plus 1 is 2',
        points: 10,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      );

      test('toQuestion maps correctly', () {
        final result = DriftMappers.toQuestion(questionRow);
        expect(result.id, questionEntity.id);
        expect(result.type, questionEntity.type);
        expect(result.options, questionEntity.options);
      });

      test('toQuestionRow maps correctly', () {
        final result = DriftMappers.toQuestionRow(questionEntity);
        expect(result.id, questionRow.id);
        expect(result.type, questionRow.type);
        expect(jsonDecode(result.options), jsonDecode(questionRow.options));
      });
    });

    group('Attempt', () {
      final attemptRow = db.Attempt(
        id: 'att-1',
        userId: 'user-1',
        questionId: 'q-1',
        response: jsonEncode({'answer': 'b'}),
        isCorrect: true,
        scoreAwarded: 10,
        timeSpentMs: 1000,
        createdAt: now,
        updatedAt: now,
      );

      final attemptEntity = model.Attempt(
        id: 'att-1',
        userId: 'user-1',
        questionId: 'q-1',
        response: {'answer': 'b'},
        isCorrect: true,
        scoreAwarded: 10,
        timeSpentMs: 1000,
        createdAt: now,
        updatedAt: now,
      );

      test('toAttempt maps correctly', () {
        final result = DriftMappers.toAttempt(attemptRow);
        expect(result.id, attemptEntity.id);
        expect(result.isCorrect, attemptEntity.isCorrect);
        expect(result.response, attemptEntity.response);
      });

      test('toAttemptRow maps correctly', () {
        final result = DriftMappers.toAttemptRow(attemptEntity);
        expect(result.id, attemptRow.id);
        expect(result.isCorrect, attemptRow.isCorrect);
        expect(jsonDecode(result.response), jsonDecode(attemptRow.response));
      });
    });
  });
}
