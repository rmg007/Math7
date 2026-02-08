const { Client } = require('pg');
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

    const res = await client.query(`
      SELECT routine_definition 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'submit_attempt_and_update_progress';
    `);
    console.log('RPC Definition:', res.rows[0].routine_definition);

  } catch (err) {
    console.error('❌ Error checking database:', err);
  } finally {
    await client.end();
  }
}

check();
