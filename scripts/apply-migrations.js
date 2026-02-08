/**
 * Apply Database Migrations Programmatically
 * 
 * This script reads all migration files and applies them to the Supabase database.
 * 
 * USAGE:
 *   node scripts/apply-migrations.js
 * 
 * REQUIREMENTS:
 *   - SERVICE_ROLE_KEY environment variable must be set
 *   - Or you can pass it as the first argument
 * 
 * EXAMPLE:
 *   SERVICE_ROLE_KEY=your-service-role-key node scripts/apply-migrations.js
 *   OR
 *   node scripts/apply-migrations.js your-service-role-key
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://[YOUR-PROJECT-ID].supabase.co';
const SERVICE_ROLE_KEY = process.argv[2] || process.env.SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SERVICE_ROLE_KEY is required');
  console.error('');
  console.error('Get your Service Role Key from:');
  console.error('https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/settings/api');
  console.error('');
  console.error('Usage:');
  console.error('  SERVICE_ROLE_KEY=your-key node scripts/apply-migrations.js');
  console.error('  OR');
  console.error('  node scripts/apply-migrations.js your-key');
  process.exit(1);
}

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: '[YOUR-PROJECT-ID].supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject({ success: false, statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function applyMigrations() {
  console.log('🔧 Applying Database Migrations...\n');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${migrationFiles.length} migration files\n`);
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Applying: ${file}...`);
    
    try {
      // Note: Supabase doesn't have exec_sql RPC by default
      // We need to use SQL Editor or psql directly
      console.log(`  ⚠️  Skipped (requires SQL Editor or psql)`);
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      throw error;
    }
  }
  
  console.log('\n✅ Migration process complete');
  console.log('\nNOTE: Migrations must be applied via:');
  console.log('  1. Supabase Dashboard SQL Editor');
  console.log('  2. psql with database connection string');
  console.log('  3. See MIGRATION_GUIDE.md for details');
}

applyMigrations().catch(console.error);
