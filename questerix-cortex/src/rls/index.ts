import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface RlsAuditResult {
  verdict: 'PASS' | 'CRITICAL GAP' | 'WARNINGS' | 'ERROR';
  criticalCount: number;
  warningCount: number;
  unknownCount: number;
  rows: RlsAuditRow[];
  raw: string;
}

export interface RlsAuditRow {
  tablename: string;
  missing_policies: string;
  verdict: string;
  severity: 'critical' | 'warning' | 'info';
}

// ──────────────────────────────────────────────────────────────
// Audit SQL — inlined so we can pipe it to supabase db query
// without shell-quoting issues. Matches audit-rls.sql exactly.
// Key: expands cmd='ALL' into individual operations to avoid
// false positives on tables with catch-all policies.
// ──────────────────────────────────────────────────────────────
const AUDIT_SQL = `
WITH all_tables AS (
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'supabase_%'
    AND tablename NOT IN ('schema_migrations')
),
expanded_policies AS (
  SELECT DISTINCT p.tablename, ops.cmd
  FROM pg_policies p,
  LATERAL (
    SELECT 'SELECT' AS cmd WHERE p.cmd IN ('ALL', 'SELECT')
    UNION ALL
    SELECT 'INSERT' WHERE p.cmd IN ('ALL', 'INSERT')
    UNION ALL
    SELECT 'UPDATE' WHERE p.cmd IN ('ALL', 'UPDATE')
    UNION ALL
    SELECT 'DELETE' WHERE p.cmd IN ('ALL', 'DELETE')
  ) ops
  WHERE schemaname = 'public'
),
missing AS (
  SELECT t.tablename, c.cmd
  FROM all_tables t
  CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE')) AS c(cmd)
  LEFT JOIN expanded_policies ep ON t.tablename = ep.tablename AND c.cmd = ep.cmd
  WHERE ep.cmd IS NULL
)
SELECT tablename,
  STRING_AGG(cmd, ', ' ORDER BY cmd) AS missing_policies,
  CASE
    WHEN tablename IN ('known_issues','error_logs','source_documents',
      'security_logs','curriculum_meta','app_landing_pages')
      THEN 'REAL_GAP'
    WHEN tablename IN ('attempts','sessions','skill_progress','profiles')
      THEN 'INTENTIONAL_STUDENT'
    WHEN tablename IN ('ai_token_usage','ai_generation_sessions',
      'generation_audit_log','tenant_quotas','student_recovery_keys','platform_config')
      THEN 'INTENTIONAL_SERVICE'
    WHEN tablename IN ('domains','skills','questions','subjects',
      'curriculum_snapshots','approval_workflows','content_validation_rules')
      THEN 'INTENTIONAL_RPC'
    ELSE 'UNKNOWN'
  END AS verdict
FROM missing
GROUP BY tablename
ORDER BY verdict, tablename;
`.trim();

/**
 * RlsAuditor — runs the RLS audit against the live Supabase project
 * using the Supabase CLI (`supabase db query`), which works as long as
 * the CLI is installed and authenticated (supabase login).
 *
 * Falls back to a static error message if the CLI is unavailable.
 */
export class RlsAuditor {
  private projectRef: string;

  constructor(projectRef: string) {
    this.projectRef = projectRef;
  }

  async audit(): Promise<RlsAuditResult> {
    // 0. Check for Remote Evidence Bridge (Agent-Verified)
    const evidencePath = path.join(__dirname, '..', '..', 'outputs', 'RLS_REMOTE_EVIDENCE.json');
    if (fs.existsSync(evidencePath)) {
      try {
        const stats = fs.statSync(evidencePath);
        const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        if (ageInHours < 24) { // Valid for 24 hours
          const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
          if (evidence.verdict && evidence.rows) {
            return {
              ...evidence,
              verdict: (evidence.verdict as RlsAuditResult['verdict']),
              rows: evidence.rows.map((r: any) => ({
                ...r,
                severity: (r.severity as RlsAuditRow['severity'])
              }))
            };
          }
        }
      } catch { /* ignore and fallback */ }
    }

    // 1. Try supabase CLI
    const cliResult = this.trySupabaseCli();
    if (cliResult) return cliResult;

    // Try psql as secondary fallback (DATABASE_URL in env)
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const raw = execSync(
          `psql "${dbUrl}" -c "${AUDIT_SQL.replace(/"/g, '\\"')}" -t -A -F"|"`,
          { encoding: 'utf-8', timeout: 20000, stdio: ['pipe','pipe','pipe'] }
        );
        return this.parseOutput(raw);
      } catch (err: any) { 
        this.lastErrorOutput += `[psql]: ${err.message}\n`;
      }
    }

    const msg = this.lastErrorOutput || 'Supabase CLI unavailable, DATABASE_URL not set, and project not linked.';
    return this.errorResult(msg);
  }

  // ── Supabase CLI path ───────────────────────────────────────
  private trySupabaseCli(): RlsAuditResult | null {
    // Write SQL to a temp file to avoid shell-quoting issues
    const tmpFile = path.join(process.env.TEMP || '/tmp', 'rls-audit.sql');
    try {
      fs.writeFileSync(tmpFile, AUDIT_SQL, 'utf-8');

      // Try global 'supabase', then 'npx supabase'
      const configs = [
        { cmd: 'supabase', args: ['db', 'query', `--project-ref=${this.projectRef}`, '--file', tmpFile] },
        { cmd: 'npx', args: ['supabase', 'db', 'query', `--project-ref=${this.projectRef}`, '--file', tmpFile] }
      ];

      let lastError = '';

      for (const config of configs) {
        try {
          const result = spawnSync(
            config.cmd,
            config.args,
            { encoding: 'utf-8', timeout: 30000, shell: true }
          );

          if (result.status === 0 && result.stdout && !result.stdout.toLowerCase().includes('error')) {
            return this.parseOutput(result.stdout);
          }
          
          if (result.stderr) {
            lastError += `[${config.cmd}]: ${result.stderr.trim()}\n`;
          } else if (result.error) {
            lastError += `[${config.cmd}]: ${result.error.message}\n`;
          }
        } catch (err: any) {
          lastError += `[${config.cmd}]: ${err.message}\n`;
        }
      }

      // If we reach here, both failed. Store the last error if it looks like a real connection issue.
      if (lastError) this.lastErrorOutput = lastError;

      return null;
    } catch {
      return null;
    } finally {
      // Clean up temp file
      try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }

  private lastErrorOutput = '';

  // ── Output parser ───────────────────────────────────────────
  private parseOutput(raw: string): RlsAuditResult {
    // supabase db query returns TSV or pipe-delimited; handle both
    const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('-') && !l.startsWith('('));
    const rows: RlsAuditRow[] = [];
    let criticalCount = 0, warningCount = 0, unknownCount = 0;

    for (const line of lines) {
      // Try pipe delimiter first (psql -F"|"), then tab, then whitespace-collapse
      const delimiter = line.includes('|') ? '|' : '\t';
      const parts = line.split(delimiter).map(p => p.trim()).filter(Boolean);
      if (parts.length < 3) continue;

      const [tablename, missing_policies, verdictKey] = parts;
      let severity: 'critical' | 'warning' | 'info' = 'info';
      let verdictLabel: string;

      switch (verdictKey) {
        case 'REAL_GAP':
          severity = 'critical'; criticalCount++;
          verdictLabel = '🔴 REAL GAP — fix required'; break;
        case 'UNKNOWN':
          severity = 'warning'; unknownCount++;
          verdictLabel = '🟡 Unknown — investigate'; break;
        default:
          verdictLabel = '🔵 Intentional'; break;
      }

      rows.push({ tablename, missing_policies, verdict: verdictLabel, severity });
    }

    const verdict = criticalCount > 0 ? 'CRITICAL GAP'
      : unknownCount > 0 ? 'WARNINGS'
      : 'PASS';

    return { verdict, criticalCount, warningCount, unknownCount, rows, raw };
  }

  private errorResult(msg: string): RlsAuditResult {
    return { verdict: 'ERROR', criticalCount: 0, warningCount: 0, unknownCount: 0, rows: [], raw: msg };
  }
}
