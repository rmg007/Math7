import { getMetaEnv, isDevMode } from '@/config/env';
import { supabase } from '@/lib/supabase';

export interface GenerateQuestionsRequest {
  text: string;
  subject_type?: 'math' | 'english' | 'general';
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  custom_instructions?: string;
}

export interface GenerateQuestionsResponse {
  questions: Array<{
    text: string;
    question_type: 'mcq' | 'mcq_multi' | 'text_input' | 'boolean' | 'reorder_steps';
    difficulty: 'easy' | 'medium' | 'hard';
    metadata: {
      options?: string[];
      correct_answer?: string | string[];
      explanation?: string;
    };
  }>;
  metadata: {
    model: string;
    subject_type: string;
    generation_time_ms: number;
    token_count: number;
    questions_generated: number;
  };
}

const WORKERS_URL = getMetaEnv('VITE_WORKERS_URL') as string | undefined;

// In development, route Worker requests through the Vite proxy (/api/workers)
// to bypass CORS. In production, use the real Worker URL directly.
const EFFECTIVE_WORKERS_URL = isDevMode() ? '/api/workers' : WORKERS_URL;

export async function generateQuestions(
  request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  // Use Cloudflare Workers AI if configured, fall back to Supabase Edge Functions
  if (WORKERS_URL) {
    return generateViaWorkers(request);
  }
  return generateViaSupabase(request);
}

async function generateViaWorkers(
  request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${EFFECTIVE_WORKERS_URL}/ai/generate-questions`, {
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

  return response.json() as Promise<GenerateQuestionsResponse>;
}

async function generateViaSupabase(
  request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // In dev, route through the Vite proxy (/api/edge) to bypass Supabase CORS.
  // In prod, call the Edge Function URL directly.
  const supabaseUrl = getMetaEnv('VITE_SUPABASE_URL') as string | undefined;
  const supabaseKey = getMetaEnv('VITE_SUPABASE_ANON_KEY') as string | undefined;
  const baseUrl = isDevMode() ? '/api/edge' : `${supabaseUrl}/functions/v1`;

  const response = await fetch(`${baseUrl}/generate-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseKey || '',
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { error?: string }).error || `Edge Function error: ${response.status}`
    );
  }

  return response.json() as Promise<GenerateQuestionsResponse>;
}
