#!/usr/bin/env tsx

/**
 * Documentation Query CLI
 * Semantic search over indexed documentation
 */

import { createSupabaseClient } from './lib/supabase-client.js';
import { generateEmbedding } from './lib/embedder.js';

const query = process.argv.slice(2).join(' '); // Join all arguments for multi-word queries

if (!query) {
  console.error('Usage: npx tsx query-docs.ts "your search query"');
  console.error('Example: npx tsx query-docs.ts "How does offline sync work?"');
  process.exit(1);
}

interface SearchResult {
  id: string;
  file_path: string;
  breadcrumb: string;
  content: string;
  similarity: number;
}

async function searchDocs(
  query: string,
  matchThreshold: number = 0.5, // Lowered from 0.7 for better recall
  matchCount: number = 5
): Promise<SearchResult[]> {
  console.log(`🔍 Searching documentation for: "${query}"\n`);

  // Generate embedding for the query
  const { embedding } = await generateEmbedding(query);

  // Search using the match_knowledge_chunks RPC
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: embedding, // supabase-js handles vector conversion
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return data || [];
}

async function main() {
  try {
    const results = await searchDocs(query);

    if (results.length === 0) {
      console.log('❌ No results found. Try broader search terms or lower the threshold.');
      return;
    }

    console.log(`✅ Found ${results.length} results:\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    results.forEach((result, index) => {
      console.log(`📄 Result ${index + 1}: ${result.breadcrumb}`);
      console.log(`   File: ${result.file_path}`);
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Preview:\n`);
      
      // Show first 300 characters
      const preview = result.content.substring(0, 300);
      console.log(`   ${preview.replace(/\n/g, '\n   ')}...`);
      console.log('\n───────────────────────────────────────────────────────────────\n');
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
