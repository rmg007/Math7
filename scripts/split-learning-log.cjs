const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '..', 'docs', 'LEARNING_LOG.md');
const archivePath = path.join(__dirname, '..', 'docs', 'archive', 'LEARNING_LOG_ARCHIVE.md');
const KEEP_ENTRIES = parseInt(process.env.LEARNING_LOG_KEEP, 10) || 20;

const content = fs.readFileSync(logPath, 'utf-8');
const lines = content.split('\n');

let i = 0;
while (i < lines.length && !lines[i].match(/^## \d{4}-\d{2}-\d{2}/) && !lines[i].match(/^## \[\d{4}-\d{2}-\d{2}\]/)) {
  i++;
}
const headerEnd = i;
const header = lines.slice(0, headerEnd).join('\n').trim();

const rest = lines.slice(headerEnd).join('\n');
const rawBlocks = rest.split(/\n---\n/).filter(b => b.trim());

const entries = [];
for (const block of rawBlocks) {
  const firstLine = block.split('\n')[0];
  const dateMatch = firstLine.match(/^## (\d{4}-\d{2}-\d{2})/) || firstLine.match(/^## \[(\d{4}-\d{2}-\d{2})\]/);
  const date = dateMatch ? dateMatch[1] : '0000-00-00';
  entries.push({ date, block: block.trim() });
}

entries.sort((a, b) => b.date.localeCompare(a.date));

const keep = entries.slice(0, KEEP_ENTRIES);
const archive = entries.slice(KEEP_ENTRIES);

const mainContent = header + '\n\n> Entries older than 30 days are in docs/archive/LEARNING_LOG_ARCHIVE.md\n\n' + keep.map(e => e.block).join('\n\n---\n\n');
const archiveContent = '# Questerix Learning Log (Archive)\n\n> Archived entries. See docs/LEARNING_LOG.md for recent entries.\n\n' + archive.map(e => e.block).join('\n\n---\n\n');

fs.mkdirSync(path.dirname(archivePath), { recursive: true });
fs.writeFileSync(logPath, mainContent, 'utf-8');
fs.writeFileSync(archivePath, archiveContent, 'utf-8');
console.log('Kept', keep.length, 'entries in LEARNING_LOG.md, archived', archive.length);
