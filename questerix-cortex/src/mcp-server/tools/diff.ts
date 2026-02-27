/**
 * Cortex Diff Tool - Provides structured diff since last session
 *
 * This tool allows agents to ask "what changed since my last session?"
 * and get structured data about file changes with tier classification.
 */

import { execSync } from "child_process";
import * as path from "path";
import type Database from "better-sqlite3";

export interface DiffResult {
  added: DiffFile[];
  modified: DiffFile[];
  deleted: DiffFile[];
  summary: {
    total: number;
    added: number;
    modified: number;
    deleted: number;
  };
  riskSummary: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    structuralChanges: boolean;
  };
}

export interface DiffFile {
  path: string;
  tier: "A" | "B" | "C";
  fragilityIndex: number;
  changeType: "added" | "modified" | "deleted";
}

interface FragilityRow {
  fragility_index: number;
}

const STRUCTURAL_PATTERNS = [
  /tsconfig\.json$/,
  /package\.json$/,
  /vite\.config\./,
  /supabase\/config\.toml$/,
  /\.env/,
  /supabase\/migrations/,
  /admin-panel\/src\/App\.tsx$/,
  /admin-panel\/src\/main\.tsx$/,
  /admin-panel\/src\/types\/database\.types\.ts$/,
];

function runGit(cwd: string, command: string): string | null {
  try {
    return execSync(command, {
      cwd,
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch {
    return null;
  }
}

function classifyTier(filePath: string, fragilityIndex: number): "A" | "B" | "C" {
  // Check if structural file
  if (STRUCTURAL_PATTERNS.some((pattern) => pattern.test(filePath))) {
    return "C";
  }

  // Check fragility
  if (fragilityIndex > 0.5) return "C";
  if (fragilityIndex > 0.3) return "B";

  // Check file count patterns (simplified for single file)
  return "A";
}

function getFragilityForFile(
  db: Database.Database,
  filePath: string,
): number {
  try {
    const row = db
      .prepare(
        "SELECT fragility_index FROM fragility WHERE file_path = ?",
      )
      .get(filePath) as FragilityRow | undefined;
    return row?.fragility_index ?? 0;
  } catch {
    return 0;
  }
}

function parseDiffOutput(
  output: string,
  db: Database.Database,
  repoRoot: string,
): { added: DiffFile[]; modified: DiffFile[]; deleted: DiffFile[] } {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const added: DiffFile[] = [];
  const modified: DiffFile[] = [];
  const deleted: DiffFile[] = [];

  for (const line of lines) {
    // Parse git diff --name-status format: X\tpath
    const match = line.match(/^([AMD])\t(.+)$/);
    if (!match) continue;

    const [, status, filePath] = match;
    const fullPath = path.join(repoRoot, filePath);
    const fragilityIndex = getFragilityForFile(db, fullPath);
    const tier = classifyTier(filePath, fragilityIndex);

    const diffFile: DiffFile = {
      path: filePath,
      tier,
      fragilityIndex,
      changeType:
        status === "A"
          ? "added"
          : status === "M"
            ? "modified"
            : "deleted",
    };

    if (status === "A") {
      added.push(diffFile);
    } else if (status === "M") {
      modified.push(diffFile);
    } else if (status === "D") {
      deleted.push(diffFile);
    }
  }

  return { added, modified, deleted };
}

function parseLogOutput(
  output: string,
  db: Database.Database,
  repoRoot: string,
): { added: DiffFile[]; modified: DiffFile[]; deleted: DiffFile[] } {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const uniqueFiles = Array.from(new Set(lines));
  const modified: DiffFile[] = [];

  for (const filePath of uniqueFiles) {
    const fullPath = path.join(repoRoot, filePath);
    const fragilityIndex = getFragilityForFile(db, fullPath);
    const tier = classifyTier(filePath, fragilityIndex);

    modified.push({
      path: filePath,
      tier,
      fragilityIndex,
      changeType: "modified",
    });
  }

  return { added: [], modified, deleted: [] };
}

export function handleDiff(
  since: "last_session" | "24h" | string,
  repoRoot: string,
  db: Database.Database,
): DiffResult {
  let output: string | null;
  let command: string;

  if (since === "last_session") {
    // Get last scan commit from database
    let lastCommit: string | null = null;
    try {
      const row = db
        .prepare("SELECT value FROM scan_meta WHERE key = ?")
        .get("last_scan_commit") as { value?: string } | undefined;
      lastCommit = row?.value ?? null;
    } catch {
      lastCommit = null;
    }

    if (!lastCommit) {
      return {
        added: [],
        modified: [],
        deleted: [],
        summary: { total: 0, added: 0, modified: 0, deleted: 0 },
        riskSummary: {
          highRisk: 0,
          mediumRisk: 0,
          lowRisk: 0,
          structuralChanges: false,
        },
      };
    }

    command = `git diff --name-status ${lastCommit}..HEAD`;
  } else if (since === "24h") {
    command = 'git log --since="24 hours" --name-only --pretty=format:""';
  } else {
    // Assume it's a commit hash
    command = `git diff --name-status ${since}..HEAD`;
  }

  output = runGit(repoRoot, command);

  if (output === null) {
    throw new Error(`Git command failed: ${command}`);
  }

  let result: { added: DiffFile[]; modified: DiffFile[]; deleted: DiffFile[] };

  if (since === "24h") {
    result = parseLogOutput(output, db, repoRoot);
  } else {
    result = parseDiffOutput(output, db, repoRoot);
  }

  const { added, modified, deleted } = result;
  const allFiles = [...added, ...modified, ...deleted];

  // Calculate risk summary
  const highRisk = allFiles.filter((f) => f.tier === "C").length;
  const mediumRisk = allFiles.filter((f) => f.tier === "B").length;
  const lowRisk = allFiles.filter((f) => f.tier === "A").length;
  const structuralChanges = allFiles.some((f) =>
    STRUCTURAL_PATTERNS.some((pattern) => pattern.test(f.path)),
  );

  return {
    added,
    modified,
    deleted,
    summary: {
      total: allFiles.length,
      added: added.length,
      modified: modified.length,
      deleted: deleted.length,
    },
    riskSummary: {
      highRisk,
      mediumRisk,
      lowRisk,
      structuralChanges,
    },
  };
}
