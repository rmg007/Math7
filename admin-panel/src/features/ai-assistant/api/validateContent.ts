import { supabase } from '@/lib/supabase';

export interface ValidationRule {
  name: string;
  rule_type: string;
  params: Record<string, unknown>;
}

export interface QuestionData {
  id?: number;
  question?: string;
  options?: unknown[];
  correct_answer?: unknown;
  [key: string]: unknown;
}

export interface ValidationRequest {
  questions: QuestionData[];
  source_text: string;
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
  };
}

export async function validateContent(
  request: ValidationRequest
): Promise<ValidationResponse> {
  const { data, error } = await supabase.functions.invoke<ValidationResponse>('validate-content', {
    body: request,
  });

  if (error) throw error;
  if (!data) throw new Error('No data returned from validation Edge Function');

  return data;
}
