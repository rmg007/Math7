const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const dbPassword = process.env.DB_PASSWORD;
const projectRef = process.env.SUPABASE_PROJECT_REF || 'qvslbiceoonrgjxzkotb';

if (!dbPassword) {
  console.error('❌ DB_PASSWORD environment variable not set');
  console.error('Set it in deployment/.secrets or as an environment variable');
  process.exit(1);
}

const dbUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

// Accept migration file as command-line argument
const migrationArg = process.argv[2];
if (!migrationArg) {
  console.error('❌ Usage: node direct_apply.js <migration-file-path>');
  process.exit(1);
}

const migrationFile = path.isAbsolute(migrationArg) 
  ? migrationArg 
  : path.join(__dirname, '..', migrationArg);

async function apply() {
  console.log(`🔌 Connecting to database...`);
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // Required for Supabase in some envs, or generally safe for this tool
  });

  try {
    await client.connect();
    console.log(`✅ Connected.`);

    console.log(`📖 Reading migration file: ${path.basename(migrationFile)}`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log(`🚀 Executing SQL...`);
    await client.query(sql);
    
    console.log(`✨ Migration applied successfully!`);
  } catch (err) {
    console.error(`❌ Error applying migration:`, err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

apply();
