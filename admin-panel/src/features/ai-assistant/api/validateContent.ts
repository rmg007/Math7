import { getMetaEnv, isDevMode } from '@/config/env';
import { supabase } from '@/lib/supabase';

interface ValidationRule {
  name: string;
  rule_type: string;
  params: Record<string, unknown>;
}

interface QuestionData {
  id?: number;
  question?: string;
  options?: unknown[];
  correct_answer?: unknown;
  [key: string]: unknown;
}

interface ValidationRequest {
  questions: QuestionData[];
  source_text: string;
  subject_type?: 'math' | 'english' | 'general';
  rules?: ValidationRule[];
}

export interface ValidationResponse {
  overall_score: number;
  status: 'approved' | 'flagged' | 'rejected';
  consensus_reached: boolean;
  findings: Array<{
    question_id: number;
    score: number;
    issues: string[];
    suggestions: string;
  }>;
  summary: string;
  metadata: {
    model: string;
    validation_time_ms: number;
    token_count?: number;
  };
}

const WORKERS_URL = getMetaEnv('VITE_WORKERS_URL') as string | undefined;
const EFFECTIVE_WORKERS_URL = isDevMode() ? '/api/workers' : WORKERS_URL;

export async function validateContent(request: ValidationRequest): Promise<ValidationResponse> {
  if (!WORKERS_URL) {
    throw new Error('Cloudflare Workers AI (VITE_WORKERS_URL) is not configured');
  }
  return validateViaWorkers(request);
}

async function validateViaWorkers(request: ValidationRequest): Promise<ValidationResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${EFFECTIVE_WORKERS_URL}/ai/validate-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { error?: string }).error || `Workers AI error: ${response.status}`
    );
  }

  return response.json() as Promise<ValidationResponse>;
}
