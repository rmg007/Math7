-- Admin Panel E2E Test Users Setup Script
-- Run this script in your Supabase SQL Editor to create test users
-- 
-- Convention: password == email (for all test accounts)
-- Only accounts verified to work in production Supabase are listed here.

-- ============================================
-- Verified Working Accounts
-- ============================================
--
-- | Role         | Email                   | Password (== email)       |
-- |------------- |------------------------ |---------------------------|
-- | Super Admin  | mhalim80@hotmail.com    | mhalim80@hotmail.com      |
-- | Admin        | testadmin@example.com   | testadmin@example.com     |
-- | Admin (1)    | admin1@example.com      | admin1@example.com        |
-- | Admin (2)    | admin2@example.com      | admin2@example.com        |
-- | Admin (3)    | admin3@example.com      | admin3@example.com        |
--
-- NOTE: Create users via Supabase Dashboard or Auth API.
-- Direct SQL insertion into auth.users is unreliable.

-- ============================================
-- Verify Existing Users
-- ============================================

SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email IN (
  'mhalim80@hotmail.com',
  'testadmin@example.com',
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);
