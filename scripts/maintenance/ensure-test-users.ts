import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '..', 'admin-panel', '.env.test.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.test.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function ensureUser(email: string, role: string) {
  console.log(`Ensuring user exists: ${email} (${role})`);
  
  // Check if user exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError);
    return;
  }

  const existingUser = users.users.find(u => u.email === email);
  let userId = existingUser?.id;

  if (!existingUser) {
    console.log(`Creating user: ${email}`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: email, // email == password convention
      email_confirm: true,
      user_metadata: { role }
    });

    if (createError) {
      console.error(`Failed to create user ${email}:`, createError);
      return;
    }
    userId = newUser.user.id;
  }

  // Ensure profile exists with correct role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    console.log(`Creating profile for ${email}`);
    // Get first app for testing
    const { data: apps } = await supabase.from('apps').select('app_id').limit(1);
    const appId = apps?.[0]?.app_id;

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        role,
        app_id: appId
      });

    if (insertError) {
      console.error(`Failed to create profile for ${email}:`, insertError);
    }
  } else if (profile.role !== role) {
    console.log(`Updating role for ${email} to ${role}`);
    await supabase.from('profiles').update({ role }).eq('id', userId);
  }
}

async function main() {
  await ensureUser('mhalim80@hotmail.com', 'super_admin');
  await ensureUser('testadmin@example.com', 'admin');
  await ensureUser('testmentor@example.com', 'mentor');
  console.log('Done.');
}

main();
