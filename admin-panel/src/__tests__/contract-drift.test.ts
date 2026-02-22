import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Contract Drift Guard
 *
 * This test ensures that the question fixtures (the 'contract') between the
 * Admin Panel and Student App remain aligned. Even though they are in different
 * languages (TS vs Dart), the values must match for consistent behavior.
 */
describe('Contract Drift Guard', () => {
  const getFixturesPaths = () => {
    const dartPath = path.resolve(
      __dirname,
      '../../../student-app/test/fixtures/question_fixtures.dart'
    );
    const tsPath = path.resolve(__dirname, '../../tests/fixtures/questions.ts');
    return { dartPath, tsPath };
  };

  it('QuestionType enums should match between Dart and TypeScript', () => {
    const { dartPath, tsPath } = getFixturesPaths();

    const dartContent = fs.readFileSync(dartPath, 'utf-8');
    const tsContent = fs.readFileSync(tsPath, 'utf-8');

    // Extract QuestionType from Dart
    const dartMatch = dartContent.match(/enum QuestionType \{([\s\S]+?)\}/);
    if (!dartMatch) throw new Error('Could not find QuestionType enum in Dart fixture');

    const dartTypes = dartMatch[1]
      .split('\n')
      .map((line) => line.split('//')[0].trim()) // Remove comments
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/,/g, '').split(';')[0].trim()) // Stop at semicolon
      .filter((s) => s.length > 0 && !s.includes('(') && !s.includes('=>')); // Exclude methods

    // Extract QuestionType from TS
    const tsMatch = tsContent.match(/export type QuestionType = (.+?);/);
    if (!tsMatch) throw new Error('Could not find QuestionType type in TS fixture');

    const tsTypes = tsMatch[1].split('|').map((s) => s.trim().replace(/'/g, '').replace(/"/g, ''));

    // Normalize both to snake_case
    const toSnakeCase = (str: string) =>
      str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');

    const normalizedDartTypes = dartTypes.map(toSnakeCase);
    const normalizedTsTypes = tsTypes;

    expect(normalizedDartTypes, 'Dart types (normalized) should match TS types').toEqual(
      expect.arrayContaining(normalizedTsTypes)
    );
    expect(normalizedTsTypes, 'TS types should match Dart types (normalized)').toEqual(
      expect.arrayContaining(normalizedDartTypes)
    );
  });

  it('DifficultyLevel enums should match between Dart and TypeScript', () => {
    const { dartPath, tsPath } = getFixturesPaths();

    const dartContent = fs.readFileSync(dartPath, 'utf-8');
    const tsContent = fs.readFileSync(tsPath, 'utf-8');

    // Extract DifficultyLevel from Dart
    const dartMatch = dartContent.match(/enum DifficultyLevel \{([\s\S]+?)\}/);
    if (!dartMatch) throw new Error('Could not find DifficultyLevel enum in Dart fixture');

    const dartLevels = dartMatch[1]
      .split('\n')
      .map((line) => line.split('//')[0].trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/,/g, '').split(';')[0].trim())
      .filter((s) => s.length > 0 && !s.includes('(') && !s.includes('=>'));

    // Extract DifficultyLevel from TS
    const tsMatch = tsContent.match(/export type DifficultyLevel = (.+?);/);
    if (!tsMatch) throw new Error('Could not find DifficultyLevel type in TS fixture');

    const tsLevels = tsMatch[1].split('|').map((s) => s.trim().replace(/'/g, '').replace(/"/g, ''));

    expect(dartLevels).toEqual(expect.arrayContaining(tsLevels));
    expect(tsLevels).toEqual(expect.arrayContaining(dartLevels));
  });

  it('QuestionFixture fields should match', () => {
    const { dartPath, tsPath } = getFixturesPaths();

    const dartContent = fs.readFileSync(dartPath, 'utf-8');
    const tsContent = fs.readFileSync(tsPath, 'utf-8');

    // Extract fields from Dart: final <Type> <name>;
    const dartFieldsBlock =
      dartContent.match(/class QuestionFixture \{([\s\S]+?)\s*const QuestionFixture/)?.[1] || '';
    const dartFields = [...dartFieldsBlock.matchAll(/final\s+[\w<>, ?]+\s+(\w+);/g)].map(
      (m) => m[1]
    );

    // Extract fields from TS: <name>?: <Type>;
    const tsFieldsBlock =
      tsContent.match(/export interface QuestionFixture \{([\s\S]+?)\}/)?.[1] || '';
    const tsFields = [...tsFieldsBlock.matchAll(/(\w+)(?:\?)?:\s+.+?;/g)].map((m) => m[1]);

    // Normalize
    const toSnakeCase = (str: string) =>
      str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

    const normalizedDartFields = dartFields.map(toSnakeCase);
    const normalizedTsFields = tsFields.map(toSnakeCase);

    expect(normalizedDartFields).toEqual(expect.arrayContaining(normalizedTsFields));
    expect(normalizedTsFields).toEqual(expect.arrayContaining(normalizedDartFields));
  });
});
