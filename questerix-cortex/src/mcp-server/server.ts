import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import type Database from "better-sqlite3";
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Project } from "ts-morph";
import { CortexDB } from "../cortex-db";
import { Scanner } from "../scanner";
import { normalizePath } from "../utils/normalize-path";
import { logChange } from "./change-logger";
import { attributeFragility } from "./fragility-engine";
import { getFragilityReport } from "./tools/fragility";
import { runVerification } from "./verify-engine";

type ImpactResponse =
  | {
      affected_files: string[];
      test_files: string[];
      fragility_warnings: Array<Record<string, unknown>>;
      graph_freshness: string;
      warning?: string;
    }
  | { warning: string; data: null }
  | { warning: string; affected_files: string[] };

type QueryResponse =
  | {
      match: { id: string; file: string; type: "symbol" | "file" };
      edges_in: Array<Record<string, unknown>>;
      edges_out: Array<Record<string, unknown>>;
    }
  | {
      matches: Array<{ id: string; file: string }>;
      note: string;
    }
  | { matches: []; note: string }
  | { warning: string; data: null };

type TierLabel = "Auto-approve" | "Auto-plan" | "Human gate";
type TierValue = "A" | "B" | "C";

interface FragilitySummary {
  file: string;
  fragility_index: number;
  change_count: number;
  failure_count: number;
  confidence: string;
  missing?: boolean;
}

const sessionId = randomUUID();
// Support CORTEX_ROOT_PATH env var override for non-standard setups
const cortexRoot = process.env.CORTEX_ROOT_PATH
  ? path.resolve(process.env.CORTEX_ROOT_PATH)
  : fs.existsSync(path.resolve(__dirname, "..", "outputs"))
    ? path.resolve(__dirname, "..") // src/mcp-server -> src -> cortexRoot
    : fs.existsSync(path.resolve(__dirname, "..", "..", "outputs"))
      ? path.resolve(__dirname, "..", "..") // src/mcp-server -> src -> root (standard dev)
      : path.resolve(__dirname, "..", "..", ".."); // dist/src/mcp-server -> dist/src -> dist -> root

// Validate cortexRoot - if outputs doesn't exist, create it and warn
const outputsPath = path.join(cortexRoot, "outputs");
if (!fs.existsSync(outputsPath)) {
  try {
    fs.mkdirSync(outputsPath, { recursive: true });
    console.error(`⚠️  Created outputs directory at ${outputsPath}`);
    console.error("   Run 'npm run health' to populate Cortex data");
  } catch (err) {
    console.error(`❌ Failed to create outputs directory: ${err}`);
  }
}
const repoRoot = path.resolve(cortexRoot, "..");
const adminPanelPath = path.join(repoRoot, "admin-panel");
const adminSrcPath = path.join(adminPanelPath, "src");
const dbPath = path.join(cortexRoot, "outputs", "cortex.db");
const MISSING_GRAPH_WARNING = "Run 'npm run health' first";
const EMPTY_GRAPH_WARNING = "Graph empty";

const STRUCTURAL_JSON_LIST = [
  "tsconfig.json",
  "package.json",
  "vite.config.*",
  "supabase/config.toml",
  ".env*",
  "supabase/migrations/**",
  "admin-panel/src/App.tsx",
  "admin-panel/src/main.tsx",
  "admin-panel/src/types/database.types.ts"
];

let scanner: Scanner | null = null;
const structuralMatchers = STRUCTURAL_JSON_LIST.map(pattern => {
  const normalized = normalizePath(pattern);
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const withDoubleStar = escaped.replace(/\*\*/g, "__DOUBLE_STAR__");
  const withSingleStar = withDoubleStar.replace(/\*/g, "[^/]*");
  const withGlob = withSingleStar.replace(/__DOUBLE_STAR__/g, ".*");
  return { pattern: normalized, regex: new RegExp(`^${withGlob}$`) };
});

function getScanner(): Scanner {
  if (scanner) return scanner;
  const project = new Project({
    tsConfigFilePath: path.join(adminPanelPath, "tsconfig.json")
  });
  scanner = new Scanner(project, adminSrcPath);
  return scanner;
}

function runGit(command: string): string | null {
  try {
    return execSync(command, {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: "pipe"
    });
  } catch {
    return null;
  }
}

function toJsonContent(payload: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload)
      }
    ]
  };
}

function normalizeFileList(files: string[]): string[] {
  const normalized = files
    .map(file => normalizePath(file))
    .map(file => file.trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function getStructuralFiles(files: string[]): string[] {
  return files.filter(file =>
    structuralMatchers.some(matcher => matcher.regex.test(file))
  );
}

function loadFragilitySummaries(
  db: Database.Database,
  files: string[]
): FragilitySummary[] {
  const selectFragility = db.prepare(
    `
      SELECT file_path, fragility_index, change_count, failure_count, confidence
      FROM fragility
      WHERE file_path = ?
    `
  );

  return files.map(file => {
    const row = selectFragility.get(file) as
      | {
          file_path: string;
          fragility_index: number;
          change_count: number;
          failure_count: number;
          confidence: string;
        }
      | undefined;
    const nodeExists = db
      .prepare("SELECT 1 FROM nodes WHERE id = ?")
      .get(file);
    const missing = !nodeExists;
    return {
      file,
      fragility_index: row?.fragility_index ?? 0,
      change_count: row?.change_count ?? 0,
      failure_count: row?.failure_count ?? 0,
      confidence: row?.confidence ?? "LOW",
      missing
    };
  });
}

function resolveTestFiles(db: Database.Database, filePath: string): string[] {
  const query = db.prepare(
    `
      SELECT source_id FROM edges WHERE target_id = ? AND relationship = 'tests'
      UNION
      SELECT e2.source_id
      FROM edges e1
      JOIN edges e2 ON e1.source_id = e2.target_id
      WHERE e1.target_id = ? AND e1.relationship = 'imports' AND e2.relationship = 'tests'
    `
  );
  const rows = query.all(filePath, filePath) as Array<{ source_id: string }>;
  return rows.map(row => row.source_id);
}

function getSuggestedTests(
  db: Database.Database,
  files: string[]
): string[] {
  const testFiles = new Set<string>();
  for (const file of files) {
    for (const testFile of resolveTestFiles(db, file)) {
      testFiles.add(testFile);
    }
  }
  return Array.from(testFiles).sort();
}

function classifyTier(
  fileCount: number,
  maxFragility: number,
  structuralFiles: string[]
): { tier: TierValue; label: TierLabel; protocol: string; reason: string } {
  if (structuralFiles.length > 0) {
    return {
      tier: "C",
      label: "Human gate",
      protocol: "High risk. Agent MUST get user approval before editing.",
      reason: `Structural file change (${structuralFiles.length} match${structuralFiles.length === 1 ? "" : "es"}).`
    };
  }

  if (fileCount > 10) {
    return {
      tier: "C",
      label: "Human gate",
      protocol: "High risk. Agent MUST get user approval before editing.",
      reason: `Large scope: ${fileCount} files.`
    };
  }

  if (maxFragility > 0.5) {
    return {
      tier: "C",
      label: "Human gate",
      protocol: "High risk. Agent MUST get user approval before editing.",
      reason: `High fragility detected (${maxFragility.toFixed(2)}).`
    };
  }

  if (fileCount > 5 || maxFragility > 0.3) {
    return {
      tier: "B",
      label: "Auto-plan",
      protocol: "Outline your changes before proceeding. Run cortex_verify after.",
      reason: `Medium scope or fragility (files: ${fileCount}, max fragility: ${maxFragility.toFixed(2)}).`
    };
  }

  return {
    tier: "A",
    label: "Auto-approve",
    protocol: "Low risk. Agent proceeds, runs cortex_verify after.",
    reason: `Small scope and low fragility (files: ${fileCount}).`
  };
}

function openDatabase():
  | { db: Database.Database; cortexDb: CortexDB }
  | { warning: string } {
  if (!fs.existsSync(dbPath)) {
    return {
      warning: MISSING_GRAPH_WARNING
    };
  }
  try {
    const cortexDb = new CortexDB(dbPath);
    return { db: cortexDb.getDb(), cortexDb };
  } catch (error) {
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    } catch {
      // best-effort cleanup
    }
    return { warning: "Graph database corrupted. Run 'npm run health' to rebuild." };
  }
}

function isGraphEmpty(db: Database.Database): boolean {
  const row = db.prepare("SELECT COUNT(*) as count FROM nodes").get() as {
    count: number;
  };
  return row.count === 0;
}

function upsertScanMeta(db: Database.Database, commit: string) {
  db.prepare(
    "INSERT OR REPLACE INTO scan_meta (key, value) VALUES (?, ?)"
  ).run("last_scan_commit", commit);
}

async function applyDeltaScan(db: Database.Database): Promise<string> {
  let lastCommit = "";
  try {
    const row = db
      .prepare("SELECT value FROM scan_meta WHERE key = ?")
      .get("last_scan_commit") as { value?: string } | undefined;
    lastCommit = row?.value?.trim() ?? "";
  } catch {
    lastCommit = "";
  }

  const currentCommitRaw = runGit("git rev-parse HEAD");
  if (!currentCommitRaw) {
    return "delta scan skipped: git unavailable";
  }
  const currentCommit = currentCommitRaw.trim();
  if (!lastCommit) {
    upsertScanMeta(db, currentCommit);
    return "delta scan skipped: no baseline commit";
  }

  if (lastCommit === currentCommit) {
    return `delta scan skipped: graph up to date (${currentCommit})`;
  }

  const modified = runGit(`git diff --name-only --diff-filter=d ${lastCommit}`);
  const deleted = runGit(`git diff --name-only --diff-filter=D ${lastCommit}`);
  if (modified === null || deleted === null) {
    return "delta scan skipped: git unavailable";
  }

  const modifiedPaths = modified
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.startsWith("admin-panel/src/"))
    .map(line => path.join(repoRoot, line))
    .filter(fullPath => fs.existsSync(fullPath));

  const deletedPaths = deleted
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.startsWith("admin-panel/src/"));

  if (modifiedPaths.length > 0) {
    const scanResult = await getScanner().scanFiles(modifiedPaths);
    const scanTimestamp = new Date().toISOString();
    const insertNode = db.prepare(`
      INSERT OR REPLACE INTO nodes (id, type, file_path, metadata, updated_at)
      VALUES (@id, @type, @filePath, @metadata, @updatedAt)
    `);
    const insertEdge = db.prepare(`
      INSERT OR REPLACE INTO edges (source_id, target_id, relationship, metadata)
      VALUES (@sourceId, @targetId, @relationship, @metadata)
    `);
    const deleteEdgesForSource = db.prepare(
      "DELETE FROM edges WHERE source_id = ?"
    );

    const upsert = db.transaction(() => {
      for (const node of scanResult.nodes) {
        insertNode.run({
          id: node.id,
          type: node.type,
          filePath: node.filePath ?? null,
          metadata: node.metadata ? JSON.stringify(node.metadata) : null,
          updatedAt: scanTimestamp
        });
      }

      const uniqueSources = Array.from(new Set(scanResult.sourceFiles));
      for (const sourceId of uniqueSources) {
        deleteEdgesForSource.run(sourceId);
      }

      for (const edge of scanResult.edges) {
        insertEdge.run({
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          relationship: edge.relationship,
          metadata: edge.metadata ? JSON.stringify(edge.metadata) : null
        });
      }
    });

    upsert();
  }

  if (deletedPaths.length > 0) {
    const deleteNodes = db.prepare("DELETE FROM nodes WHERE file_path = ?");
    const deleteEdges = db.prepare(
      "DELETE FROM edges WHERE source_id = ? OR target_id = ?"
    );

    const prune = db.transaction(() => {
      for (const deletedPath of deletedPaths) {
        const normalized = normalizePath(deletedPath);
        deleteNodes.run(normalized);
        deleteEdges.run(normalized, normalized);
      }
    });

    prune();
  }

  upsertScanMeta(db, currentCommit);
  return `delta scan applied: ${modifiedPaths.length} files re-scanned, ${deletedPaths.length} files pruned`;
}

function resolveFileNode(
  db: Database.Database,
  rawPath: string
): { id: string; warning?: string } | null {
  const normalized = normalizePath(rawPath);
  if (!normalized) {
    console.error("cortex_impact path normalization failed:", rawPath);
    return null;
  }

  const exact = db
    .prepare("SELECT id FROM nodes WHERE id = ? AND type = 'file'")
    .get(normalized) as { id?: string } | undefined;
  if (exact?.id) return { id: exact.id };

  const fallback = db
    .prepare(
      "SELECT id FROM nodes WHERE type = 'file' AND id LIKE ? LIMIT 2"
    )
    .all(`%${normalized}`) as Array<{ id: string }>;

  if (fallback.length === 1) {
    return {
      id: fallback[0].id,
      warning: `Path normalization fallback used for ${rawPath}.`
    };
  }

  console.error("cortex_impact file not found in graph:", rawPath);
  return null;
}

function handlePlan(files: string[]) {
  const normalizedFiles = normalizeFileList(files);
  const fileCount = normalizedFiles.length;
  const structuralFiles = getStructuralFiles(normalizedFiles);

  const opened = openDatabase();
  let fragilityRecords: FragilitySummary[] = [];
  let suggestedTests: string[] = [];
  let warning: string | undefined;

  if ("warning" in opened) {
    return { warning: opened.warning, data: null };
  }

  const { db, cortexDb } = opened;
  let tierInfo: ReturnType<typeof classifyTier>;
  try {
    if (isGraphEmpty(db)) {
      warning = EMPTY_GRAPH_WARNING;
      // Calculate tier with default values when graph is empty
      tierInfo = classifyTier(fileCount, 0, structuralFiles);
    } else {
      fragilityRecords = loadFragilitySummaries(db, normalizedFiles);
      suggestedTests = getSuggestedTests(db, normalizedFiles);

      // Calculate tier info while we have fragility data
      const maxFragility = fragilityRecords.reduce(
        (max, record) => Math.max(max, record.fragility_index),
        0
      );
      tierInfo = classifyTier(fileCount, maxFragility, structuralFiles);

      // Log the tool call while we have the DB open
      db.prepare(
        `
        INSERT INTO tool_calls (timestamp, session_id, tool_name, parameters, result_tier)
        VALUES (?, ?, 'cortex_plan', ?, ?)
      `
      ).run(
        new Date().toISOString(),
        sessionId,
        JSON.stringify({ files }),
        tierInfo.tier
      );
    }
  } finally {
    cortexDb.close();
  }
  // Note: RiskScorer removed - tier classification provides sufficient guidance

  const missingWarnings = fragilityRecords
    .filter(record => record.missing)
    .map(record => `${record.file} not found in graph.`);
  const fragilityWarnings = [
    ...missingWarnings,
    ...fragilityRecords
      .filter(record => record.fragility_index > 0.3)
      .map(
        record =>
          `${record.file}: fragility ${record.fragility_index.toFixed(2)}, confidence ${record.confidence}`
      )
  ];

  const response = {
    tier: tierInfo.tier,
    label: tierInfo.label,
    reason: tierInfo.reason,
    protocol: tierInfo.protocol,
    fragility_warnings: fragilityWarnings,
    structural_files: structuralFiles,
    suggested_tests: suggestedTests
  };

  return warning ? { warning, ...response } : response;
}

function handleVerify(files: string[]) {
  const startedAt = Date.now();
  const normalizedFiles = normalizeFileList(files);
  const opened = openDatabase();
  if ("warning" in opened) {
    return { warning: opened.warning, data: null };
  }

  const { db, cortexDb } = opened;
  try {
    if (isGraphEmpty(db)) {
      return { warning: EMPTY_GRAPH_WARNING, data: null };
    }
    const verification = runVerification(
      db,
      normalizedFiles,
      adminPanelPath,
      sessionId
    );

    const testsPassedCount = verification.unitTests.passed + verification.e2eTests.passed;
    const testsFailedCount = verification.unitTests.failed + verification.e2eTests.failed;
    const failureDetails = [
      ...verification.unitTests.details,
      ...verification.e2eTests.details
    ];

    for (const file of verification.changedFiles) {
      logChange(db, file, sessionId, testsPassedCount, testsFailedCount, {
        failures: failureDetails,
        tsc: { passed: verification.tsc.passed, errorCount: verification.tsc.errorCount }
      });
    }

    attributeFragility(db, verification.changedFiles, verification, sessionId);

    const fragilityUpdates = verification.changedFiles
      .map(file => {
        const row = db
          .prepare(
            "SELECT fragility_index, confidence FROM fragility WHERE file_path = ?"
          )
          .get(file) as { fragility_index?: number; confidence?: string } | undefined;
        if (!row) return null;
        return {
          file,
          new_index: row.fragility_index ?? 0,
          confidence: row.confidence ?? "LOW"
        };
      })
      .filter(
        (update): update is { file: string; new_index: number; confidence: string } =>
          update !== null
      );

    const tscPassed = verification.tsc.passed;
    const testsPassed = verification.unitTests.failed === 0 && verification.e2eTests.failed === 0;
    const verdict = tscPassed && testsPassed ? "PASS" : "FAIL";

    db.prepare(
      `
      INSERT INTO tool_calls (timestamp, session_id, tool_name, parameters, result_tier)
      VALUES (?, ?, 'cortex_verify', ?, ?)
    `
    ).run(
      new Date().toISOString(),
      sessionId,
      JSON.stringify({ files }),
      verdict
    );

    const warnings: string[] = [];
    if (verification.tsc.unavailable) warnings.push("tsc unavailable");
    if (verification.targetedTests === 0) {
      warnings.push("no targeted tests found");
    }

    return {
      warning: warnings.length > 0 ? warnings.join("; ") : undefined,
      verdict,
      tsc: { passed: tscPassed },
      tests: {
        unit: {
          passed: verification.unitTests.passed,
          failed: verification.unitTests.failed
        },
        e2e: {
          passed: verification.e2eTests.passed,
          failed: verification.e2eTests.failed
        }
      },
      fragility_updates: fragilityUpdates,
      duration_ms: Date.now() - startedAt
    };
  } finally {
    cortexDb.close();
  }
}

async function handleImpact(files: string[]): Promise<ImpactResponse> {
  const opened = openDatabase();
  if ("warning" in opened) {
    return { warning: opened.warning, data: null };
  }

  const { db, cortexDb } = opened;
  try {
    if (isGraphEmpty(db)) {
      return { warning: EMPTY_GRAPH_WARNING, data: null };
    }

    const graphFreshness = await applyDeltaScan(db);
    const matched: string[] = [];
    const warnings: string[] = [];

    if (graphFreshness.includes("git unavailable")) {
      warnings.push("git unavailable; using stale graph");
    }

    for (const file of files) {
      const resolved = resolveFileNode(db, file);
      if (!resolved) continue;
      matched.push(resolved.id);
      if (resolved.warning) warnings.push(resolved.warning);
    }

    if (matched.length === 0) {
      return {
        warning: "File not in graph — may be new, outside scope, or path mismatch.",
        affected_files: []
      };
    }

    const impactedStmt = db.prepare(`
      WITH RECURSIVE impacted AS (
        SELECT source_id AS id, 1 AS depth
        FROM edges
        WHERE target_id = ? AND relationship = 'imports'
        UNION
        SELECT e.source_id, i.depth + 1
        FROM edges e
        JOIN impacted i ON e.target_id = i.id
        WHERE i.depth < 2 AND e.relationship = 'imports'
      )
      SELECT DISTINCT id, depth FROM impacted;
    `);

    const impactedMap = new Map<string, number>();
    for (const fileId of matched) {
      impactedMap.set(fileId, 0);
      const rows = impactedStmt.all(fileId) as Array<{ id: string; depth: number }>;
      for (const row of rows) {
        const existing = impactedMap.get(row.id);
        if (existing === undefined || row.depth < existing) {
          impactedMap.set(row.id, row.depth);
        }
      }
    }

    const affectedFiles = Array.from(impactedMap.entries())
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
      .map(([id]) => id);

    let testFiles: string[] = [];
    if (affectedFiles.length > 0) {
      const placeholders = affectedFiles.map(() => "?").join(", ");
      const testRows = db
        .prepare(
          `SELECT DISTINCT source_id FROM edges WHERE relationship = 'tests' AND target_id IN (${placeholders})`
        )
        .all(...affectedFiles) as Array<{ source_id: string }>;
      testFiles = testRows.map(row => row.source_id).sort();
    }

    let fragilityWarnings: Array<Record<string, unknown>> = [];
    if (affectedFiles.length > 0) {
      const placeholders = affectedFiles.map(() => "?").join(", ");
      fragilityWarnings = db
        .prepare(
          `SELECT * FROM fragility WHERE file_path IN (${placeholders})`
        )
        .all(...affectedFiles) as Array<Record<string, unknown>>;
    }

    return {
      affected_files: affectedFiles,
      test_files: testFiles,
      fragility_warnings: fragilityWarnings,
      graph_freshness: graphFreshness,
      warning: warnings.length > 0 ? warnings.join(" ") : undefined
    };
  } catch (error) {
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    } catch {
      // best-effort cleanup
    }
    return { warning: "Graph database corrupted. Run 'npm run health' to rebuild.", data: null };
  } finally {
    cortexDb.close();
  }
}

function handleQuery(symbol: string): QueryResponse {
  const opened = openDatabase();
  if ("warning" in opened) {
    return { warning: opened.warning, data: null };
  }

  const { db, cortexDb } = opened;
  try {
    if (isGraphEmpty(db)) {
      return { warning: EMPTY_GRAPH_WARNING, data: null };
    }

    const trimmed = symbol.trim();
    if (!trimmed) {
      return { matches: [], note: "Symbol is required." };
    }

    const edgesIn = (id: string) =>
      db
        .prepare("SELECT source_id, relationship FROM edges WHERE target_id = ?")
        .all(id) as Array<Record<string, unknown>>;
    const edgesOut = (id: string) =>
      db
        .prepare("SELECT target_id, relationship FROM edges WHERE source_id = ?")
        .all(id) as Array<Record<string, unknown>>;

    if (trimmed.includes("#")) {
      const match = db
        .prepare("SELECT id, file_path FROM nodes WHERE id = ?")
        .get(trimmed) as { id?: string; file_path?: string } | undefined;
      if (!match?.id) {
        return { matches: [], note: `No symbol found for ${trimmed}.` };
      }
      return {
        match: {
          id: match.id,
          file: match.file_path ?? match.id.split("#")[0],
          type: match.id.includes("#") ? "symbol" : "file"
        },
        edges_in: edgesIn(match.id),
        edges_out: edgesOut(match.id)
      };
    }

    const likePattern = `%#${trimmed}`;
    const matches = db
      .prepare("SELECT id, file_path FROM nodes WHERE id LIKE ? AND type = 'symbol'")
      .all(likePattern) as Array<{ id: string; file_path?: string }>;

    if (matches.length === 1) {
      const match = matches[0];
      return {
        match: {
          id: match.id,
          file: match.file_path ?? match.id.split("#")[0],
          type: "symbol"
        },
        edges_in: edgesIn(match.id),
        edges_out: edgesOut(match.id)
      };
    }

    if (matches.length > 1) {
      return {
        matches: matches.map(item => ({
          id: item.id,
          file: item.file_path ?? item.id.split("#")[0]
        })),
        note: `Multiple symbols named '${trimmed}'. Specify the file-qualified ID.`
      };
    }

    const fileId = normalizePath(trimmed);
    const fileMatch = db
      .prepare("SELECT id, file_path FROM nodes WHERE id = ? AND type = 'file'")
      .get(fileId) as { id?: string; file_path?: string } | undefined;
    if (fileMatch?.id) {
      return {
        match: {
          id: fileMatch.id,
          file: fileMatch.file_path ?? fileMatch.id,
          type: "file"
        },
        edges_in: edgesIn(fileMatch.id),
        edges_out: edgesOut(fileMatch.id)
      };
    }

    return {
      matches: [],
      note: `No symbol found for '${trimmed}'. Provide a file-qualified ID like "path/to/file.ts#symbol".`
    };
  } catch (error) {
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    } catch {
      // best-effort cleanup
    }
    return { matches: [], note: "Graph database corrupted. Run 'npm run health' to rebuild." };
  } finally {
    cortexDb.close();
  }
}

function handleBriefing(): { text: string; warning?: string } {
  const agentContextPath = path.join(cortexRoot, "outputs", "AGENT_CONTEXT.md");

  if (!fs.existsSync(agentContextPath)) {
    return {
      text: "",
      warning: "AGENT_CONTEXT.md not found. Run 'npm run health' first."
    };
  }

  try {
    const content = fs.readFileSync(agentContextPath, "utf-8");

    // Check staleness - look for "Generated:" timestamp
    const generatedMatch = content.match(/Generated:\s*(.+)/);
    let warning: string | undefined;

    if (generatedMatch) {
      const generatedDate = new Date(generatedMatch[1]);
      const now = new Date();
      const hoursOld = (now.getTime() - generatedDate.getTime()) / (1000 * 60 * 60);

      if (hoursOld > 24) {
        const daysOld = Math.floor(hoursOld / 24);
        warning = `⚠️ Context is ${daysOld} day${daysOld > 1 ? 's' : ''} old — run 'npm run health' to refresh.`;
      }
    }

    return { text: content, warning };
  } catch (error) {
    return {
      text: "",
      warning: `Failed to read AGENT_CONTEXT.md: ${error}`
    };
  }
}

interface SearchResult {
  name: string;
  file: string;
  kind: string;
  signature?: string;
  doc?: string;
}

function handleSearch(query: string, limit: number): { results: SearchResult[]; warning?: string } {
  const searchDbPath = path.join(cortexRoot, "outputs", "search.db");

  if (!fs.existsSync(searchDbPath)) {
    return {
      results: [],
      warning: "Search index not built. Run 'npm run health' first."
    };
  }

  try {
    // Use the existing SkeletonSearch class
    const { SkeletonSearch } = require("../scanner/skeleton-search");
    const searcher = new SkeletonSearch(searchDbPath);
    const results = searcher.search(query, limit);
    searcher.close();

    return { results };
  } catch (error) {
    return {
      results: [],
      warning: `Search failed: ${error}`
    };
  }
}

export async function startServer(): Promise<void> {
  const server = new Server(
    { name: "cortex-mcp-server", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "cortex_impact",
        description: "Return the dependency blast radius for file changes.",
        inputSchema: {
          type: "object",
          properties: {
            files: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["files"]
        }
      },
      {
        name: "cortex_query",
        description: "Find symbol usage and dependencies with suffix matching.",
        inputSchema: {
          type: "object",
          properties: {
            symbol: { type: "string" }
          },
          required: ["symbol"]
        }
      },
      {
        name: "cortex_fragility",
        description: "Check fragility index and change history for specific files.",
        inputSchema: {
          type: "object",
          properties: {
            files: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["files"]
        }
      },
      {
        name: "cortex_plan",
        description: "Classify change tier and suggest protocol before edits.",
        inputSchema: {
          type: "object",
          properties: {
            files: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["files"]
        }
      },
      {
        name: "cortex_verify",
        description: "Run verification, log changes, and update fragility after edits.",
        inputSchema: {
          type: "object",
          properties: {
            files: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["files"]
        }
      },
      {
        name: "cortex_briefing",
        description: "Read AGENT_CONTEXT.md for session context. Includes staleness warning if >24h old.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "cortex_search",
        description: "Search code symbols using SQLite FTS5 index. Returns exact + prefix matches.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            limit: { type: "number" }
          },
          required: ["query"]
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const name = request.params.name;
    const args = request.params.arguments as Record<string, unknown> | undefined;

    if (name === "cortex_impact") {
      const files = Array.isArray(args?.files)
        ? (args?.files as string[]).filter(Boolean)
        : [];
      const result = await handleImpact(files);
      return toJsonContent(result);
    }

    if (name === "cortex_query") {
      const symbol = typeof args?.symbol === "string" ? args.symbol : "";
      const result = handleQuery(symbol);
      return toJsonContent(result);
    }

    if (name === "cortex_fragility") {
      const files = Array.isArray(args?.files)
        ? (args?.files as string[]).filter(Boolean)
        : [];
      const opened = openDatabase();
      if ("warning" in opened) {
        return toJsonContent({ warning: opened.warning, data: null });
      }
      const { db, cortexDb } = opened;
      try {
        if (isGraphEmpty(db)) {
          return toJsonContent({ warning: EMPTY_GRAPH_WARNING, data: null });
        }
        const result = getFragilityReport(db, files);
        return toJsonContent(result);
      } finally {
        cortexDb.close();
      }
    }

    if (name === "cortex_plan") {
      const files = Array.isArray(args?.files)
        ? (args?.files as string[]).filter(Boolean)
        : [];
      const result = handlePlan(files);
      return toJsonContent(result);
    }

    if (name === "cortex_verify") {
      const files = Array.isArray(args?.files)
        ? (args?.files as string[]).filter(Boolean)
        : [];
      const result = handleVerify(files);
      return toJsonContent(result);
    }

    if (name === "cortex_briefing") {
      const result = handleBriefing();
      return toJsonContent(result);
    }

    if (name === "cortex_search") {
      const query = typeof args?.query === "string" ? args.query : "";
      const limit = typeof args?.limit === "number" ? args.limit : 10;
      const result = handleSearch(query, limit);
      return toJsonContent(result);
    }

    return toJsonContent({ warning: `Unknown tool: ${name}` });
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`cortex-mcp-server started (session ${sessionId})`);
}
