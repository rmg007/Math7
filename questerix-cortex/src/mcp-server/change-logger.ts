import Database from "better-sqlite3";
import { normalizePath } from "../utils/normalize-path";

export interface ChangeLogDetails {
  failures?: Array<{
    file?: string;
    message?: string;
  }>;
  tsc?: {
    passed: boolean;
    errorCount?: number;
  };
}

export function logChange(
  db: Database.Database,
  filePath: string,
  sessionId: string,
  testsPassed: number,
  testsFailed: number,
  failureDetails: ChangeLogDetails
): void {
  db.prepare(
    `
    INSERT INTO change_log (file_path, timestamp, session_id, tests_passed, tests_failed, failure_details)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(
    normalizePath(filePath),
    new Date().toISOString(),
    sessionId,
    testsPassed,
    testsFailed,
    JSON.stringify(failureDetails)
  );
}
