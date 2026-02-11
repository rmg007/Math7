
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qvslbiceoonrgjxzkotb.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c2xiaWNlb29ucmdqeHprb3RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUxMTk2OSwiZXhwIjoyMDg1MDg3OTY5fQ.Q9LagVfNQ2Zc7EeMpehBU5IUeI1ENy5pguueSsD1FAQ';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('Starting fix for test user profile...');

  // 1. Get first active app
  const { data: apps, error: appsError } = await supabase
    .from('apps')
    .select('app_id')
    .eq('is_active', true)
    .order('display_name', { ascending: true })
    .limit(1)
    .single();

  if (appsError || !apps) {
    console.error('Failed to fetch apps:', appsError);
    process.exit(1);
  }

  const targetAppId = apps.app_id;
  console.log(`Found target App ID: ${targetAppId}`);

  // 2. Iterate ALL users
  // Use auth admin API to list users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Failed to list users:', authError);
    process.exit(1);
  }

  console.log(`Found ${users.length} users. Updating all profiles...`);
  
  for (const user of users) {
      console.log(`Updating user: ${user.email} (${user.id})`);
      
      // Update metadata (both app and user to cover all bases)
      await supabase.auth.admin.updateUserById(
        user.id,
        { 
          app_metadata: { user_role: 'super_admin' },
          user_metadata: { user_role: 'super_admin' }
        }
      );

      // Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          email: user.email,
          app_id: targetAppId,
          role: 'super_admin',
          updated_at: new Date()
        }, { onConflict: 'id' });

      if (profileError) {
        console.error(`Failed to update profile for ${user.email}:`, profileError);
      } else {
        console.log(`Updated profile for ${user.email}`);
      }
  }

  console.log('Finished updating all users.');
}

main().catch(console.error);
