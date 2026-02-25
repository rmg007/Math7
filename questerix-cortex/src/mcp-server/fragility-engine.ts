import Database from "better-sqlite3";
import { normalizePath } from "../utils/normalize-path";

export type FragilityConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface TestFailureDetail {
  file: string;
  message?: string;
}

export interface VerificationSummary {
  tsc: { passed: boolean; output?: string; errorCount?: number };
  unitTests: { passed: number; failed: number; details: TestFailureDetail[] };
  e2eTests: { passed: number; failed: number; details: TestFailureDetail[] };
  changedFiles: string[];
}

function getDependencyClosure(db: Database.Database, startFile: string): Set<string> {
  const visited = new Set<string>();
  const queue = [startFile];
  const edgeQuery = db.prepare(
    "SELECT target_id FROM edges WHERE source_id = ? AND relationship IN ('imports', 'tests')"
  );

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const rows = edgeQuery.all(current) as Array<{ target_id: string }>;
    for (const row of rows) {
      if (!visited.has(row.target_id)) {
        queue.push(row.target_id);
      }
    }
  }

  return visited;
}

function computeFragilityIndex(db: Database.Database, filePath: string): number {
  const rows = db.prepare(
    `
      SELECT tests_failed
      FROM change_log
      WHERE file_path = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `
  ).all(filePath) as Array<{ tests_failed: number | null }>;

  if (rows.length === 0) return 0;
  const failures = rows.filter(row => (row.tests_failed ?? 0) > 0).length;
  return failures / rows.length;
}

function resolveConfidence(changeCount: number): FragilityConfidence {
  if (changeCount >= 10) return "HIGH";
  if (changeCount >= 5) return "MEDIUM";
  return "LOW";
}

export function attributeFragility(
  db: Database.Database,
  changedFiles: string[],
  testResults: VerificationSummary,
  _sessionId: string
): void {
  const normalizedChanges = Array.from(new Set(changedFiles.map(file => normalizePath(file))));
  const anyFailures = testResults.unitTests.failed > 0 || testResults.e2eTests.failed > 0;
  const failureDetails = [
    ...testResults.unitTests.details,
    ...testResults.e2eTests.details
  ];

  const dependencyMap = new Map<string, Set<string>>();
  if (anyFailures) {
    for (const detail of failureDetails) {
      const testFile = normalizePath(detail.file);
      dependencyMap.set(testFile, getDependencyClosure(db, testFile));
    }
  }

  const selectFragility = db.prepare(
    "SELECT change_count, failure_count, last_failure, common_failure_pattern FROM fragility WHERE file_path = ?"
  );
  const upsertFragility = db.prepare(
    `
      INSERT INTO fragility (
        file_path,
        change_count,
        failure_count,
        fragility_index,
        last_failure,
        common_failure_pattern,
        confidence
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET
        change_count = excluded.change_count,
        failure_count = excluded.failure_count,
        fragility_index = excluded.fragility_index,
        last_failure = excluded.last_failure,
        common_failure_pattern = excluded.common_failure_pattern,
        confidence = excluded.confidence
    `
  );

  const now = new Date().toISOString();
  const latestFailureMessage = failureDetails.length > 0
    ? failureDetails[failureDetails.length - 1].message
    : undefined;

  for (const file of normalizedChanges) {
    const existing = selectFragility.get(file) as
      | { change_count: number; failure_count: number; last_failure: string | null; common_failure_pattern: string | null }
      | undefined;

    const currentChangeCount = (existing?.change_count ?? 0) + 1;
    let currentFailureCount = existing?.failure_count ?? 0;
    let lastFailure = existing?.last_failure ?? null;
    let commonPattern = existing?.common_failure_pattern ?? null;

    if (anyFailures) {
      for (const [testFile, dependencies] of dependencyMap.entries()) {
        if (dependencies.has(file)) {
          currentFailureCount += 1;
          lastFailure = now;
          commonPattern = latestFailureMessage ?? commonPattern;
          break;
        }
      }
    }

    const fragilityIndex = computeFragilityIndex(db, file);
    const confidence = resolveConfidence(currentChangeCount);

    upsertFragility.run(
      file,
      currentChangeCount,
      currentFailureCount,
      fragilityIndex,
      lastFailure,
      commonPattern,
      confidence
    );
  }
}
