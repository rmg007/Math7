import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  text: string;
  custom_instructions?: string;
}

export async function parseImportHandler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get user's app_id for tenant isolation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('app_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.app_id) {
      return new Response(
        JSON.stringify({ error: 'User profile not found or missing tenant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Only admins can import questions
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Only administrators can parse import prompts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { text, custom_instructions }: ImportRequest = await req.json();

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required');
    }

    // Initialize AI client
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const prompt = buildImportPrompt(text, custom_instructions);

    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();
    const generationTime = Date.now() - startTime;

    const usageMetadata = (response as any).usageMetadata;
    const actualTokenCount = usageMetadata?.totalTokenCount ?? 
      Math.ceil((prompt.length + generatedText.length) / 4);

    // Consume tokens
    await supabase.rpc('consume_tenant_tokens', {
      p_app_id: profile.app_id,
      p_tokens_used: actualTokenCount,
      p_operation: 'parse_import'
    });

    // Parse JSON response
    const questions = JSON.parse(generatedText);

    return new Response(
      JSON.stringify({
        questions,
        metadata: {
          generation_time_ms: generationTime,
          token_count: actualTokenCount,
          questions_parsed: Array.isArray(questions) ? questions.length : 0,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Import parsing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to parse import prompt',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

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
