-- Migration: Add VA number and bank columns to payments table
-- Run this in Supabase SQL Editor

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS va_number text,
  ADD COLUMN IF NOT EXISTS bank text;

-- Verify columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
  AND column_name IN ('va_number', 'bank')
ORDER BY column_name;