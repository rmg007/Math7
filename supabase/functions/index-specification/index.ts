import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IndexRequest {
  specId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

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
    
    const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
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
})
