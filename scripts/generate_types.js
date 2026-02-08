const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Credentials
const dbPassword = 'QpJIzi2r6vaoghG5';
const projectRef = '[YOUR-PROJECT-ID]';
const dbUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

const outputFile = path.join(__dirname, '..', 'admin-panel', 'src', 'lib', 'database.types.ts');

const mapPostgresToTs = (pgType) => {
  switch (pgType) {
    case 'text':
    case 'uuid':
    case 'character varying':
    case 'citext':
      return 'string';
    case 'integer':
    case 'bigint':
    case 'smallint':
    case 'numeric':
    case 'real':
    case 'double precision':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'json':
    case 'jsonb':
      return 'any'; // Could be specific interfaces if we knew them, but 'any' or 'Json' is safer for generic gen.
    case 'timestamp with time zone':
    case 'timestamp without time zone':
    case 'date':
      return 'string'; // ISO string
    default:
      return 'string'; // Fallback
  }
};

async function generate() {
  console.log(`🔌 Connecting to database...`);
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✅ Connected.`);

    // Get tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesRes.rows.map(r => r.table_name).sort();
    
    let tsContent = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {\n`;

    for (const tableName of tables) {
      console.log(`Processing table: ${tableName}`);
      
      const columnsRes = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      tsContent += `      ${tableName}: {\n`;
      tsContent += `        Row: {\n`;
      
      for (const col of columnsRes.rows) {
        const type = mapPostgresToTs(col.data_type);
        const nullable = col.is_nullable === 'YES' ? ' | null' : '';
        tsContent += `          ${col.column_name}: ${type}${nullable}\n`;
      }
      
      tsContent += `        }\n`;
      
      // Insert (all optional if nullable or has default? complex to determine defaults without more queries)
      // For simplicity, we'll make nullable fields optional in Insert
      tsContent += `        Insert: {\n`;
      for (const col of columnsRes.rows) {
        const type = mapPostgresToTs(col.data_type);
        // Approximation: if nullable -> optional. 
        // Real supabase types check 'identity' or 'default', but is_nullable is a decent proxy for MVP.
        const optional = col.is_nullable === 'YES' ? '?' : ''; 
        const nullable = col.is_nullable === 'YES' ? ' | null' : '';
        tsContent += `          ${col.column_name}${optional}: ${type}${nullable}\n`;
      }
      tsContent += `        }\n`;

      // Update (all optional)
      tsContent += `        Update: {\n`;
      for (const col of columnsRes.rows) {
        const type = mapPostgresToTs(col.data_type);
        tsContent += `          ${col.column_name}?: ${type} | null\n`;
      }
      tsContent += `        }\n`;
      
      tsContent += `        Relationships: []\n`;
      tsContent += `      }\n`;
    }

    tsContent += `    }\n`;
    tsContent += `    Views: {\n      [_ in never]: never\n    }\n`;
    tsContent += `    Functions: {\n`;
    // Add known RPCs manually or query them? 
    // Let's add submit_attempt_and_update_progress
    tsContent += `      submit_attempt_and_update_progress: {\n`;
    tsContent += `        Args: { attempts_json: Json }\n`;
    tsContent += `        Returns: Database['public']['Tables']['skill_progress']['Row'][]\n`;
    tsContent += `      }\n`;
     // Add is_admin
    tsContent += `      is_admin: {\n`;
    tsContent += `        Args: Record<PropertyKey, never>\n`;
    tsContent += `        Returns: boolean\n`;
    tsContent += `      }\n`;
    tsContent += `    }\n`;
    tsContent += `    Enums: {\n      [_ in never]: never\n    }\n`;
    tsContent += `  }\n`;
    tsContent += `}\n`;

    fs.writeFileSync(outputFile, tsContent);
    console.log(`✨ Generated types at ${outputFile}`);

  } catch (err) {
    console.error('Error generating types:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

generate();
