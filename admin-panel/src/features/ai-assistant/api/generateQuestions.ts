import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';
import { CanonicalQuestionType } from '@questerix/core/constants/question-types';

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
    question_type: CanonicalQuestionType;
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

export async function generateQuestions(
  request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  if (!env.workersUrl && !env.isDevelopment) {
    throw new Error('Cloudflare Workers AI (VITE_WORKERS_URL) is not configured');
  }
  return generateViaWorkers(request);
}

async function generateViaWorkers(
  request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const url = env.isDevelopment ? '/api/workers' : env.workersUrl;

  const response = await fetch(`${url}/ai/generate-questions`, {
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
