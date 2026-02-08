import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  questions: any[];
  source_text: string;
  rules?: {
    name: string;
    rule_type: string;
    params: any;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ========================================
    // FIX S2: AUTHENTICATION CHECK
    // ========================================
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
      .select('app_id, is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.app_id) {
      return new Response(
        JSON.stringify({ error: 'User profile not found or missing tenant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Only admins can validate content
    if (!profile.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Only administrators can validate content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { questions, source_text, rules = [] }: ValidationRequest = await req.json();

    if (!questions || !Array.isArray(questions)) {
      throw new Error('Questions array is required');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini Pro for validation (Stronger reasoning than Flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = buildValidationPrompt(questions, source_text, rules);

    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const validationText = response.text();
    const duration = Date.now() - startTime;

    // FIX T5: Use actual usage metadata from Gemini API
    const usageMetadata = response.usageMetadata;
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
      throw new Error('AI did not return valid JSON validation report');
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
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to validate content',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

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
