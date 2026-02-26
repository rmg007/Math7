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
