import { TaskResult } from './orchestrator';
import { SurfaceMap } from './scanner';
import { DeltaResult } from './delta';
import { RiskScore } from './risk-scorer';
import { DriftResult } from './drift';
import { RlsAuditResult } from './rls';
import { HistoryRecord } from './historian';

export interface AnalystResults {
  deadCode: string[];
  bundleSize: number | null;
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
    machineBriefing: string;
    failureDigest: string;
    lastChanged: string;
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
  history: HistoryRecord[];
  smokePass: boolean;
}
