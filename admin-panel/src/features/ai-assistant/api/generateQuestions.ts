import { supabase } from '@/lib/supabase';

export interface GenerateQuestionsRequest {
  text: string;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  custom_instructions?: string;
  model?: 'gemini-1.5-flash' | 'gpt-4o-mini';
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
    generation_time_ms: number;
    token_count: number;
    questions_generated: number;
  };
}

export async function generateQuestions(
  request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: request,
  });

  if (error) throw error;
  if (!data) throw new Error('No data returned from Edge Function');

  return data as GenerateQuestionsResponse;
}
