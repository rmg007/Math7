import { getMetaEnv } from '@/config/env';
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

export async function validateContent(request: ValidationRequest): Promise<ValidationResponse> {
  // Use Cloudflare Workers AI if configured, fall back to Supabase Edge Functions
  if (WORKERS_URL) {
    return validateViaWorkers(request);
  }
  return validateViaSupabase(request);
}

async function validateViaWorkers(request: ValidationRequest): Promise<ValidationResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${WORKERS_URL}/ai/validate-content`, {
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

async function validateViaSupabase(request: ValidationRequest): Promise<ValidationResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    const { data, error } = await supabase.functions.invoke<ValidationResponse>(
      'validate-content',
      {
        body: request,
        headers: { 'x-timeout': '45000' },
        signal: controller.signal,
      }
    );

    if (error) throw error;
    if (!data) throw new Error('No data returned from validation Edge Function');
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}
