import Database from "better-sqlite3";
import { normalizePath } from "../../utils/normalize-path";

export type FragilityConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface FragilityRecord {
  file: string;
  fragility_index: number;
  change_count: number;
  failure_count: number;
  confidence: FragilityConfidence;
  last_failure: string | null;
  common_failure_pattern: string | null;
}

export interface FragilityResponse {
  files: FragilityRecord[];
  warnings: string[];
}

const WARNING_THRESHOLD = 0.3;
const MIN_CHANGE_COUNT = 5;

export function getFragilityReport(
  db: Database.Database,
  inputFiles: string[]
): FragilityResponse {
  const records: FragilityRecord[] = [];
  const warnings: string[] = [];
  const selectFragility = db.prepare(
    `
      SELECT file_path, fragility_index, change_count, failure_count, confidence, last_failure, common_failure_pattern
      FROM fragility
      WHERE file_path = ?
    `
  );

  for (const rawFile of inputFiles) {
    const file = normalizePath(rawFile);
    const row = selectFragility.get(file) as
      | {
          file_path: string;
          fragility_index: number;
          change_count: number;
          failure_count: number;
          confidence: FragilityConfidence;
          last_failure: string | null;
          common_failure_pattern: string | null;
        }
      | undefined;

    const record: FragilityRecord = {
      file,
      fragility_index: row?.fragility_index ?? 0,
      change_count: row?.change_count ?? 0,
      failure_count: row?.failure_count ?? 0,
      confidence: row?.confidence ?? "LOW",
      last_failure: row?.last_failure ?? null,
      common_failure_pattern: row?.common_failure_pattern ?? null
    };

    records.push(record);

    if (!row) {
      warnings.push(`${record.file} not found in graph.`);
      continue;
    }

    if (record.fragility_index > WARNING_THRESHOLD && record.change_count >= MIN_CHANGE_COUNT) {
      warnings.push(
        `${record.file} has ${record.confidence} fragility (${record.fragility_index.toFixed(2)}) — consider extra test coverage`
      );
    }
  }

  return { files: records, warnings };
}
