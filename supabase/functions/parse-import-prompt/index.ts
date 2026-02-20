import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';
import { createSanitizedErrorResponse, withErrorSanitization } from '../_shared/error-sanitizer.ts';
import { sanitizeCustomInstructions, sanitizeSourceText } from '../_shared/input-sanitizer.ts';
import { addRateLimitHeaders, createRateLimitMiddleware, rateLimitConfigs } from '../_shared/rate-limiter.ts';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://admin.questerix.com',
  'https://app.questerix.com',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS[ALLOWED_ORIGINS.length - 1], // Fallback to primary production domain
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const rateLimit = createRateLimitMiddleware(rateLimitConfigs.generateQuestions);

interface ImportRequest {
  text: string;
  custom_instructions?: string;
}

export const parseImportHandler = withErrorSanitization(
  async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(req) });
    }

    // Rate limiting
    const rateLimitResult = rateLimit.middleware(req);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      return createSanitizedErrorResponse('FORBIDDEN', 'User profile not found or missing tenant');
    }

    // Only admins can import questions
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return createSanitizedErrorResponse('FORBIDDEN', 'Only administrators can parse import prompts');
    }

    const { text, custom_instructions }: ImportRequest = await req.json();

    if (!text || text.trim().length === 0) {
      return createSanitizedErrorResponse('BAD_REQUEST', 'Text content is required');
    }

    // --- HADES: INPUT SANITIZATION ---
    const sanitizedText = sanitizeSourceText(text).sanitized;
    const sanitizedInstructions = custom_instructions 
      ? sanitizeCustomInstructions(custom_instructions).sanitized 
      : undefined;

    // Initialize AI client
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const prompt = buildImportPrompt(sanitizedText, sanitizedInstructions);

    const startTime = Date.now();
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout after 30s')), 30_000)
      ),
    ]);
    const resultResponse = await result.response;
    const generatedText = resultResponse.text();
    const generationTime = Date.now() - startTime;

    const usageMetadata = (resultResponse as any).usageMetadata;
    const actualTokenCount = usageMetadata?.totalTokenCount ?? 
      Math.ceil((prompt.length + generatedText.length) / 4);

    // Consume tokens
    const { error: quotaError } = await supabase.rpc('consume_tenant_tokens', {
      p_app_id: profile.app_id,
      p_tokens_used: actualTokenCount,
      p_operation: 'parse_import'
    });

    if (quotaError) {
      return createSanitizedErrorResponse('RATE_LIMITED', 'AI token quota exceeded');
    }

    // Parse JSON response
    const questions = JSON.parse(generatedText);

    const httpResponse = new Response(
      JSON.stringify({
        questions,
        metadata: {
          generation_time_ms: generationTime,
          token_count: actualTokenCount,
          questions_parsed: Array.isArray(questions) ? questions.length : 0,
        },
      }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );

    return addRateLimitHeaders(httpResponse, rateLimitResult.rateLimitResult);
  },
  { statusCode: 500, includeRequestId: true }
);

if (import.meta.main) {
  serve(parseImportHandler);
}

function buildImportPrompt(text: string, customInstructions?: string): string {
  const schema = [{
    content: 'string (the question text)',
    type: 'enum: multiple_choice | mcq_multi | text_input | boolean | reorder_steps',
    options: 'object (schema depends on type)',
    solution: 'object (schema depends on type)',
    explanation: 'string (explanation of the solution)',
    points: 'number (default to 1)'
  }];

  const typeDetails = `
- multiple_choice: options: { options: [{id: "a", text: "..."}, ...] }, solution: { correct_option_id: "a" }
- mcq_multi: options: { options: [{id: "a", text: "..."}, ...] }, solution: { correct_ids: ["a", "b"] }
- text_input: options: { placeholder: "..." }, solution: { exact_match: "..." }
- boolean: options: { true_label: "True", false_label: "False" }, solution: { correct_value: true }
- reorder_steps: options: { steps: [{id: "1", text: "..."}, ...] }, solution: { correct_order: ["2", "1", "3"] }
  `;

  return 'You are a curriculum data entry specialist. Convert the provided unstructured text into a structured JSON array of questions.\n\n' +
    '**Source Text:**\n' + text + '\n\n' +
    '**Question Type Details:**\n' + typeDetails + '\n\n' +
    (customInstructions ? '**Additional Instructions:**\n' + customInstructions + '\n\n' : '') +
    '**Output Format (JSON Array):**\n' +
    'Return a JSON array where each object follows this schema:\n' +
    JSON.stringify(schema[0], null, 2) + '\n\n' +
    '**Constraints:**\n' +
    '- Use valid JSON only.\n' +
    '- Map the unstructured questions to the most appropriate type.\n' +
    '- Ensure \'options\' and \'solution\' match the specific requirements of the chosen type.\n' +
    '- Return ONLY the raw JSON array. No markdown blocks.';
}
