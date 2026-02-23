#!/usr/bin/env tsx

/**
 * Database Issue Indexer
 * Indexes all known issues from Supabase into the vector store for semantic search
 */

import { createSupabaseClient } from './lib/supabase-client.js';
import { generateEmbeddings } from './lib/embedder.js';
import { hashContent } from './lib/hasher.js';

const DRY_RUN = process.argv.includes('--dry-run');

interface KnownIssue {
  id: string;
  title: string;
  description: string;
  error_message: string;
  root_cause: string;
  resolution: string;
  status: string;
  severity: string;
  updated_at: string;
}

/**
 * Format a known issue into a semantic markdown chunk
 */
function formatIssue(issue: KnownIssue): string {
  return `
# [${issue.severity.toUpperCase()}] Known Issue: ${issue.title}
Status: ${issue.status}
ID: ${issue.id}

## Description
${issue.description || 'No description provided.'}

## Error Message
\`\`\`
${issue.error_message || 'N/A'}
\`\`\`

## Root Cause
${issue.root_cause || 'Investigation pending.'}

## Resolution
${issue.resolution || 'No resolution documented yet.'}
`.trim();
}

/**
 * Fetch all known issues from the database
 */
async function fetchIssues(supabase: any): Promise<KnownIssue[]> {
  const { data, error } = await supabase
    .from('known_issues')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch known issues: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch existing chunks for database records
 */
async function getExistingDbChunks(supabase: any): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('id, file_path, content_hash')
    .like('file_path', 'db://known_issues/%');

  if (error) {
    throw new Error(`Failed to fetch existing database chunks: ${error.message}`);
  }

  return new Map(data?.map((row: any) => [`${row.file_path}:${row.content_hash}`, row.id]) || []);
}

/**
 * Main indexer function
 */
async function main() {
  console.log('🔍 Fetching known issues from database...');
  const supabase = createSupabaseClient();
  const issues = await fetchIssues(supabase);
  console.log(`✅ Found ${issues.length} issues to process\n`);

  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - No changes will be made\n');
  }

  const existingChunks = await getExistingDbChunks(supabase);
  const chunksToIndex: any[] = [];
  const currentKeys = new Set<string>();

  for (const issue of issues) {
    const content = formatIssue(issue);
    const contentHash = hashContent(content);
    const filePath = `db://known_issues/${issue.id}`;
    const key = `${filePath}:${contentHash}`;
    
    currentKeys.add(key);

    if (!existingChunks.has(key)) {
      chunksToIndex.push({
        issue,
        content,
        contentHash,
        filePath
      });
    }
  }

  if (chunksToIndex.length === 0) {
    console.log('✨ No new or updated issues to index.');
  } else {
    console.log(`🚀 Indexing ${chunksToIndex.length} new/updated issues...`);
    
    if (!DRY_RUN) {
      const embeddings = await generateEmbeddings(
        chunksToIndex.map(c => c.content),
        10
      );

      const rows = chunksToIndex.map((chunk, i) => ({
        file_path: chunk.filePath,
        breadcrumb: `Database > Known Issues > ${chunk.issue.title}`,
        content: chunk.content,
        content_hash: chunk.contentHash,
        embedding: embeddings[i].embedding,
        metadata: {
          source: 'database',
          table: 'known_issues',
          id: chunk.issue.id,
          severity: chunk.issue.severity,
          status: chunk.issue.status
        }
      }));

      const { error } = await supabase
        .from('knowledge_chunks')
        .upsert(rows, { onConflict: 'file_path,content_hash' });

      if (error) {
        throw new Error(`Failed to upsert database chunks: ${error.message}`);
      }

      const totalTokens = embeddings.reduce((sum, e) => sum + e.tokens, 0);
      console.log(`✅ Indexed ${chunksToIndex.length} issues (${totalTokens} tokens)`);
    } else {
      console.log(`[DRY RUN] Would have indexed ${chunksToIndex.length} issues.`);
    }
  }

  // Cleanup orphaned chunks (issues that no longer exist or were updated)
  const orphanedIds: string[] = [];
  for (const [key, id] of existingChunks.entries()) {
    if (!currentKeys.has(key)) {
      orphanedIds.push(id);
    }
  }

  if (orphanedIds.length > 0) {
    console.log(`🗑️ Cleaning up ${orphanedIds.length} orphaned database chunks...`);
    if (!DRY_RUN) {
      const { error } = await supabase
        .from('knowledge_chunks')
        .delete()
        .in('id', orphanedIds);

      if (error) {
        console.error(`  ❌ Failed to delete orphaned chunks: ${error.message}`);
      } else {
        console.log(`  ✅ Deleted ${orphanedIds.length} chunks`);
      }
    } else {
      console.log(`  [DRY RUN] Would have deleted ${orphanedIds.length} chunks`);
    }
  }

  console.log('\n✨ Database indexing process complete!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
