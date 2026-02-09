#!/usr/bin/env tsx

/**
 * Documentation Indexer
 * Indexes all project documentation into the vector store for semantic search
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { createSupabaseClient } from './lib/supabase-client.js';
import { generateEmbeddings } from './lib/embedder.js';
import { hashContent } from './lib/hasher.js';
import { splitMarkdown } from './lib/splitter.js';

// Configuration
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');
const INCLUDE_PATTERNS = [
  'docs/**/*.md',
  'README.md',
  'AI_CODING_INSTRUCTIONS.md',
  'AGENT_QUICKSTART.md',
  'ROADMAP.md',
  '.agent/workflows/*.md',
  'student-app/README.md',
  'admin-panel/README.md',
  'landing-pages/README.md',
  'content-engine/README.md',
];

const DRY_RUN = process.argv.includes('--dry-run');

interface ChunkToIndex {
  filePath: string;
  breadcrumb: string;
  content: string;
  contentHash: string;
  metadata: Record<string, any>;
}

/**
 * Discover all documentation files
 */
async function discoverFiles(): Promise<string[]> {
  const files: string[] = [];

  for (const pattern of INCLUDE_PATTERNS) {
    const matches = await glob(pattern, {
      cwd: PROJECT_ROOT,
      absolute: false,
      ignore: ['node_modules/**', '**/node_modules/**', 'dist/**', 'build/**'],
    });
    files.push(...matches);
  }

  // Deduplicate
  return [...new Set(files)];
}

/**
 * Process a single file and split into chunks
 */
async function processFile(relativePath: string): Promise<ChunkToIndex[]> {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  const content = await fs.readFile(absolutePath, 'utf-8');

  const chunks = await splitMarkdown(content, relativePath);

  return chunks.map((chunk) => ({
    filePath: relativePath,
    breadcrumb: chunk.breadcrumb,
    content: chunk.content,
    contentHash: hashContent(chunk.content),
    metadata: chunk.metadata,
  }));
}

/**
 * Fetch existing chunks for a file from the database
 */
async function getExistingChunks(
  supabase: ReturnType<typeof createSupabaseClient>,
  filePath: string
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('id, content_hash')
    .eq('file_path', filePath);

  if (error) {
    throw new Error(`Failed to fetch existing chunks: ${error.message}`);
  }

  return new Map(data?.map((row) => [row.content_hash, row.id]) || []);
}

/**
 * Delete orphaned chunks (hashes no longer in file)
 */
async function deleteOrphanedChunks(
  supabase: ReturnType<typeof createSupabaseClient>,
  filePath: string,
  currentHashes: Set<string>
): Promise<number> {
  const existingChunks = await getExistingChunks(supabase, filePath);
  const orphanedIds: string[] = [];

  for (const [hash, id] of existingChunks.entries()) {
    if (!currentHashes.has(hash)) {
      orphanedIds.push(id);
    }
  }

  if (orphanedIds.length === 0) {
    return 0;
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would delete ${orphanedIds.length} orphaned chunks`);
    return orphanedIds.length;
  }

  const { error } = await supabase
    .from('knowledge_chunks')
    .delete()
    .in('id', orphanedIds);

  if (error) {
    throw new Error(`Failed to delete orphaned chunks: ${error.message}`);
  }

  return orphanedIds.length;
}

/**
 * Index new or updated chunks
 */
async function indexChunks(
  supabase: ReturnType<typeof createSupabaseClient>,
  chunks: ChunkToIndex[]
): Promise<{ indexed: number; skipped: number; tokens: number }> {
  const existingChunks = await getExistingChunks(supabase, chunks[0].filePath);

  // Filter out chunks that haven't changed
  const newChunks = chunks.filter((chunk) => !existingChunks.has(chunk.contentHash));

  if (newChunks.length === 0) {
    return { indexed: 0, skipped: chunks.length, tokens: 0 };
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would index ${newChunks.length} chunks`);
    return { indexed: newChunks.length, skipped: chunks.length - newChunks.length, tokens: 0 };
  }

  // Generate embeddings
  console.log(`  Generating embeddings for ${newChunks.length} chunks...`);
  const embeddings = await generateEmbeddings(
    newChunks.map((c) => c.content),
    10 // Rate limit: 10 concurrent requests
  );

  const totalTokens = embeddings.reduce((sum, e) => sum + e.tokens, 0);

  // Upsert chunks
  const rows = newChunks.map((chunk, i) => ({
    file_path: chunk.filePath,
    breadcrumb: chunk.breadcrumb,
    content: chunk.content,
    content_hash: chunk.contentHash,
    embedding: embeddings[i].embedding, // Use array directly, not JSON.stringify
    metadata: chunk.metadata,
  }));

  const { error } = await supabase.from('knowledge_chunks').upsert(rows, {
    onConflict: 'file_path,content_hash',
  });

  if (error) {
    throw new Error(`Failed to upsert chunks: ${error.message}`);
  }

  return {
    indexed: newChunks.length,
    skipped: chunks.length - newChunks.length,
    tokens: totalTokens,
  };
}

/**
 * Main indexer function
 */
async function main() {
  console.log('🔍 Discovering documentation files...');
  const files = await discoverFiles();
  console.log(`✅ Found ${files.length} files to process\n`);

  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - No changes will be made\n');
  }

  const supabase = createSupabaseClient();

  let totalIndexed = 0;
  let totalSkipped = 0;
  let totalDeleted = 0;
  let totalTokens = 0;

  for (const file of files) {
    console.log(`📄 Processing: ${file}`);

    try {
      // Process file into chunks
      const chunks = await processFile(file);
      console.log(`  Split into ${chunks.length} chunks`);

      // Index chunks
      const { indexed, skipped, tokens } = await indexChunks(supabase, chunks);
      totalIndexed += indexed;
      totalSkipped += skipped;
      totalTokens += tokens;

      if (indexed > 0) {
        console.log(`  ✅ Indexed ${indexed} new/updated chunks (${tokens} tokens)`);
      }
      if (skipped > 0) {
        console.log(`  ⏭️  Skipped ${skipped} unchanged chunks`);
      }

      // Delete orphaned chunks
      const currentHashes = new Set(chunks.map((c) => c.contentHash));
      const deleted = await deleteOrphanedChunks(supabase, file, currentHashes);
      totalDeleted += deleted;

      if (deleted > 0) {
        console.log(`  🗑️  Deleted ${deleted} orphaned chunks`);
      }

      console.log('');
    } catch (error) {
      console.error(`  ❌ Error processing file: ${error}`);
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Indexing Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Files Processed:     ${files.length}`);
  console.log(`Chunks Indexed:      ${totalIndexed}`);
  console.log(`Chunks Skipped:      ${totalSkipped}`);
  console.log(`Chunks Deleted:      ${totalDeleted}`);
  console.log(`Tokens Used:         ${totalTokens.toLocaleString()}`);
  console.log(`Estimated Cost:      $${((totalTokens / 1000000) * 0.02).toFixed(4)}`);
  console.log('═══════════════════════════════════════════════════════');

  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN - no changes were made to the database');
  } else {
    console.log('\n✨ Indexing complete!');
  }
}

// Run the indexer
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
