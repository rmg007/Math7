import { DeltaResult } from './delta';
import { DriftResult } from './drift';
import { HistoryRecord } from './historian';
import { OptimizeReport } from './optimizer';
import { TaskResult } from './orchestrator';
import { RiskScore } from './risk-scorer';
import { RlsAuditResult } from './rls';
import { SurfaceMap } from './scanner';


export interface AnalystResults {
  deadCode: string[];
  bundleSize: number | null;
  perfGaps: string[];
  migrationGaps: string[];
  typeSafetyGaps: string[];
}

export interface CortexConfig {
  adminPanelPath: string;
  supabasePath: string;
  supabaseProjectRef: string;
  outputs: {
    healthReport: string;
    agentContext: string;
    nextTask: string;
    history: string;
    surfaceMap: string;
    failureDigest: string;
    lastChanged: string;
    featureMap: string;
    fragilityMatrix: string;
    guardReport: string;
  };
  guard: {
    rules: {
      feature: string;
      forbidden: string[];
      reason?: string;
    }[];
  };
  thresholds: {
    minCoverage: number;
    maxAgentContextSizeKB: number;
    maxHistoryRuns: number;
  };
  dashboardPort: number;
}

export interface SuiteDefinition {
  id: string;
  name: string;
  command: string;
  tier: 'smoke' | 'deep' | 'release';
  parallel: boolean;
}

export interface RunContext {
  results: Record<string, TaskResult>;
  surfaceMap: SurfaceMap;
  analystResults: AnalystResults;
  deltaResult: DeltaResult;
  riskScore: RiskScore;
  driftResult?: DriftResult;
  rlsResult?: RlsAuditResult;
  optimizeResult?: OptimizeReport;
  history: HistoryRecord[];
  smokePass: boolean;
}
