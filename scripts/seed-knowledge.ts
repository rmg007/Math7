import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.secrets' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ROOT_KNOWLEDGE_DIR = path.join(os.homedir(), '.gemini/antigravity/knowledge');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function getLocalFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(await getLocalFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

async function seed() {
  console.log('🌱 Hybrid Oracle: Seeding initial Knowledge Base (Verified)...');
  
  const kiFolders = await fs.readdir(ROOT_KNOWLEDGE_DIR, { withFileTypes: true });
  
  for (const kiFolder of kiFolders) {
    if (!kiFolder.isDirectory()) continue;
    
    const kiSlug = kiFolder.name;
    const kiPath = path.join(ROOT_KNOWLEDGE_DIR, kiSlug);
    
    const allFiles = await getLocalFiles(kiPath);
    
    for (const file of allFiles) {
        if (file.endsWith('.lock')) continue;
        const relativePath = path.relative(kiPath, file).replace(/\\/g, '/');
        const content = await fs.readFile(file, 'utf-8');
        const hash = calculateHash(content);
        
        const { error } = await supabase.from('knowledge_base').upsert({
          ki_slug: kiSlug,
          file_path: relativePath,
          content: content,
          content_hash: hash,
          status: 'verified',
          last_updated_by: 'Initial Seed'
        }, { onConflict: 'ki_slug,file_path' });

        if (error) {
          console.error(`❌ Error seeding ${kiSlug}/${relativePath}:`, error.message);
        } else {
          console.log(`✅ [Seeded] ${kiSlug}/${relativePath}`);
        }
    }
  }
  console.log('✨ Seed complete.');
}

seed().catch(console.error);
