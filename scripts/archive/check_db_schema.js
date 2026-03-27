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

    const resFunc = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%submit_attempt%';
    `);
    console.log('RPCs found:', resFunc.rows.map(r => r.routine_name));

    const resCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'skill_progress';
    `);
    console.log('SkillProgress columns:', resCols.rows.map(r => r.column_name));

    const resBatch = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'batch_submit_attempts';
    `);
    console.log('batch_submit_attempts found:', resBatch.rows.length > 0);

  } catch (err) {
    console.error('❌ Error checking database:', err);
  } finally {
    await client.end();
  }
}

check();
