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

const MODE = process.argv.includes('--push') ? 'PUSH' : 'PULL';
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const VERBOSE = process.argv.includes('--verbose');

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
  } catch (e) {
    // Directory might not exist
  }
  return files;
}

async function pullKnowledge() {
  console.log('🧠 Hybrid Oracle: Pulling Verified Knowledge (DB Wins)...');

  const { data: records, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('status', 'verified');

  if (error) throw error;
  if (!records) return;

  const validLocalPaths = new Set<string>();

  for (const doc of records) {
    const fullPath = path.join(ROOT_KNOWLEDGE_DIR, doc.ki_slug, doc.file_path);
    const dir = path.dirname(fullPath);
    validLocalPaths.add(fullPath);

    let localHash = '';
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      localHash = calculateHash(content);
    } catch (e) {}

    if (localHash === doc.content_hash && !FORCE) {
      if (VERBOSE) console.log(`⏩ [Skipped] ${doc.ki_slug}/${doc.file_path}`);
      continue;
    }

    if (!DRY_RUN) {
      await fs.mkdir(dir, { recursive: true });
      const tempPath = `${fullPath}.tmp`;
      await fs.writeFile(tempPath, doc.content, 'utf-8');
      await fs.rename(tempPath, fullPath);
      console.log(`✅ [Updated] ${doc.ki_slug}/${doc.file_path}`);
    } else {
      console.log(`🔍 [Dry Run] Would update: ${doc.ki_slug}/${doc.file_path}`);
    }
  }

  // Pruning
  console.log('🧹 Pruning obsolete local knowledge...');
  const allLocalFiles = await getLocalFiles(ROOT_KNOWLEDGE_DIR);
  for (const localFile of allLocalFiles) {
    if (localFile.endsWith('.keep')) continue;
    if (!validLocalPaths.has(localFile)) {
      if (!DRY_RUN) {
        await fs.unlink(localFile);
        console.log(`🗑️ [Deleted] ${path.relative(ROOT_KNOWLEDGE_DIR, localFile)}`);
      } else {
        console.log(`🔍 [Dry Run] Would delete: ${path.relative(ROOT_KNOWLEDGE_DIR, localFile)}`);
      }
    }
  }
}

async function pushKnowledge() {
  console.log('📤 Hybrid Oracle: Pushing Local Knowledge -> Supabase (Draft mode)...');
  
  const kiFolders = await fs.readdir(ROOT_KNOWLEDGE_DIR, { withFileTypes: true });
  
  for (const kiFolder of kiFolders) {
    if (!kiFolder.isDirectory()) continue;
    
    const kiSlug = kiFolder.name;
    const kiPath = path.join(ROOT_KNOWLEDGE_DIR, kiSlug);
    
    // Process metadata.json
    const metadataPath = path.join(kiPath, 'metadata.json');
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      await uploadFile(kiSlug, 'metadata.json', metadataContent);
    } catch (e) {}
    
    // Process artifacts
    const artifactsDir = path.join(kiPath, 'artifacts');
    try {
      const artifactFiles = await getLocalFiles(artifactsDir);
      for (const artifactFile of artifactFiles) {
        const relativePath = path.relative(kiPath, artifactFile).replace(/\\/g, '/');
        const content = await fs.readFile(artifactFile, 'utf-8');
        await uploadFile(kiSlug, relativePath, content);
      }
    } catch (e) {}
  }
}

async function uploadFile(kiSlug: string, filePath: string, content: string) {
  const hash = calculateHash(content);
  
  if (!DRY_RUN) {
    const { error } = await supabase.from('knowledge_base').upsert({
      ki_slug: kiSlug,
      file_path: filePath,
      content: content,
      content_hash: hash,
      status: 'draft', // Always push as draft
      last_updated_by: 'Antigravity'
    }, { onConflict: 'ki_slug,file_path' });

    if (error) {
      console.error(`❌ Error pushing ${kiSlug}/${filePath}:`, error.message);
    } else {
      console.log(`📤 [Pushed] ${kiSlug}/${filePath} (Status: draft)`);
    }
  } else {
    console.log(`🔍 [Dry Run] Would push: ${kiSlug}/${filePath}`);
  }
}

async function main() {
  try {
    if (MODE === 'PUSH') {
      await pushKnowledge();
    } else {
      await pullKnowledge();
    }
    console.log(`✨ Knowledge ${MODE === 'PUSH' ? 'Push' : 'Sync'} Complete.`);
  } catch (err) {
    console.error('❌ Operation Failed:', err);
    process.exit(1);
  }
}

main();
