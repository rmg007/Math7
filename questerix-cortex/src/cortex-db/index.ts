import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

export class CortexDB {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("busy_timeout = 5000");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id          TEXT PRIMARY KEY,
        type        TEXT NOT NULL,
        file_path   TEXT,
        metadata    TEXT,
        updated_at  TEXT
      );

      CREATE TABLE IF NOT EXISTS edges (
        source_id       TEXT NOT NULL,
        target_id       TEXT NOT NULL,
        relationship    TEXT NOT NULL,
        metadata        TEXT,
        UNIQUE(source_id, target_id, relationship)
      );

      CREATE TABLE IF NOT EXISTS change_log (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path       TEXT NOT NULL,
        timestamp       TEXT NOT NULL,
        session_id      TEXT,
        tests_passed    INTEGER,
        tests_failed    INTEGER,
        failure_details TEXT
      );

      CREATE TABLE IF NOT EXISTS fragility (
        file_path               TEXT PRIMARY KEY,
        change_count            INTEGER DEFAULT 0,
        failure_count           INTEGER DEFAULT 0,
        fragility_index         REAL DEFAULT 0.0,
        last_failure            TEXT,
        common_failure_pattern  TEXT,
        confidence              TEXT DEFAULT 'LOW'
      );

      CREATE TABLE IF NOT EXISTS scan_meta (
        key     TEXT PRIMARY KEY,
        value   TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_calls (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp   TEXT NOT NULL,
        session_id  TEXT NOT NULL,
        tool_name   TEXT NOT NULL,
        parameters  TEXT,
        result_tier TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
      CREATE INDEX IF NOT EXISTS idx_edges_relationship ON edges(relationship);
      CREATE INDEX IF NOT EXISTS idx_changelog_filepath ON change_log(file_path);
      CREATE INDEX IF NOT EXISTS idx_changelog_session ON change_log(session_id);
      CREATE INDEX IF NOT EXISTS idx_toolcalls_session ON tool_calls(session_id);
    `);
  }

  getDb(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
