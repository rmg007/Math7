import { describe, it, expect } from 'vitest';
import { CANONICAL_QUESTION_TYPES } from './question-types';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Question Type Schema Contract', () => {
  it('should match the Supabase database enum definition', () => {
    // Path to the master schema (single source of truth for DB)
    const schemaPath = join(__dirname, '../../../../supabase/schema_master.sql');
    
    try {
      const schemaSql = readFileSync(schemaPath, 'utf8');
      
      // Look for: CREATE TYPE question_type AS ENUM ('multiple_choice', ...);
      const enumMatch = schemaSql.match(/CREATE TYPE (public\.)?question_type AS ENUM\s*\(([^)]+)\)/i);
      
      if (!enumMatch) {
        throw new Error('Could not find question_type ENUM definition in schema_master.sql');
      }
      
      const dbEnumValues = enumMatch[2]
        .split(',')
        .map(v => v.trim().replace(/'/g, ''));
      
      // Assert that our canonical list includes at least all values from the DB
      // (It's okay if canonical list has more if we are preparing for a migration,
      // but usually they should match exactly for strict parity)
      expect(CANONICAL_QUESTION_TYPES).toEqual(expect.arrayContaining(dbEnumValues));
      expect(dbEnumValues).toEqual(expect.arrayContaining(CANONICAL_QUESTION_TYPES as unknown as string[]));
      
    } catch (err) {
      if ((err as any).code === 'ENOENT') {
        console.warn('Skipping DB parity test: schema_master.sql not found at ' + schemaPath);
        return;
      }
      throw err;
    }
  });

  it('should only contain lowercase snake_case values', () => {
    CANONICAL_QUESTION_TYPES.forEach(type => {
      expect(type).toMatch(/^[a-z][a-z0-9_]*$/);
    });
  });

  it('should have exactly the expected core types', () => {
    const coreTypes = [
      'multiple_choice',
      'mcq_multi',
      'text_input',
      'boolean',
      'reorder_steps',
      'matching',
    ];
    expect(CANONICAL_QUESTION_TYPES).toHaveLength(coreTypes.length);
    coreTypes.forEach(t => expect(CANONICAL_QUESTION_TYPES).toContain(t));
  });
});
