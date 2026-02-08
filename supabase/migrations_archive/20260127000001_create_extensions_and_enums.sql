-- Migration: 20260127000001_create_extensions_and_enums.sql
-- Description: Create enum types for user roles and question types

-- User Roles
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Question Types
DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM (
    'multiple_choice',  -- Single correct answer from options
    'mcq_multi',        -- Multiple correct answers allowed
    'text_input',       -- Free text entry
    'boolean',          -- True/False
    'reorder_steps'     -- Order items correctly
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
