import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';
import { createSanitizedErrorResponse, withErrorSanitization } from '../_shared/error-sanitizer.ts';
import { sanitizeSourceText } from '../_shared/input-sanitizer.ts';
import { addRateLimitHeaders, createRateLimitMiddleware, rateLimitConfigs } from '../_shared/rate-limiter.ts';

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

export const validateContentHandler = withErrorSanitization(
  async (req: Request, deps?: { supabase?: Record<string, unknown>; genAI?: Record<string, unknown> }) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Rate limiting check
    const rateLimitResult = rateLimit.middleware(req);
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = (deps?.supabase as any) || createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '');
    const authErrorCheck = await supabase.auth.getUser(token);
    const user = authErrorCheck.data.user;
    const authError = authErrorCheck.error;
    
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
      return createSanitizedErrorResponse('BAD_REQUEST', 'Questions array is required');
    }

    if (!source_text || source_text.trim().length === 0) {
      return createSanitizedErrorResponse('BAD_REQUEST', 'Source text is required');
    }

    // --- HADES: INPUT SANITIZATION ---
    const sanitizedSourceText = sanitizeSourceText(source_text).sanitized;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey && !deps?.genAI) {
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'GEMINI_API_KEY not configured');
    }

    const genAI = (deps?.genAI as any) || new GoogleGenerativeAI(apiKey!);
    // Use Gemini Pro for validation
    const geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.1,
      },
    });

    const prompt = buildValidationPrompt(questions, sanitizedSourceText, rules);

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

    const usageMetadata = (response as any).usageMetadata;
    const actualTokenCount = usageMetadata?.totalTokenCount ?? 
      Math.ceil((prompt.length + validationText.length) / 4);

    // Consume tenant tokens
    const { error: quotaError } = await supabase.rpc('consume_tenant_tokens', {
      p_app_id: profile.app_id,
      p_tokens_used: actualTokenCount,
      p_operation: 'validate_content'
    });

    if (quotaError) {
      console.error('Quota enforcement error:', quotaError);
      return createSanitizedErrorResponse('RATE_LIMITED', 'AI token quota exceeded');
    }

    // Parse JSON response
    const jsonMatch = validationText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'Failed to process AI response');
    }

    const validationReport = JSON.parse(jsonMatch[0]);

    const httpResponse = new Response(
      JSON.stringify({
        ...validationReport,
        metadata: {
          model: 'gemini-1.5-pro',
          validation_time_ms: duration,
          token_count: actualTokenCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

    return addRateLimitHeaders(httpResponse, rateLimitResult.rateLimitResult);
  },
  { statusCode: 500, includeRequestId: true }
);

if (import.meta.main) {
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
