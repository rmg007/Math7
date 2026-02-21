/**
 * Setup Test Users Script
 * 
 * This script creates test users in Supabase for E2E testing.
 * Run with: node tests/setup-test-users.js
 * 
 * Convention: password == email (for all test accounts)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.error('You can find it in: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Verified working test accounts (password == email convention)
const TEST_USERS = [
  {
    email: 'mhalim80@hotmail.com',
    password: '9eZCpZHhP9ArGuz',
    role: 'super_admin',
    metadata: {
      name: 'Ryan Gonzalez',
      role: 'super_admin',
    },
  },
  {
    email: 'testadmin@example.com',
    password: 'testadmin@example.com',
    role: 'admin',
    metadata: {
      name: 'Test Admin',
      role: 'admin',
    },
  },
  {
    email: 'admin1@example.com',
    password: 'admin1@example.com',
    role: 'admin',
    metadata: {
      name: 'Admin One',
      role: 'admin',
    },
  },
  {
    email: 'testmentor@example.com',
    password: 'testmentor@example.com',
    role: 'mentor',
    metadata: {
      name: 'Test Mentor',
      role: 'mentor',
    },
  },
  {
    email: 'teststudent@example.com',
    password: 'teststudent@example.com',
    role: 'student',
    metadata: {
      name: 'Test Student',
      role: 'student',
    },
  },
];

async function syncTestUser(userData) {
  console.log(`\n� Syncing user: ${userData.email}`);

  try {
    // Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData?.users?.find(u => u.email === userData.email);
    let userId;

    if (existingUser) {
      console.log(`ℹ️  User already exists: ${userData.email} (${existingUser.id})`);
      userId = existingUser.id;
      
      // Update existing user (password and metadata)
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: userData.password,
        user_metadata: userData.metadata,
        email_confirm: true
      });

      if (updateError) {
        console.error(`❌ Error updating user: ${updateError.message}`);
        return false;
      }
      console.log(`✅ User auth updated`);
    } else {
      // Create new user
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.metadata,
      });

      if (createError) {
        console.error(`❌ Error creating user: ${createError.message}`);
        return false;
      }
      userId = data.user.id;
      console.log(`✅ User created successfully: ${userId}`);
    }

    // Ensure public.profiles entry is correct
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.metadata.name,
        role: userData.role,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`❌ Error syncing profile: ${profileError.message}`);
      return false;
    }
    console.log(`✅ Public profile synced (Role: ${userData.role})`);

    return true;
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    return false;
  }
}

async function setupTestUsers() {
  console.log('🚀 Setting up test users for E2E testing...\n');
  console.log(`Supabase URL: ${supabaseUrl}`);

  let successCount = 0;
  let failCount = 0;

  for (const userData of TEST_USERS) {
    const success = await syncTestUser(userData);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   ✅ Successfully created: ${successCount} users`);
  console.log(`   ❌ Failed: ${failCount} users`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.log('\n⚠️  Some users failed to create. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n✨ All test users created successfully!');
    console.log('\n📝 Password convention: password == email');
  }
}

// Run the setup
setupTestUsers().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
