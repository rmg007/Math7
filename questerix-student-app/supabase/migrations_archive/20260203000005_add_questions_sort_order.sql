-- Migration: 20260203000005_add_questions_sort_order.sql
-- Description: Add sort_order column to questions table

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
