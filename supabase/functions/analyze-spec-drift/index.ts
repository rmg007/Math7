import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkEnvironmentGuard } from '../_shared/env-guard.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DriftRequest {
  specId: string
  targetPath?: string
  scope?: 'schema' | 'code' | 'all'
}

export async function analyzeSpecDriftHandler(req: Request, deps?: { supabase?: any; genAI?: any }): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- HADES SECURITY PATCH: ENVIRONMENT GUARD ---
  const envError = checkEnvironmentGuard(req)
  if (envError) return envError

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabaseClient = deps?.supabase || createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // --- HADES SECURITY PATCH: ROLE & TENANT CHECK ---
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userRole = user.app_metadata?.user_role || user.user_metadata?.user_role;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isAdmin) {
      console.warn(`Non-admin user ${user.id} attempted to trigger spec-drift analysis.`);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: corsHeaders });
    }
    // --- END PATCH ---

    const { specId, targetPath, scope = 'all' }: DriftRequest = await req.json()

    // 1. Fetch specification
    const { data: spec, error: specError } = await supabaseClient
      .from('specifications')
      .select('*')
      .eq('id', specId)
      .single()

    if (specError) {
      throw new Error(`Failed to fetch specification: ${specError.message}`)
    }

    // 2. Get current state based on entity type
    let currentState = ''
    
    if (spec.entity_type === 'table') {
      // Query pg_catalog for actual schema
      const { data: schemaData } = await supabaseClient.rpc('get_table_schema', {
        p_table_name: spec.entity_name
      })
      currentState = JSON.stringify(schemaData, null, 2)
    } else if (spec.entity_type === 'function') {
      // Query for Edge Function or database function
      currentState = `Function: ${spec.entity_name} (implementation check needed)`
    } else {
      // For code/endpoints, we'd need file contents (passed via targetPath)
      if (targetPath) {
        currentState = `File path: ${targetPath} (code retrieval needed)`
      }
    }

    // 3. Use Gemini to analyze drift
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const genAIClient = deps?.genAI || new GoogleGenerativeAI(apiKey!)
    const model = genAIClient.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
      },
    })

    const prompt = `You are a specification compliance analyzer. Compare the specification against the actual implementation and identify any drift.

**SPECIFICATION:**
Entity Type: ${spec.entity_type}
Entity Name: ${spec.entity_name}
Requirements:
${spec.spec_content}

**ACTUAL STATE:**
${currentState}

**TASK:**
Analyze the implementation for drift. Return a JSON object with this structure:
{
  "status": "pass" | "fail" | "warning",
  "findings": [
    {
      "type": "missing" | "extra" | "mismatch",
      "entity": "string (what is affected)",
      "expected": "string (what the spec says)",
      "actual": "string (what exists)",
      "severity": "critical" | "high" | "medium" | "low"
    }
  ],
  "recommendations": ["string array of actionable fixes"]
}

Rules:
- "critical": Security issues, data integrity violations, breaking changes
- "high": Missing required features, incorrect behavior
- "medium": Missing optional features, performance concerns  
- "low": Code style, minor improvements
- Return "pass" only if zero findings
`

    const result = await model.generateContent(prompt) // enforced-temp
    const analysis = JSON.parse(result.response.text())

    // 4. Store validation results
    const { data: validation, error: validationError } = await supabaseClient
      .from('spec_validations')
      .insert({
        app_id: spec.app_id,
        spec_id: specId,
        validation_type: 'drift_detection',
        target_entity: spec.entity_name,
        status: analysis.status,
        findings: analysis.findings,
        severity: analysis.findings.length > 0 
          ? analysis.findings[0].severity 
          : null,
        total_checks: 1 + analysis.findings.length,
        passed_checks: analysis.status === 'pass' ? 1 : 0,
        failed_checks: analysis.findings.length,
        triggered_by: 'api',
      })
      .select()
      .single()

    if (validationError) {
      console.error('Failed to store validation:', validationError)
    }

    return new Response(
      JSON.stringify({
        validationId: validation?.id,
        status: analysis.status,
        findings: analysis.findings,
        recommendations: analysis.recommendations,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in analyze-spec-drift:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}

// Start the server only if run as main
if (import.meta.main) {
  Deno.serve(analyzeSpecDriftHandler)
}
