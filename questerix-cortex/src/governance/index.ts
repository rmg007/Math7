import * as fs from "fs";
import * as path from "path";

export interface GovernanceResult {
  deadRefs: Array<{ file: string; ref: string; line?: number }>;
  scannedFiles: number;
}

const GOVERNANCE_DIRS = [
  ".agent",
  ".cursor",
  "docs/strategy",
  "docs/standards",
];

/**
 * Subdirectories within GOVERNANCE_DIRS that contain only historical/archive
 * content. These are excluded to avoid noise from stale references.
 */
const EXCLUDED_SUBDIRS = [
  ".agent/archive",
];

/**
 * Path prefixes that indicate references to sibling repos or external tools
 * that are intentionally outside this repository.
 */
const CROSS_REPO_PREFIXES = [
  "questerix-student-app/",
  "questerix-landing-pages/",
  "questerix-help-docs/",
  "student-app/",
  "landing-pages/",
  "content-engine/",
  "help-docs/",
  "ios/",
  ".antigravity/",
];

/**
 * Collect .md files under projectRoot that match the governance surface.
 * If dirsToScan is provided, only those directories are scanned (for testing).
 * Otherwise, uses the default GOVERNANCE_DIRS.
 */
function collectMarkdownFiles(projectRoot: string, dirsToScan?: string[]): string[] {
  const out: string[] = [];

  function walk(relDir: string) {
    const normalizedRelDir = relDir.replace(/\\/g, "/");
    if (EXCLUDED_SUBDIRS.some((ex) => normalizedRelDir === ex || normalizedRelDir.startsWith(ex + "/"))) {
      return;
    }
    const fullDir = path.join(projectRoot, relDir);
    if (!fs.existsSync(fullDir)) return;
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const e of entries) {
      const rel = path.join(relDir, e.name).replace(/\\/g, "/");
      if (e.isDirectory()) {
        walk(rel);
      } else if (e.name.endsWith(".md")) {
        out.push(rel);
      }
    }
  }

  try {
    const rootFiles = fs.readdirSync(projectRoot);
    for (const f of rootFiles) {
      if (f.endsWith(".md")) out.push(f);
    }
  } catch {
    // ignore
  }

  const dirs = dirsToScan ?? GOVERNANCE_DIRS;
  for (const dir of dirs) {
    walk(dir);
  }

  return [...new Set(out)];
}

/**
 * Check if a path looks like a glob pattern, alias, or other non-file reference.
 */
function isNonFilePath(p: string): boolean {
  // Glob patterns: *, ?, [, {
  if (/[*?[\]{]/.test(p)) return true;
  // Path aliases: @/, ~/
  if (p.startsWith("@/") || p.startsWith("~/")) return true;
  // Full URLs (http/https/mailto) — catches backtick-wrapped localhost and external links
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("mailto:")) return true;
  // URLs without protocol (e.g., supabase.co)
  if (/\.(com|co|io|dev|org|net)\b/.test(p)) return true;
  // CSS/Tailwind patterns (e.g., gray-500/600)
  if (/^[a-z]+-\d+\/\d+$/.test(p)) return true;
  // Markdown task markers like [/] or [x]
  if (/^\[.\]$/.test(p)) return true;
  // Relative paths that are clearly patterns (e.g., *.md, **/*.ts)
  if (p.includes("**") || p.startsWith("*.")) return true;
  // Cross-repo paths (sibling repositories not present in this monorepo)
  if (CROSS_REPO_PREFIXES.some((prefix) => p.startsWith(prefix))) return true;
  // Placeholder date patterns in filenames (e.g., codescene-analysis-YYYY-MM-DD.md)
  if (/YYYY|MM-DD/.test(p)) return true;
  // npm package names with scope (e.g., @questerix/core)
  if (/^@[\w-]+\/[\w-]+$/.test(p)) return true;
  return false;
}

/**
 * Extract internal file references from markdown content.
 * Matches: [text](path), `path`, and "Read path" / "read path" style.
 */
function extractRefs(content: string): string[] {
  const refs: string[] = [];

  // Markdown links: ](path) or ](path#anchor) or ](path:linenum)
  const linkRe = /\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(content)) !== null) {
    const raw = m[1].trim();
    // Strip anchor (#section) and line-number (:123) suffixes
    const filePath = raw.split("#")[0].replace(/:\d+$/, "").trim();
    if (
      filePath &&
      !isNonFilePath(filePath)
    ) {
      refs.push(filePath);
    }
  }

  // Backtick-quoted paths that look like repo paths (contain .md or /)
  const backtickRe = /`([^`]+)`/g;
  while ((m = backtickRe.exec(content)) !== null) {
    const p = m[1].trim();
    // Only consider paths that look like filesystem paths (not commands, npm packages, etc.)
    if (
      (p.endsWith(".md") || (p.includes("/") && !p.includes(" ") && !p.includes("(") && !p.includes(")"))) &&
      !isNonFilePath(p)
    ) {
      refs.push(p);
    }
  }

  // "Read X" or "read X" where X is a path
  const readRe = /[Rr]ead\s+[`']?([^\s`']+\.md)[`']?/g;
  while ((m = readRe.exec(content)) !== null) {
    const ref = m[1].trim();
    if (!isNonFilePath(ref)) {
      refs.push(ref);
    }
  }

  return [...new Set(refs)];
}

/**
 * Resolve a reference from the file that contains it to an absolute path.
 *
 * Strategy:
 * 1. Try resolving relative to the source file's directory (standard behaviour).
 * 2. If that path doesn't exist, also try resolving relative to the project root.
 *    Many governance docs (e.g. `.agent/workflows/*.md`) intentionally use
 *    project-root-relative paths like `admin-panel/src/App.tsx` rather than
 *    `../../admin-panel/src/App.tsx`.  The fallback prevents these from being
 *    incorrectly flagged as dead references.
 */
function resolveRef(
  projectRoot: string,
  fromFile: string,
  ref: string,
): string | null {
  // Normalize ref: no leading ./
  let p = ref.replace(/^\.\//, "");
  if (p.startsWith("/")) return null;

  const fromDir = path.dirname(path.join(projectRoot, fromFile));

  // Primary: resolve relative to the source file's directory
  const resolved1 = path.normalize(path.join(fromDir, p));
  const rel1 = path.relative(projectRoot, resolved1);
  if (rel1.startsWith("..")) return null; // outside repo

  if (fs.existsSync(resolved1)) return resolved1;

  // Fallback: resolve relative to the project root (handles docs that use
  // root-relative paths like `admin-panel/src/App.tsx`)
  const resolved2 = path.normalize(path.join(projectRoot, p));
  const rel2 = path.relative(projectRoot, resolved2);
  if (!rel2.startsWith("..") && rel1 !== rel2 && fs.existsSync(resolved2)) {
    return resolved2;
  }

  // Neither resolution found a file; return the primary path so caller flags it
  return resolved1;
}

export function auditGovernance(projectRoot: string, dirsToScan?: string[]): GovernanceResult {
  const deadRefs: Array<{ file: string; ref: string; line?: number }> = [];
  const files = collectMarkdownFiles(projectRoot, dirsToScan);

  for (const file of files) {
    const absPath = path.join(projectRoot, file);
    let content: string;
    try {
      content = fs.readFileSync(absPath, "utf-8");
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
