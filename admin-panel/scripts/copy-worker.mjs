import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const src = path.join(root, 'node_modules/pdfjs-dist/build/pdf.worker.mjs');
const destDir = path.join(root, 'public/pdfjs');
const dest = path.join(destDir, 'pdf.worker.mjs');

try {
  if (fs.existsSync(src)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log('✅ PDF.js worker copied to public/pdfjs/pdf.worker.mjs');
  } else {
    console.warn('⚠️ PDF.js worker not found in node_modules. Skipping copy.');
  }
} catch (err) {
  console.error('❌ Failed to copy PDF.js worker:', err.message);
  process.exit(0); // Don't fail the whole install if this fails
}
