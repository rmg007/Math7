import { supabase } from '@/lib/supabase';
import {
  generateQuestions,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
} from './generateQuestions';
import { validateContent, ValidationResponse } from './validateContent';

interface GovernedGenerationResponse extends GenerateQuestionsResponse {
  validation?: ValidationResponse;
  governance: {
    tokens_consumed: number;
    quota_remaining: number;
    throttled: boolean;
  };
  quotaError?: string | null;
}

export async function governedGenerateQuestions(
  appId: string,
  request: GenerateQuestionsRequest
): Promise<GovernedGenerationResponse> {
  // 1. Get current user for attribution
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 2. Initial quota check
  // Note: consume_tenant_tokens returns jsonb with success field
  const { error: quotaError } = await supabase.rpc('consume_tenant_tokens', {
    p_app_id: appId,
    p_tokens_used: 0,
    p_operation: 'pre_check',
  });

  if (quotaError) throw quotaError;

  // 3. Generate Content (Gemini Flash)
  const generationResult = await generateQuestions(request);

  // 4. Validate Content (Gemini Pro)
  const validationResult = await validateContent({
    questions: generationResult.questions,
    source_text: request.text,
  });

  // 5. Final token consumption (Exact amount)
  const actualTokens =
    generationResult.metadata.token_count + Math.ceil(JSON.stringify(validationResult).length / 4);

  const { error: finalQuotaError } = await supabase.rpc('consume_tenant_tokens', {
    p_app_id: appId,
    p_tokens_used: actualTokens,
    p_operation: 'generate_questions',
  });

  // 6. Record Session in Telemetry Table
  const { error: sessionError } = await supabase.from('ai_generation_sessions').insert({
    created_by: user.id,
    model_used: generationResult.metadata.model || 'gemini-1.5-flash',
    prompt_text: request.text.substring(0, 5000),
    token_count: actualTokens,
    questions_generated: generationResult.questions.length,
    questions_imported: 0,
    generation_time_ms: generationResult.metadata.generation_time_ms,
    status: validationResult.status === 'approved' ? 'approved' : 'flagged',
    difficulty_distribution: request.difficulty_distribution,
    raw_response: {
      validation_score: validationResult.overall_score,
      found_issues: validationResult.findings.reduce((acc, f) => acc + f.issues.length, 0),
      app_id: appId,
    },
  });

  if (sessionError) {
    console.error('Failed to record telemetry session:', sessionError);
    // Don't fail the whole request just because telemetry failed
  }

  // Return response with quota error info
  return {
    ...generationResult,
    validation: validationResult,
    governance: {
      tokens_consumed: actualTokens,
      quota_remaining: -1, // Procedure doesn't return value currently
      throttled: Boolean(finalQuotaError),
    },
    quotaError: finalQuotaError ? finalQuotaError.message : null,
  };
}
