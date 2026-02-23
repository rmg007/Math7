/**
 * Content Hasher
 * Generates SHA256 hashes for change detection
 */

import crypto from 'crypto';

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}
