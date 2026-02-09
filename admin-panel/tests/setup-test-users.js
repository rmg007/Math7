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
];

async function createTestUser(userData) {
  console.log(`\n📝 Creating user: ${userData.email}`);

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === userData.email);

    if (existingUser) {
      console.log(`⚠️  User already exists: ${userData.email}`);
      console.log(`   Deleting existing user...`);
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error(`❌ Error deleting user: ${deleteError.message}`);
        return false;
      }
      console.log(`✅ Deleted existing user`);
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: userData.metadata,
    });

    if (error) {
      console.error(`❌ Error creating user: ${error.message}`);
      return false;
    }

    console.log(`✅ User created successfully: ${userData.email}`);
    console.log(`   User ID: ${data.user.id}`);

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
    const success = await createTestUser(userData);
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
