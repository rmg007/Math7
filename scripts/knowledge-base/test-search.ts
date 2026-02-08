#!/usr/bin/env tsx

import { generateEmbedding } from './lib/embedder.js';
import { createSupabaseClient } from './lib/supabase-client.js';

async function test() {
  console.log('Testing semantic search...\n');
  
  const { embedding } = await generateEmbedding('offline sync student app');
  console.log(`Generated embedding (${embedding.length} dimensions)\n`);
  
  const supabase = createSupabaseClient();
  
  // Try the RPC call
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 3,
  });
  
  if (error) {
    console.error('❌ RPC Error:', error.message);
    console.error('Details:', error);
    return;
  }
  
  console.log(`✅ Found ${data?.length || 0} results\n`);
  
  if (data && data.length > 0) {
    data.forEach((result, i) => {
      console.log(`${i + 1}. ${result.file_path}`);
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Preview: ${result.content.substring(0, 100)}...\n`);
    });
  }
}

test().catch(console.error);
