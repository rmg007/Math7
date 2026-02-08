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
    const res = await client.query("SELECT extname FROM pg_extension WHERE extname = 'pg_net';");
    console.log('pg_net enabled:', res.rows.length > 0);
  } catch (err) {
    console.error('❌ Error checking extensions:', err);
  } finally {
    await client.end();
  }
}

check();
