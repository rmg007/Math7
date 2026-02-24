import * as fs from 'fs';
import * as path from 'path';

export interface DriftResult {
  verdict: 'CLEAN' | 'DRIFT DETECTED' | 'WARN (extra in types)';
  typesTableCount: number;
  missingFromTypes: string[];   // tables in supabase schema not in types file
  extraInTypes: string[];       // tables in types file not backed by real supabase schema  
  staleDays: number | null;     // how many days since types were regenerated
}

/**
 * DriftDetector — parses database.types.ts to extract table names and
 * compares against migration files to surface schema drift.
 * 
 * This is a static, offline check — no live DB connection required.
 * It reads:
 *   1. database.types.ts  → ground truth for what the TS code believes
 *   2. supabase/migrations/ → ground truth for what the DB actually has
 */
export class DriftDetector {
  private typesFilePath: string;
  private migrationsPath: string;

  constructor(adminPanelPath: string, supabasePath: string) {
    this.typesFilePath = path.join(adminPanelPath, 'src', 'lib', 'database.types.ts');
    this.migrationsPath = path.join(supabasePath, 'migrations');
  }

  detect(): DriftResult {
    const typesTableNames = this.extractTypesTableNames();
    const migrationTableNames = this.extractMigrationTableNames();

    const missingFromTypes = [...migrationTableNames].filter(t => !typesTableNames.has(t));
    const extraInTypes = [...typesTableNames].filter(t => !migrationTableNames.has(t));

    const staleDays = this.getTypesStaleness();

    return {
      verdict: missingFromTypes.length > 0
        ? 'DRIFT DETECTED'
        : extraInTypes.length > 0
          ? 'WARN (extra in types)'
          : 'CLEAN',
      typesTableCount: typesTableNames.size,
      missingFromTypes,
      extraInTypes,
      staleDays,
    };
  }

  /**
   * Extracts table names from the Tables: { ... } block in database.types.ts.
   * Looks for the pattern: `  tablename: {` inside the Tables block.
   */
  private extractTypesTableNames(): Set<string> {
    const names = new Set<string>();
    if (!fs.existsSync(this.typesFilePath)) return names;

    const content = fs.readFileSync(this.typesFilePath, 'utf-8');

    // Find the Tables: { block
    const tablesMatch = content.match(/Tables:\s*\{([\s\S]*?)^\s*\};\s*Views:/m)
      || content.match(/Tables:\s*\{([\s\S]*?)^\s*\};/m);

    if (!tablesMatch) return names;

    const tablesBlock = tablesMatch[1];
    // Each table entry looks like: `      tablename: {`
    const tableRegex = /^\s{6}(\w+):\s*\{/gm;
    let match;
    while ((match = tableRegex.exec(tablesBlock)) !== null) {
      names.add(match[1]);
    }

    return names;
  }

  /**
   * Extracts table names from CREATE TABLE statements in all migration files.
   */
  private extractMigrationTableNames(): Set<string> {
    const names = new Set<string>();
    if (!fs.existsSync(this.migrationsPath)) return names;

    const sqlFiles = fs.readdirSync(this.migrationsPath)
      .filter(f => f.endsWith('.sql'))
      .map(f => path.join(this.migrationsPath, f));

    // Track CREATE and DROP to detect intentionally deleted tables
    const dropped = new Set<string>();

    for (const file of sqlFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // CREATE TABLE [IF NOT EXISTS] schema.tablename or tablename
      const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
      let m;
      while ((m = createRe.exec(content)) !== null) {
        names.add(m[1].toLowerCase());
      }

      // DROP TABLE — mark as intentionally removed
      const dropRe = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
      while ((m = dropRe.exec(content)) !== null) {
        dropped.add(m[1].toLowerCase());
      }
    }

    // Exclude dropped tables (they were intentionally removed)
    for (const d of dropped) names.delete(d);

    // Exclude Supabase internals
    const internals = new Set([
      'schema_migrations', 'supabase_migrations', 'pg_stat_statements',
      'buckets', 'objects', 'migrations'
    ]);
    for (const i of internals) names.delete(i);

    return names;
  }

  /**
   * Returns how many days ago database.types.ts was last modified.
   */
  private getTypesStaleness(): number | null {
    if (!fs.existsSync(this.typesFilePath)) return null;
    const stats = fs.statSync(this.typesFilePath);
    const ageMs = Date.now() - stats.mtimeMs;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }
}
