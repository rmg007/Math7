import Database from 'better-sqlite3';
import { SkeletonFile, SkeletonReport } from './index';

export interface SearchResult {
  file: string;
  name: string;
  kind: string;
  signature: string;
  doc: string;
  score: number;
}

export class SkeletonSearch {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema() {
    // Create the FTS5 table
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS symbols_fts USING fts5(
        file,
        name,
        kind,
        signature,
        doc,
        tokenize='porter unicode61'
      );

      CREATE TABLE IF NOT EXISTS symbols_meta (
        name TEXT,
        file TEXT,
        kind TEXT,
        signature TEXT,
        doc TEXT,
        PRIMARY KEY (name, file)
      );
    `);
  }

  index(report: SkeletonReport) {
    // Clear existing data
    this.db.prepare('DELETE FROM symbols_fts').run();
    this.db.prepare('DELETE FROM symbols_meta').run();

    const insertFts = this.db.prepare(
      'INSERT INTO symbols_fts (file, name, kind, signature, doc) VALUES (?, ?, ?, ?, ?)'
    );
    const insertMeta = this.db.prepare(
      'INSERT OR REPLACE INTO symbols_meta (name, file, kind, signature, doc) VALUES (?, ?, ?, ?, ?)'
    );

    const transaction = this.db.transaction((files: SkeletonFile[]) => {
      for (const file of files) {
        for (const exp of file.exports) {
          insertFts.run(file.file, exp.name, exp.kind, exp.signature, exp.doc || '');
          insertMeta.run(exp.name, file.file, exp.kind, exp.signature, exp.doc || '');
        }
      }
    });

    transaction(report.files);
  }

  search(query: string, limit: number = 8): SearchResult[] {
    // Escape double quotes to prevent FTS5 syntax errors
    const sanitizedQuery = query.replace(/"/g, ' ');

    // 1. Try exact name match first (highest priority)
    // We search symbols_meta which handles collisions via composite keys
    const exacts = this.db.prepare('SELECT * FROM symbols_meta WHERE name = ?').all(query) as any[];
    if (exacts.length > 0) {
      return exacts.map(e => ({
        file: e.file,
        name: e.name,
        kind: e.kind,
        signature: e.signature,
        doc: e.doc,
        score: 100
      }));
    }

    // 2. Fallback to FTS5
    // Use prefix match for the query
    const ftsQuery = `"${sanitizedQuery}" *`;
    const results = this.db.prepare(`
      SELECT *, rank FROM symbols_fts 
      WHERE symbols_fts MATCH ? 
      ORDER BY rank 
      LIMIT ?
    `).all(ftsQuery, limit) as any[];

    return results.map(r => ({
      file: r.file,
      name: r.name,
      kind: r.kind,
      signature: r.signature,
      doc: r.doc,
      score: Math.round(Math.abs(r.rank)) // Rough score
    }));
  }

  close() {
    this.db.close();
  }
}
