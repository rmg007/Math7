import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IndexRequest {
  specId: string
}

export async function indexSpecificationHandler(req: Request, deps?: { supabase?: any; fetch?: typeof fetch }): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    // --- HADES SECURITY PATCH: ROLE CHECK ---
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userRole = user.app_metadata?.user_role || user.user_metadata?.user_role;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: corsHeaders });
    }
    // --- END PATCH ---

    const { specId }: IndexRequest = await req.json()

    // 1. Fetch specification content
    const { data: spec, error: specError } = await supabaseClient
      .from('specifications')
      .select('id, spec_content, entity_type, entity_name')
      .eq('id', specId)
      .single()

    if (specError) {
      throw new Error(`Failed to fetch specification: ${specError.message}`)
    }

    // 2. Generate embedding using OpenAI
    const embeddingText = `${spec.entity_type}: ${spec.entity_name}\n\n${spec.spec_content}`
    
    const fetcher = deps?.fetch || fetch;
    const openaiResponse = await fetcher('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: embeddingText,
        model: 'text-embedding-3-small',
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const embeddingData = await openaiResponse.json()
    const embedding = embeddingData.data[0].embedding

    // 3. Update specification with embedding
    const { error: updateError } = await supabaseClient
      .from('specifications')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', specId)

    if (updateError) {
      throw new Error(`Failed to update embedding: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        specId,
        dimensions: embedding.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in index-specification:', error)
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
  Deno.serve(indexSpecificationHandler)
}
