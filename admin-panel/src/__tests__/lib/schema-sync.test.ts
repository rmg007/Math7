import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

// Adjust path as needed based on actual file location
const TYPE_FILE_PATH = path.resolve(__dirname, '../../lib/database.types.ts');

describe('Database Schema Sync', () => {
  // Task 3.1: Verify module export to prevent build failures
  it('should export Database type', () => {
    const content = fs.readFileSync(TYPE_FILE_PATH, 'utf-8');
    expect(content).toContain('export type Database =');
  });

  // Task 3.2: Verify file integrity (not truncated or empty)
  it('should be a valid non-empty file (>10KB)', () => {
    const stats = fs.statSync(TYPE_FILE_PATH);
    // 10KB = 10240 bytes. A truncated file is usually < 1KB.
    expect(stats.size).toBeGreaterThan(10240);
  });

  // Task 3.3: Verify drift detection for critical RPCs
  it('should contain key RPC functions (validate_and_use_invitation_code, consume_tenant_tokens)', () => {
    const content = fs.readFileSync(TYPE_FILE_PATH, 'utf-8');
    const keyRpcs = ['validate_and_use_invitation_code', 'consume_tenant_tokens'];

    keyRpcs.forEach((rpc) => {
      expect(
        content.includes(rpc),
        `Types file missing RPC: ${rpc}. Run 'npm run update-types'.`
      ).toBe(true);
    });
  });
});
