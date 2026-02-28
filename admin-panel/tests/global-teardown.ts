/**
 * Playwright Global Teardown — .auth/ Snapshot Pruning
 *
 * Runs once after all tests complete. Prunes stale `.auth/*.json` storageState
 * files that are older than MAX_AGE_HOURS. This prevents credential files from
 * accumulating across CI runs (they're gitignored but still consume disk space
 * and can cause confusion if a stale file somehow survives between runs).
 *
 * Why prune in teardown (not setup)?
 * - Setup needs the files (or creates them fresh).
 * - Teardown runs after all tests — safe to remove session files that are now
 *   expired or stale from a previous run.
 * - On CI, the workspace is ephemeral anyway — this is mainly a local dev concern.
 *
 * Pruning rules:
 *   - Only removes *.json files in the .auth/ directory (never recursively).
 *   - Only removes files that are older than MAX_AGE_HOURS (default: 25h, so
 *     yesterday's run is always pruned but today's run is safe).
 *   - Never throws — pruning is best-effort and must not fail CI.
 *
 * Registration: add `globalTeardown: './tests/global-teardown.ts'` to
 * playwright.config.ts.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Only prune files older than this many hours. */
const MAX_AGE_HOURS = 25;
const MAX_AGE_MS = MAX_AGE_HOURS * 60 * 60 * 1000;

const AUTH_DIR = path.resolve(__dirname, '..', '.auth');

export default async function globalTeardown(): Promise<void> {
  pruneAuthDir();
}

/**
 * Removes .auth/*.json files that are older than MAX_AGE_HOURS.
 * Synchronous — teardown doesn't need async here and sync errors are easier to surface.
 */
function pruneAuthDir(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    // .auth/ doesn't exist (e.g. CI skipped global setup) — nothing to prune
    return;
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(AUTH_DIR, { withFileTypes: true });
  } catch (e) {
    console.warn('[globalTeardown] Could not read .auth/ directory:', e);
    return;
  }

  const now = Date.now();
  let pruned = 0;
  let kept = 0;
  let errors = 0;

  for (const entry of entries) {
    // Only target .json files — never subdirectories or other files
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;

    const filePath = path.join(AUTH_DIR, entry.name);

    try {
      const stat = fs.statSync(filePath);
      const ageMs = now - stat.mtimeMs;

      if (ageMs > MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        const ageHours = Math.round(ageMs / 3600000);
        console.log(`[globalTeardown] 🗑  Pruned stale auth state: ${entry.name} (${ageHours}h old)`);
        pruned++;
      } else {
        const ageMins = Math.round(ageMs / 60000);
        console.log(`[globalTeardown] ✅ Kept fresh auth state: ${entry.name} (${ageMins}min old)`);
        kept++;
      }
    } catch (e) {
      console.warn(`[globalTeardown] ⚠️  Could not prune ${entry.name}:`, e);
      errors++;
    }
  }

  console.log(
    `[globalTeardown] Auth pruning complete — kept: ${kept}, pruned: ${pruned}, errors: ${errors}`
  );
}
