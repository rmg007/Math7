import * as fs from 'fs';
import * as path from 'path';

export interface GovernanceResult {
  deadRefs: Array<{ file: string; ref: string; line?: number }>;
  scannedFiles: number;
}

const GOVERNANCE_DIRS = ['.agent', '.cursor', 'docs/strategy', 'docs/standards'];

/**
 * Collect .md files under projectRoot that match the governance surface.
 */
function collectMarkdownFiles(projectRoot: string): string[] {
  const out: string[] = [];

  function walk(relDir: string) {
    const fullDir = path.join(projectRoot, relDir);
    if (!fs.existsSync(fullDir)) return;
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const e of entries) {
      const rel = path.join(relDir, e.name).replace(/\\/g, '/');
      if (e.isDirectory()) {
        walk(rel);
      } else if (e.name.endsWith('.md')) {
        out.push(rel);
      }
    }
  }

  try {
    const rootFiles = fs.readdirSync(projectRoot);
    for (const f of rootFiles) {
      if (f.endsWith('.md')) out.push(f);
    }
  } catch {
    // ignore
  }

  for (const dir of GOVERNANCE_DIRS) {
    walk(dir);
  }

  return [...new Set(out)];
}

/**
 * Extract internal file references from markdown content.
 * Matches: [text](path), `path`, and "Read path" / "read path" style.
 */
function extractRefs(content: string): string[] {
  const refs: string[] = [];

  // Markdown links: ](path) or ](path#anchor)
  const linkRe = /\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(content)) !== null) {
    const raw = m[1].trim();
    const filePath = raw.split('#')[0].trim();
    if (filePath && !filePath.startsWith('http') && !filePath.startsWith('mailto:')) {
      refs.push(filePath);
    }
  }

  // Backtick-quoted paths that look like repo paths (contain .md or /)
  const backtickRe = /`([^`]+)`/g;
  while ((m = backtickRe.exec(content)) !== null) {
    const p = m[1].trim();
    if (p.endsWith('.md') || (p.includes('/') && !p.includes(' '))) {
      refs.push(p);
    }
  }

  // "Read X" or "read X" where X is a path
  const readRe = /[Rr]ead\s+[`']?([^\s`']+\.md)[`']?/g;
  while ((m = readRe.exec(content)) !== null) {
    refs.push(m[1].trim());
  }

  return [...new Set(refs)];
}

/**
 * Resolve a reference from the file that contains it to an absolute path and check existence.
 */
function resolveRef(projectRoot: string, fromFile: string, ref: string): string | null {
  // Normalize ref: no leading ./
  let p = ref.replace(/^\.\//, '');
  if (p.startsWith('/')) return null;
  const fromDir = path.dirname(path.join(projectRoot, fromFile));
  const resolved = path.normalize(path.join(fromDir, p));
  const rel = path.relative(projectRoot, resolved);
  if (rel.startsWith('..')) return null; // outside repo
  return path.join(projectRoot, rel);
}

export function auditGovernance(projectRoot: string): GovernanceResult {
  const deadRefs: Array<{ file: string; ref: string; line?: number }> = [];
  const files = collectMarkdownFiles(projectRoot);

  for (const file of files) {
    const absPath = path.join(projectRoot, file);
    let content: string;
    try {
      content = fs.readFileSync(absPath, 'utf-8');
    } catch {
      continue;
    }

    const refs = extractRefs(content);
    for (const ref of refs) {
      const resolved = resolveRef(projectRoot, file, ref);
      if (!resolved) continue;
      try {
        if (!fs.existsSync(resolved)) {
          deadRefs.push({ file, ref });
        }
      } catch {
        deadRefs.push({ file, ref });
      }
    }
  }

  return { deadRefs, scannedFiles: files.length };
}
