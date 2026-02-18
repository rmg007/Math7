import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';
import { createSanitizedErrorResponse } from '../_shared/error-sanitizer.ts';
import { createRateLimitMiddleware, rateLimitConfigs } from '../_shared/rate-limiter.ts';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000,http://localhost:5173').split(',');

function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('Origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

// Rate limiter must be created OUTSIDE the handler to persist state across requests
const rateLimit = createRateLimitMiddleware(rateLimitConfigs.validateContent);

interface ValidationRequest {
  questions: any[];
  source_text: string;
  rules?: {
    name: string;
    rule_type: string;
    params: any;
  }[];
}

export async function validateContentHandler(req: Request, deps?: { supabase?: Record<string, unknown>; genAI?: Record<string, unknown> }): Promise<Response> {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting check
  const rateLimitResult = rateLimit.middleware(req);
  
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    // ========================================
    // FIX S2: AUTHENTICATION CHECK
    // ========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = (deps?.supabase as any) || createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Invalid or expired token');
    }

    // Get user's app_id for tenant isolation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('app_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.app_id) {
      return createSanitizedErrorResponse('FORBIDDEN', 'Access denied');
    }

    // Only admins can validate content
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return createSanitizedErrorResponse('FORBIDDEN', 'Access denied');
    }

    const { questions, source_text, rules = [] }: ValidationRequest = await req.json();

    if (!questions || !Array.isArray(questions)) {
      throw new Error('Questions array is required');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey && !deps?.genAI) {
      return createSanitizedErrorResponse('INTERNAL_ERROR');
    }

    const genAI = (deps?.genAI as any) || new GoogleGenerativeAI(apiKey!);
    // Use Gemini Pro for validation (Stronger reasoning than Flash)
    const geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.1,
      },
    });

    const prompt = buildValidationPrompt(questions, source_text, rules);

    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    let result: any;
    try {
      result = await geminiModel.generateContent(prompt, {
        signal: controller.signal
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return createSanitizedErrorResponse('SERVICE_UNAVAILABLE', 'AI request timed out');
      }
      throw err;
    }
    clearTimeout(timeoutId);
    
    const response = await result.response;
    const validationText = response.text();
    const duration = Date.now() - startTime;

    // FIX T5: Use actual usage metadata from Gemini API
    const usageMetadata = (response as any).usageMetadata;
    const actualTokenCount = usageMetadata?.totalTokenCount ?? 
      Math.ceil((prompt.length + validationText.length) / 4);

    // ========================================
    // FIX S3: CONSUME TENANT TOKENS
    // ========================================
    const { error: quotaError } = await supabase.rpc('consume_tenant_tokens', {
      p_app_id: profile.app_id,
      p_tokens_used: actualTokenCount,
      p_operation: 'validate_content'
    });

    if (quotaError) {
      console.error('Quota enforcement error:', quotaError);
    }

    // Parse JSON response
    const jsonMatch = validationText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'Failed to process AI response');
    }

    const validationReport = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        ...validationReport,
        metadata: {
          model: 'gemini-1.5-pro',
          validation_time_ms: duration,
          token_count: actualTokenCount,
          prompt_tokens: usageMetadata?.promptTokenCount,
          completion_tokens: usageMetadata?.candidatesTokenCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return createSanitizedErrorResponse('INTERNAL_ERROR');
  }
}

// Start the server only if run as main
// deno-lint-ignore no-explicit-any
if ((import.meta as any).main) {
  serve(validateContentHandler);
}

function buildValidationPrompt(questions: any[], sourceText: string, rules: any[]): string {
  return `You are an expert educational content auditor. Your task is to validate AI-generated questions against source material and specific quality rules.

**Source Material:**
${sourceText.substring(0, 5000)}

**Generated Questions to Validate:**
${JSON.stringify(questions, null, 2)}

**Validation Rules:**
${rules.length > 0 ? JSON.stringify(rules, null, 2) : 'Default: Accuracy, Safety, and Formatting'}

**Evaluation Criteria:**
1. **Accuracy**: Are the questions factually correct based ONLY on the source?
2. **Pedagogy**: Is the difficulty distribution actually appropriate?
3. **Safety**: Any sensitive, biased, or inappropriate content?
4. **Formatting**: Does it strictly follow the required schema?

**Output Format (JSON Object ONLY):**
{
  "overall_score": 0.0 to 1.0,
  "status": "approved" | "flagged" | "rejected",
  "consensus_reached": boolean,
  "findings": [
    {
      "question_id": number (index),
      "score": 0.0 to 1.0,
      "issues": string[],
      "suggestions": string
    }
  ],
  "summary": "Executive summary of validation"
}

Return ONLY the JSON object.`;
}
