import { generateQuestions, GenerateQuestionsRequest, GenerateQuestionsResponse } from './generateQuestions';
import { validateContent, ValidationResponse } from './validateContent';
import { supabase } from '@/lib/supabase';

export interface GovernedGenerationResponse extends GenerateQuestionsResponse {
  validation?: ValidationResponse;
  governance: {
    tokens_consumed: number;
    quota_remaining: number;
    throttled: boolean;
  };
}

export async function governedGenerateQuestions(
  appId: string,
  request: GenerateQuestionsRequest
): Promise<GovernedGenerationResponse> {
  // 1. Pre-check (Optional: could use estimatedTokens for soft-locking quota)
  // const estimatedTokens = Math.ceil(request.text.length / 4) + 2000;

  // 2. Initial quota check
  // Note: consume_tenant_tokens is a void function that raises an exception if quota is exceeded
  const { error: quotaError } = await supabase.rpc('consume_tenant_tokens', {
    p_app_id: appId,
    p_token_count: 0,
  } as never);

  if (quotaError) throw quotaError;
  // If no error, we are good to go.


  // 3. Generate Content (Gemini Flash)
  const generationResult = await generateQuestions(request);

  // 4. Validate Content (Gemini Pro)
  const validationResult = await validateContent({
    questions: generationResult.questions,
    source_text: request.text,
  });

  // 5. Final token consumption (Exact amount)
  const actualTokens = generationResult.metadata.token_count +
    Math.ceil(JSON.stringify(validationResult).length / 4);

  const { error: finalQuotaError } = await supabase.rpc('consume_tenant_tokens', {
    p_app_id: appId,
    p_token_count: actualTokens,
  } as never);

  if (finalQuotaError) console.error('Failed to log final token usage:', finalQuotaError);


  return {
    ...generationResult,
    validation: validationResult,
    governance: {
      tokens_consumed: actualTokens,
      quota_remaining: -1, // Not returned by void procedure
      throttled: false,
    }
  };
}
