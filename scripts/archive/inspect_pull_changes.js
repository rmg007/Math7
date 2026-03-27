const { Client } = require('pg');
const dbPassword = process.env.DB_PASSWORD || 'QpJIzi2r6vaoghG5';
const projectRef = process.env.SUPABASE_PROJECT_REF || 'qvslbiceoonrgjxzkotb';
const dbUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

async function inspect() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT pg_get_functiondef(p.oid) 
      FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'pull_changes';
    `);
    console.log(res.rows[0]?.pg_get_functiondef);
  } catch (err) {
    console.error('❌ Error inspecting RPC:', err);
  } finally {
    await client.end();
  }
}

inspect();
