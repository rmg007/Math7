const { Client } = require('pg');
require('dotenv').config();

const dbPassword = process.env.DB_PASSWORD || 'QpJIzi2r6vaoghG5';
const projectRef = process.env.SUPABASE_PROJECT_REF || 'qvslbiceoonrgjxzkotb';
const dbUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

async function testAlert() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    console.log('🚀 Inserting critical error...');
    const res = await client.query(`
      INSERT INTO public.error_logs (
        platform,
        error_type,
        error_message,
        extra_context
      ) VALUES (
        'web',
        'CRITICAL_DATABASE_FAILURE',
        'Test critical error for Phase 16',
        '{"severity": "critical"}'::jsonb
      ) RETURNING id, extra_context;
    `);

    const inserted = res.rows[0];
    console.log('✅ Error inserted with ID:', inserted.id);
    console.log('Extra Context:', inserted.extra_context);

    if (inserted.extra_context.alert_needed === 'true') {
      console.log('✨ Success: alert_needed flag set correctly!');
    } else {
      console.warn('⚠️ Warning: alert_needed flag NOT set. Check trigger logic.');
    }

  } catch (err) {
    console.error('❌ Error testing alert:', err);
  } finally {
    await client.end();
  }
}

testAlert();
