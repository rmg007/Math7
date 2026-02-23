#!/usr/bin/env tsx

import { createSupabaseClient } from './lib/supabase-client.js';

async function checkArchiveDocs() {
  const supabase = createSupabaseClient();

  // Get all unique file paths
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('file_path')
    .ilike('file_path', '%archive%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const uniqueFiles = [...new Set(data?.map((d) => d.file_path))];

  console.log('📁 Archive Files Indexed:');
  console.log('═══════════════════════════════════════');
  
  if (uniqueFiles.length === 0) {
    console.log('❌ No archive files found in index');
    console.log('');
    console.log('💡 Solution: Trigger a reindex to include archive docs');
    console.log('   The indexer is configured to index them (docs/**/*.md)');
  } else {
    uniqueFiles.forEach((file) => console.log(`  ✅ ${file}`));
    console.log('');
    console.log(`Total: ${uniqueFiles.length} archive files indexed`);
  }
}

checkArchiveDocs().catch(console.error);
