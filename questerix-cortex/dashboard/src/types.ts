export interface TestResults {
  name: string;
  status: "running" | "passed" | "failed";
  output: string;
  duration?: number;
}

export interface SurfaceMap {
  hooks: Array<{
    name: string;
    file: string;
    hasTest: boolean;
    functions: string[];
  }>;
  pages: Array<{
    name: string;
    file: string;
    hasTest: boolean;
    routes: string[];
  }>;
  gaps: string[];
}

export interface AnalystResults {
  deadCode: string[];
  bundleSize: number | null;
}

export interface HistoryRecord {
  date: string;
  score: number;
  coverage: number;
  failures: number;
}

export interface DriftResult {
  verdict: string;
  typesTableCount: number;
  missingFromTypes: string[];
  extraInTypes: string[];
}

export interface RlsAuditResult {
  verdict: string;
  criticalCount: number;
}

export interface LogItem {
  text: string;
  color?: "cyan" | "green" | "red" | "gray";
  bold?: boolean;
}

// ── Verify Deploy types ────────────────────────────────────────────────────────

export type SmokeCategoryId =
  | "Infrastructure"
  | "Authentication"
  | "Multi-Tenancy"
  | "Supabase Connectivity"
  | "Admin Data Render";

export interface SmokeCheckResult {
  category: SmokeCategoryId;
  name: string;
  passed: boolean;
  detail?: string;
  durationMs?: number;
}

export interface VerifyDeployResult {
  targetUrl: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  checks: SmokeCheckResult[];
  rawOutput?: string;
  error?: string;
}

export interface VerifyDeployHistory {
  id: string;
  targetUrl: string;
  timestamp: string;
  passed: boolean;
  passedChecks: number;
  totalChecks: number;
  durationMs: number;
}

export interface VerifyDeployProgressPayload {
  targetUrl: string;
  status: "running" | "passed" | "failed";
  checks: SmokeCheckResult[];
  latestCheck?: SmokeCheckResult;
  message?: string;
  startTime: string;
}

export interface VerifyDeployCompletePayload {
  result: VerifyDeployResult;
  history: VerifyDeployHistory[];
}
