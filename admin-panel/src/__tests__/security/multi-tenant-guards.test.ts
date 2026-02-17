import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const SRC_DIR = path.resolve(__dirname, '../../');
// Tables that contain tenant-specific data and MUST be scoped by app_id
const TENANT_TABLES = ['domains', 'skills', 'questions', 'groups'];

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

describe('Multi-tenant Data Integrity Guards', () => {
  const allFiles: string[] = [];

  // Gather source files
  walkDir(SRC_DIR, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      if (
        !filePath.includes('__tests__') &&
        !filePath.includes('.test.ts') &&
        !filePath.includes('.spec.ts') &&
        !filePath.endsWith('.d.ts')
      ) {
        allFiles.push(filePath);
      }
    }
  });

  // Task 2.1: Prevent Orphaned Records
  it('every .insert() on tenant tables must include app_id', () => {
    const violations: string[] = [];

    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');

      TENANT_TABLES.forEach((table) => {
        // Regex matches: .from('table')...insert(
        // Captures simple usage. Lookahead limit approx 200 chars.
        const regex = new RegExp(`\\.from\\(['"]${table}['"]\\)[\\s\\S]{0,200}\\.insert\\(`, 'g');

        let match;
        while ((match = regex.exec(content)) !== null) {
          // Extract the snippet starting from match index + 500 chars context
          const snippet = content.substring(match.index, match.index + 500);

          // Check if 'app_id' is present in this snippet (either in payload or var name)
          // Bypass with comment // safe-global-insert
          if (!snippet.includes('app_id') && !snippet.includes('safe-global-insert')) {
            violations.push(
              `${path.relative(SRC_DIR, file)}: insert into '${table}' missing app_id`
            );
          }
        }
      });
    });

    expect(
      violations,
      `FAIL: Tenant table inserts must include 'app_id'. Found violations: \n${violations.join('\n')}`
    ).toEqual([]);
  });

  // Task 2.2: Prevent Cross-tenant Mutation
  it('every .update() on tenant tables must include app_id filter', () => {
    const violations: string[] = [];
    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');

      TENANT_TABLES.forEach((table) => {
        // Regex matches: .from('table')...update(
        const regex = new RegExp(`\\.from\\(['"]${table}['"]\\)[\\s\\S]{0,200}\\.update\\(`, 'g');

        let match;
        while ((match = regex.exec(content)) !== null) {
          const snippet = content.substring(match.index, match.index + 600); // larger window for .eq chain

          // We expect .eq('app_id', ...) or .match({ app_id: ... })
          // or just 'app_id' anywhere in the query chain
          // Bypass with comment // safe-global-update
          if (!snippet.includes('app_id') && !snippet.includes('safe-global-update')) {
            violations.push(
              `${path.relative(SRC_DIR, file)}: update on '${table}' missing app_id filter`
            );
          }
        }
      });
    });

    expect(
      violations,
      `FAIL: Tenant table updates must filter by 'app_id' to prevent cross-tenant mutation. Violations:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
