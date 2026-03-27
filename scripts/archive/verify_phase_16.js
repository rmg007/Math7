const { Client } = require('pg');
require('dotenv').config();

const dbPassword = process.env.DB_PASSWORD || 'QpJIzi2r6vaoghG5';
const projectRef = process.env.SUPABASE_PROJECT_REF || 'qvslbiceoonrgjxzkotb';
const dbUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

async function check() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    const resFunc = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('prune_old_error_logs', 'trigger_critical_alert');
    `);
    console.log('Functions found:', resFunc.rows.map(r => r.routine_name));

    const resTrig = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name = 'on_critical_error';
    `);
    console.log('Triggers found:', resTrig.rows.map(r => r.trigger_name));

    const resIdx = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'knowledge_chunks' 
      AND indexname = 'knowledge_chunks_embedding_idx';
    `);
    console.log('Indexes found:', resIdx.rows.map(r => r.indexname));

  } catch (err) {
    console.error('❌ Error during verification:', err);
  } finally {
    await client.end();
  }
}

check();
