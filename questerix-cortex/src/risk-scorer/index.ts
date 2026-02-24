import { TaskResult } from '../orchestrator';

export interface RiskScore {
  composite: number;
  confidence: number;
  dimensions: {
    smokeGate: { score: number; weight: number; status: 'passed' | 'failed' | 'incomplete' };
    deepTests: { score: number; weight: number; status: 'passed' | 'failed' | 'incomplete' };
    typeSafety: { score: number; weight: number; status: 'passed' | 'failed' | 'incomplete' };
    schemaIntegrity: { score: number; weight: number; status: 'passed' | 'failed' | 'incomplete' };
    securityPosture: { score: number; weight: number; status: 'passed' | 'failed' | 'incomplete' };
    coverageTrajectory: { score: number; weight: number; status: 'passed' | 'failed' | 'incomplete' };
  };
}

export interface DriftResult {
  verdict: 'CLEAN' | 'DRIFT DETECTED' | 'WARN (extra in types)';
  typesTableCount: number;
  missingFromTypes: string[];
  extraInTypes: string[];
  staleDays: number | null;
}

export interface RlsAuditResult {
  verdict: 'PASS' | 'CRITICAL GAP' | 'WARNINGS' | 'ERROR';
  criticalCount: number;
  warningCount: number;
  rows: any[];
}

export interface ForensicResult {
  criticalCount: number;
  warningCount: number;
  findings: Array<{
    id: string;
    type: string;
    severity: 'CRITICAL' | 'WARNING';
    file: string;
    message: string;
  }>;
}

export class RiskScorer {
  /**
   * Calculate composite risk score from multiple dimensions
   */
  calculateScore(
    results: Record<string, TaskResult>,
    driftResult?: DriftResult,
    rlsResult?: RlsAuditResult,
    forensicResult?: ForensicResult,
    previousGapCount?: number,
    currentGapCount?: number
  ): RiskScore {
    const dimensions = {
      smokeGate: this.scoreSmokeGate(results),
      deepTests: this.scoreDeepTests(results),
      typeSafety: this.scoreTypeSafety(results),
      schemaIntegrity: this.scoreSchemaIntegrity(driftResult, rlsResult),
      securityPosture: this.scoreSecurityPosture(forensicResult),
      coverageTrajectory: this.scoreCoverageTrajectory(previousGapCount, currentGapCount)
    };

    // Calculate composite score (weighted average)
    let totalWeight = 0;
    let weightedScore = 0;
    let scoredDimensions = 0;

    for (const [key, dim] of Object.entries(dimensions)) {
      if (dim.status !== 'incomplete') {
        weightedScore += dim.score * dim.weight;
        totalWeight += dim.weight;
        scoredDimensions++;
      }
    }

    const composite = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    const confidence = (scoredDimensions / 6) * 100; // 6 total dimensions

    return {
      composite,
      confidence: Math.round(confidence),
      dimensions
    };
  }

  /**
   * Score smoke gate (unit + e2e + lint)
   */
  private scoreSmokeGate(results: Record<string, TaskResult>) {
    const smokeNames = ['unit tests (lib)', 'e2e smoke (desktop)', 'lint check'];
    const smokeResults = smokeNames
      .map(name => Object.values(results).find(r => r && r.name.toLowerCase() === name))
      .filter((r): r is TaskResult => r !== undefined);

    if (smokeResults.length === 0) {
      return { score: 0, weight: 25, status: 'incomplete' as const };
    }

    const passed = smokeResults.filter(r => r.status === 'passed').length;
    const score = Math.round((passed / smokeResults.length) * 100);
    const status = score === 100 ? 'passed' : 'failed';

    return { score, weight: 25, status: status as 'passed' | 'failed' };
  }

  /**
   * Score deep tests (full vitest + full playwright)
   */
  private scoreDeepTests(results: Record<string, TaskResult>) {
    const deepNames = ['full vitest + coverage', 'full playwright suite'];
    const deepResults = deepNames
      .map(name => Object.values(results).find(r => r && r.name.toLowerCase() === name))
      .filter((r): r is TaskResult => r !== undefined);

    if (deepResults.length === 0) {
      return { score: 0, weight: 20, status: 'incomplete' as const };
    }

    const passed = deepResults.filter(r => r.status === 'passed').length;
    const score = Math.round((passed / deepResults.length) * 100);
    const status = score === 100 ? 'passed' : 'failed';

    return { score, weight: 20, status: status as 'passed' | 'failed' };
  }

  /**
   * Score type safety (tsc errors)
   */
  private scoreTypeSafety(results: Record<string, TaskResult>) {
    const tscResult = Object.values(results).find(r => r.name.toLowerCase() === 'typescript strict');

    if (!tscResult) {
      return { score: 0, weight: 15, status: 'incomplete' as const };
    }

    if (tscResult.status === 'passed') {
      return { score: 100, weight: 15, status: 'passed' as const };
    }

    // Extract error count from output (rough heuristic)
    const errorCount = (tscResult.output?.match(/error/gi) || []).length;
    const score = Math.max(0, 100 - (errorCount * 2)); // 2 points per error, minimum 0
    const status = score >= 80 ? 'passed' : 'failed';

    return { score, weight: 15, status: status as 'passed' | 'failed' };
  }

  /**
   * Score schema integrity (drift + RLS)
   */
  private scoreSchemaIntegrity(driftResult?: DriftResult, rlsResult?: RlsAuditResult) {
    if (!driftResult && !rlsResult) {
      return { score: 0, weight: 15, status: 'incomplete' as const };
    }

    let score = 100;

    // Penalize drift
    if (driftResult) {
      if (driftResult.verdict === 'DRIFT DETECTED') {
        score -= 50;
      } else if (driftResult.verdict.startsWith('WARN')) {
        score -= 25;
      }
      
      // Penalize stale types
      if (driftResult.staleDays && driftResult.staleDays > 7) {
        score -= 10;
      }
    }

    // Penalize RLS issues
    if (rlsResult) {
      if (rlsResult.verdict === 'ERROR' || rlsResult.criticalCount > 0) {
        score -= 40;
      } else if (rlsResult.warningCount > 0) {
        score -= 20;
      }
    }

    const status = score >= 80 ? 'passed' : 'failed';
    return { score: Math.max(0, score), weight: 15, status: status as 'passed' | 'failed' };
  }

  /**
   * Score security posture (forensic findings)
   */
  private scoreSecurityPosture(forensicResult?: ForensicResult) {
    if (!forensicResult) {
      return { score: 0, weight: 15, status: 'incomplete' as const };
    }

    let score = 100;

    // Penalize critical findings heavily
    score -= forensicResult.criticalCount * 30;
    
    // Penalize warnings moderately
    score -= forensicResult.warningCount * 10;

    const status = score >= 80 ? 'passed' : 'failed';
    return { score: Math.max(0, score), weight: 15, status: status as 'passed' | 'failed' };
  }

  /**
   * Score coverage trajectory (gap change over time)
   */
  private scoreCoverageTrajectory(previousGapCount?: number, currentGapCount?: number) {
    if (previousGapCount === undefined || currentGapCount === undefined) {
      return { score: 0, weight: 10, status: 'incomplete' as const };
    }

    const gapDelta = currentGapCount - previousGapCount;
    
    if (gapDelta > 5) {
      return { score: 20, weight: 10, status: 'failed' as const }; // Many new gaps
    } else if (gapDelta > 0) {
      return { score: 60, weight: 10, status: 'failed' as const }; // Some new gaps
    } else if (gapDelta < -5) {
      return { score: 100, weight: 10, status: 'passed' as const }; // Many gaps resolved
    } else if (gapDelta < 0) {
      return { score: 85, weight: 10, status: 'passed' as const }; // Some gaps resolved
    } else {
      return { score: 75, weight: 10, status: 'passed' as const }; // No change
    }
  }
}
