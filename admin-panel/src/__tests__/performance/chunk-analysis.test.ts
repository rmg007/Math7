import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const DIST_DIR = path.resolve(__dirname, '../../../dist/assets');

describe('Performance Baseline & Chunk Separation', () => {
  // Task 5.1: Lazy loading guard
  it('should split heavy vendor chunks (document-vendor, ui-vendor, editor-vendor)', () => {
    // Skip test if build artifacts are missing (e.g. in development mode without build)
    if (!fs.existsSync(DIST_DIR)) {
      console.warn('Skipping chunk analysis test: dist/assets not found. Run npm run build first.');
      return;
    }

    const files = fs.readdirSync(DIST_DIR);

    // Verify manualChunks configuration from vite.config.ts is effective
    const hasDocVendor = files.some((f) => f.startsWith('document-vendor-') && f.endsWith('.js'));
    const hasUiVendor = files.some((f) => f.startsWith('ui-vendor-') && f.endsWith('.js'));
    const hasEditorVendor = files.some((f) => f.startsWith('editor-vendor-') && f.endsWith('.js'));
    const hasCoreVendor = files.some((f) => f.startsWith('core-vendor-') && f.endsWith('.js'));

    expect(
      hasDocVendor,
      'Missing document-vendor chunk! PDF/DOCX libs (pdfjs, mammoth) may be bloating main bundle'
    ).toBe(true);
    expect(hasUiVendor, 'Missing ui-vendor chunk! Radix UI components should be split').toBe(true);
    expect(hasEditorVendor, 'Missing editor-vendor chunk! Tiptap/Katex should be split').toBe(true);
    expect(hasCoreVendor, 'Missing core-vendor chunk! React Query/Supabase should be split').toBe(
      true
    );
  });

  // Task 5.2: Performance regression guard (1MB limit)
  it('should maintain reasonable chunk sizes (< 1MB for non-document vendors)', () => {
    if (!fs.existsSync(DIST_DIR)) return;

    const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.js'));

    // 1MB Limit
    const MAX_SIZE = 1024 * 1024;

    files.forEach((file) => {
      const filePath = path.join(DIST_DIR, file);
      const size = fs.statSync(filePath).size;

      // Exception: document-vendor can be large due to PDF.js worker/core
      if (file.startsWith('document-vendor')) {
        // Warn if excessively large (> 2MB)
        if (size > 2 * 1024 * 1024) {
          console.warn(
            `Warning: document-vendor chunk is very large: ${(size / 1024 / 1024).toFixed(2)}MB`
          );
        }
        return;
      }

      // Exception: core-vendor might grow, but should be monitored
      if (file.startsWith('core-vendor')) {
        // Allow up to 1.5MB for core vendor if absolutely necessary, but prefer < 1MB
        // Currently checking < 1MB strict
      }

      expect(
        size,
        `Chunk ${file} exceeds 1MB limit (${(size / 1024).toFixed(2)}KB). Analyze bundle!`
      ).toBeLessThanOrEqual(MAX_SIZE);
    });
  });
});
