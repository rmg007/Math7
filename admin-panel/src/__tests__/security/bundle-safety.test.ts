import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const SRC_DIR = path.resolve(__dirname, '../../');

// Helper to recursively walk directories
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

describe('Bundle Safety & Secret Scanning', () => {
  const allFiles: string[] = [];

  // Gather all source files (excluding tests)
  walkDir(SRC_DIR, (filePath) => {
    // Only verify TS/TSX files
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      // Skip test files themselves to avoid false positives in the scanner itself
      // Also skip .d.ts files as type definitions are safe
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

  it('should not contain VITE_SUPABASE_SERVICE_ROLE_KEY in client code', () => {
    const violations: string[] = [];
    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('VITE_SUPABASE_SERVICE_ROLE_KEY')) {
        violations.push(path.relative(SRC_DIR, file));
      }
    });
    expect(
      violations,
      `FAIL: Found VITE_SUPABASE_SERVICE_ROLE_KEY usage in client bundle: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('should not contain direct API key imports (OpenAI/Gemini)', () => {
    const violations: string[] = [];
    const forbidden = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY'];
    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      forbidden.forEach((key) => {
        // Skip if it's just a type definition or comment potentially
        // But generally, these strings shouldn't appear in source
        if (content.includes(key)) {
          violations.push(`${path.relative(SRC_DIR, file)} contains ${key}`);
        }
      });
    });
    expect(
      violations,
      `FAIL: Found backend API keys in client bundle: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('should not expose role escalation in signUp payloads', () => {
    const violations: string[] = [];
    // Regex detects .signUp({ ... role: ... })
    // Matches .signUp( followed by anything until it sees user_metadata or data, then checks for role: inside
    const roleEscalationRegex = /\.signUp\(\s*\{[\s\S]*?role\s*:/;

    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      if (roleEscalationRegex.test(content)) {
        violations.push(path.relative(SRC_DIR, file));
      }
    });
    expect(
      violations,
      `FAIL: Found potential role escalation in signUp() call: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('should not console.log sensitive invitation codes', () => {
    const violations: string[] = [];
    // Specific check for invitation codes being logged
    const invitationLogRegex = /console\.log\([^)]*invitation[^)]*\)/i;

    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      if (invitationLogRegex.test(content)) {
        violations.push(`${path.relative(SRC_DIR, file)} logs 'invitation' info`);
      }
    });

    expect(
      violations,
      `FAIL: Found console.log of invitation data: ${violations.join(', ')}`
    ).toEqual([]);
  });
});
