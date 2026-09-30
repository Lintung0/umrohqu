-- Migration: Add data diri columns to booking_participants
-- Run this in Supabase SQL Editor

ALTER TABLE public.booking_participants
  ADD COLUMN IF NOT EXISTS passport_expiry date,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS rt_rw text;

-- Verify columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'booking_participants'
  AND column_name IN ('passport_expiry', 'birth_date', 'birth_place', 'emergency_contact_name', 'emergency_contact_phone', 'street', 'city', 'province', 'postal_code', 'village', 'district', 'rt_rw')
ORDER BY column_name;