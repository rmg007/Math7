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

    const resCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attempts' AND table_schema = 'public';
    `);
    console.log('Attempts columns:', resCols.rows.map(r => r.column_name));

  } catch (err) {
    console.error('❌ Error checking database:', err);
  } finally {
    await client.end();
  }
}

check();
