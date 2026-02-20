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

const WORKERS_URL = import.meta.env.VITE_WORKERS_URL;

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

  const response = await fetch(`${WORKERS_URL}/ai/generate-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(request),
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
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: request,
  });

  if (error) throw error;
  if (!data) throw new Error('No data returned from Edge Function');

  return data as GenerateQuestionsResponse;
}
