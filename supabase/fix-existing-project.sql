-- =========================================================
-- BULLETPROOF BACKFILL: Run this in Supabase SQL Editor
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING)
-- =========================================================

-- STEP 0: Rename old enum values if they still exist (safe, idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'marketplace_billing' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role RENAME VALUE 'marketplace_billing' TO 'marketplace_finance';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'marketplace_support' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role RENAME VALUE 'marketplace_support' TO 'marketplace_operational';
  END IF;
END $$;

-- STEP 0.5: Add missing columns if they don't exist (safe, idempotent)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS country_code text;

ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS departure_cities text[];
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS departure_month text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS is_promo boolean DEFAULT false;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS available integer;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS hotel_makkah text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS hotel_makkah_stars integer;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS hotel_madinah text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS hotel_madinah_stars integer;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS itinerary jsonb;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS includes text[];
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS excludes text[];
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS terms text[];
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS cancellation_policy text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS response text;

-- Also ensure users table has profile column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile jsonb DEFAULT '{}';

-- STEP 1: Drop broken trigger first (it causes errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- STEP 2: Drop broken function and recreate with correct search_path
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role, tenant_id, profile)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'customer'::user_role),
    CASE WHEN NEW.raw_user_meta_data ? 'tenant_id'
      THEN (NEW.raw_user_meta_data ->> 'tenant_id')::uuid
      ELSE NULL
    END,
    jsonb_build_object(
      'avatar_url', COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', ''),
      'provider', COALESCE(NEW.raw_user_meta_data ->> 'provider', 'email')
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Insert auth.users (all test accounts)
-- Password: Password123!
-- Email format: {phone}@phone.umrohq.id (matches login page)

-- Admin Utama
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  '081111111111@phone.umrohq.id',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Utama","role":"marketplace_admin"}',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Admin Finance (was Billing)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated',
  '081222222222@phone.umrohq.id',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Finance","role":"marketplace_finance"}',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Admin Operational (was Support)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000003',
  'authenticated', 'authenticated',
  '081333333333@phone.umrohq.id',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Operational","role":"marketplace_operational"}',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Travel Admin Al-Haramain
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '20000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  '082111111111@phone.umrohq.id',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Al-Haramain","role":"travel_admin","tenant_id":"b0000000-0000-0000-0000-000000000001"}',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Travel Admin Baitullah
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '20000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated',
  '082222222222@phone.umrohq.id',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Baitullah","role":"travel_admin","tenant_id":"b0000000-0000-0000-0000-000000000002"}',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Customer Ahmad
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '30000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  '081298765432@phone.umrohq.id',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ahmad Fauzi","role":"customer","phone":"081298765432"}',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Customer Siti
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '30000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated',
  '081398765433@phone.umrohq.id',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Siti Rahmawati","role":"customer","phone":"081398765433"}',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- STEP 4: Insert public.users explicitly (bypasses trigger)
-- =========================================================

INSERT INTO public.users (id, email, full_name, phone, role, tenant_id, profile)
VALUES
  ('10000000-0000-0000-0000-000000000001', '081111111111@phone.umrohq.id', 'Admin Utama', NULL, 'marketplace_admin'::user_role, NULL, '{"provider":"email","avatar_url":""}'),
  ('10000000-0000-0000-0000-000000000002', '081222222222@phone.umrohq.id', 'Admin Finance', NULL, 'marketplace_finance'::user_role, NULL, '{"provider":"email","avatar_url":""}'),
  ('10000000-0000-0000-0000-000000000003', '081333333333@phone.umrohq.id', 'Admin Operational', NULL, 'marketplace_operational'::user_role, NULL, '{"provider":"email","avatar_url":""}'),
  ('20000000-0000-0000-0000-000000000001', '082111111111@phone.umrohq.id', 'Admin Al-Haramain', '082111111111', 'travel_admin'::user_role, 'b0000000-0000-0000-0000-000000000001', '{"provider":"email","avatar_url":""}'),
  ('20000000-0000-0000-0000-000000000002', '082222222222@phone.umrohq.id', 'Admin Baitullah', '082222222222', 'travel_admin'::user_role, 'b0000000-0000-0000-0000-000000000002', '{"provider":"email","avatar_url":""}'),
  ('30000000-0000-0000-0000-000000000001', '081298765432@phone.umrohq.id', 'Ahmad Fauzi', '081298765432', 'customer'::user_role, NULL, '{"provider":"email","avatar_url":""}'),
  ('30000000-0000-0000-0000-000000000002', '081398765433@phone.umrohq.id', 'Siti Rahmawati', '081398765433', 'customer'::user_role, NULL, '{"provider":"email","avatar_url":""}')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- STEP 5: Seed tenants (if not exists)
-- =========================================================

INSERT INTO public.tenants (id, name, slug, contact_email, contact_phone, status, logo_url, city, description, founded, phone, is_verified, is_featured, country, country_code, packages_count)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Al-Haramain Tour', 'al-haramain-tour', 'info@alharamain.id', '081234567890', 'verified', 'https://ui-avatars.com/api/?name=Al+Haramain&background=2A7D4F&color=fff&size=128&bold=true', 'Jakarta', 'Biro perjalanan umroh & haji terpercaya sejak 2005.', '2005', '081234567890', true, true, 'Indonesia', 'id', 5),
  ('b0000000-0000-0000-0000-000000000002', 'Baitullah Travel', 'baitullah-travel', 'info@baitullah.id', '082134567891', 'verified', 'https://ui-avatars.com/api/?name=Baitullah&background=1d6b42&color=fff&size=128&bold=true', 'Surabaya', 'Spesialis umroh dan haji khusus dari Jawa Timur.', '2009', '082134567891', true, true, 'Indonesia', 'id', 4),
  ('b0000000-0000-0000-0000-000000000003', 'Mabrur Wisata', 'mabrur-wisata', 'info@mabrur.id', '083134567892', 'verified', 'https://ui-avatars.com/api/?name=Mabrur&background=059669&color=fff&size=128&bold=true', 'Bandung', 'Travel umroh amanah dari Bandung.', '2012', '083134567892', true, false, 'Indonesia', 'id', 3),
  ('b0000000-0000-0000-0000-000000000004', 'Zamzam Tour', 'zamzam-tour', 'info@zamzam.id', '084134567893', 'verified', 'https://ui-avatars.com/api/?name=Zamzam&background=0d9488&color=fff&size=128&bold=true', 'Medan', 'Travel umroh terbesar di Sumatera.', '2008', '084134567893', true, true, 'Indonesia', 'id', 4)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- STEP 6: Seed packages (if not exists)
-- =========================================================

INSERT INTO public.packages (id, tenant_id, name, slug, description, price, currency, quota, departure_city, departure_date, duration_days, airline, status, is_shared_to_marketplace, type, departure_cities, departure_month, original_price, image_url, is_promo, is_active, available, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars, includes, excludes, country, country_code, city)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Umroh Reguler 12 Hari', 'umroh-reguler-12-hari', 'Paket umroh reguler 12 hari dengan hotel bintang 4 dekat Masjidil Haram', 52000000, 'IDR', 45, 'Jakarta', '2026-03-15', 12, 'Garuda Indonesia', 'published', true, 'reguler', '["Jakarta","Surabaya"]'::jsonb, 'Maret 2026', 55000000, 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=300&fit=crop&auto=format', false, true, 30, 'Pullman Zamzam', 5, 'Madinah Hilton', 4, '["Hotel bintang 4","Visa","Tiket pesawat","Muthawwif","Transport"]'::jsonb, '["Makan","Tips","Perlengkapan"]'::jsonb, 'Indonesia', 'id', 'Jakarta'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Umroh VIP Bintang 5', 'umroh-vip-bintang-5', 'Paket VIP dengan hotel bintang 5 langsung view Masjidil Haram', 85000000, 'IDR', 20, 'Jakarta', '2026-04-01', 14, 'Emirates', 'published', true, 'vip', '["Jakarta"]'::jsonb, 'April 2026', 90000000, 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=600&h=300&fit=crop&auto=format', false, true, 12, 'Fairmont Makkah', 5, 'Madinah Marriott', 5, '["Hotel bintang 5","Visa","Tiket pesawat bisnis","Muthawwif VIP","Transport AC","Laundry"]'::jsonb, '["Makan fullboard","Tips"]'::jsonb, 'Indonesia', 'id', 'Jakarta'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Umroh Plus Turki 15 Hari', 'umroh-plus-turki-15-hari', 'Umroh plus wisata Istanbul dan Cappadocia', 65000000, 'IDR', 30, 'Jakarta', '2026-03-20', 15, 'Turkish Airlines', 'published', true, 'plus', '["Jakarta","Bandung"]'::jsonb, 'Maret 2026', 70000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=600&h=300&fit=crop&auto=format', true, true, 18, 'Hilton Makkah', 5, 'Madinah Rotana', 4, '["Hotel bintang 5","Visa","Tiket pesawat","Muthawwif","Transport","Wisata Turki"]'::jsonb, '["Makan"]'::jsonb, 'Indonesia', 'id', 'Jakarta'),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Umroh Hemat 9 Hari', 'umroh-hemat-9-hari', 'Paket hemat umroh 9 hari untuk budget-conscious', 28000000, 'IDR', 50, 'Surabaya', '2026-02-10', 9, 'Lion Air', 'published', true, 'hemat', '["Surabaya"]'::jsonb, 'Februari 2026', 30000000, 'https://images.unsplash.com/photo-1592609931041-40265b692757?w=600&h=300&fit=crop&auto=format', true, true, 35, 'Fajr Bawadi', 3, 'Madinah Golden', 3, '["Hotel bintang 3","Visa","Tiket pesawat","Muthawwif"]'::jsonb, '["Makan 2x","Tips"]'::jsonb, 'Indonesia', 'id', 'Surabaya'),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Umroh Keluarga Premium', 'umroh-keluarga-premium', 'Paket khusus keluarga dengan fasilitas lengkap dan child-friendly', 48000000, 'IDR', 25, 'Bandung', '2026-04-10', 11, 'Singapore Airlines', 'published', true, 'premium', '["Bandung","Jakarta"]'::jsonb, 'April 2026', 52000000, 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=600&h=300&fit=crop&auto=format', false, true, 15, 'Swissotel Makkah', 5, 'Madinah Intercontinental', 5, '["Hotel bintang 5","Visa","Tiket pesawat","Muthawwif keluarga","Transport pribadi"]'::jsonb, '["Makan","Perlengkapan"]'::jsonb, 'Indonesia', 'id', 'Bandung')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- STEP 7: Seed bookings, participants, payments, invoices, reviews
-- =========================================================

INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, payment_status, pilgrim_count, price, fee, total, notes, payment_method, va_number)
VALUES ('aa100000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'marketplace', 'confirmed', 'paid', 2, 104000000, 3120000, 107120000, 'Mohon hotel dekat pintu utama', 'va_bca', '8801234567890123')
ON CONFLICT DO NOTHING;

INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, payment_status, pilgrim_count, price, fee, total, payment_method, va_number)
VALUES ('aa100000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'marketplace', 'pending_payment', 'pending', 1, 28000000, 840000, 28840000, 'va_mandiri', '8809876543210123')
ON CONFLICT DO NOTHING;

INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, payment_status, pilgrim_count, price, fee, total, payment_method, va_number, payment_deadline)
VALUES ('aa100000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'marketplace', 'completed', 'paid', 3, 78000000, 2340000, 80340000, 'bca_va', 'VA-2026-003', (now() - interval '29 days')::timestamptz)
ON CONFLICT DO NOTHING;

INSERT INTO public.booking_participants (booking_id, full_name, id_number, nik, gender, phone, relation)
VALUES
  ('aa100000-0000-0000-0000-000000000001', 'Ahmad Fauzi', '3201234567890001', '3201234567890001', 'male', '081298765432', 'self'),
  ('aa100000-0000-0000-0000-000000000001', 'Fatimah Fauzi', '3201234567890002', '3201234567890002', 'female', '081298765433', 'companion'),
  ('aa100000-0000-0000-0000-000000000002', 'Siti Rahmawati', '3201234567890003', '3201234567890003', 'female', '081398765433', 'self'),
  ('aa100000-0000-0000-0000-000000000003', 'Ahmad Fauzi', '3201234567890001', '3201234567890001', 'male', '081298765432', 'self'),
  ('aa100000-0000-0000-0000-000000000003', 'Hasan Fauzi', '3201234567890004', '3201234567890004', 'male', '081298765434', 'companion'),
  ('aa100000-0000-0000-0000-000000000003', 'Hussein Fauzi', '3201234567890005', '3201234567890005', 'male', '081298765435', 'companion')
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (booking_id, tenant_id, status, gateway, gateway_reference, amount, paid_at)
VALUES ('aa100000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'paid', 'mandiri_va', 'VA-2026-001', 107120000, now() - interval '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (booking_id, tenant_id, status, gateway, gateway_reference, amount, paid_at)
VALUES ('aa100000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'paid', 'bca_va', 'VA-2026-003', 80340000, now() - interval '30 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (booking_id, tenant_id, total, status, due_date, paid_at, type, description, amount)
VALUES ('aa100000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3120000, 'paid', (now() + interval '14 days')::timestamptz, now() - interval '5 days', 'service_fee', 'Service fee - Ahmad Fauzi (2 orang)', 3120000)
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (booking_id, tenant_id, total, status, due_date, type, description, amount)
VALUES ('aa100000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 840000, 'issued', (now() + interval '14 days')::timestamptz, 'service_fee', 'Service fee - Siti Rahmawati', 840000)
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (booking_id, tenant_id, total, status, due_date, paid_at, type, description, amount)
VALUES ('aa100000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 2340000, 'paid', (now() - interval '16 days')::timestamptz, now() - interval '30 days', 'service_fee', 'Service fee - Ahmad Fauzi (3 orang)', 2340000)
ON CONFLICT DO NOTHING;

INSERT INTO public.reviews (booking_id, customer_id, tenant_id, rating, review, status)
VALUES ('aa100000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 5, 'Alhamdulillah, perjalanan umroh sangat lancar. Hotel bersih, makanan enak, muthawfif ramah dan profesional. Sangat recommended!', 'published')
ON CONFLICT DO NOTHING;

-- =========================================================
-- DONE! After running, test login with:
-- Phone: 081111111111  -> Admin Utama
-- Phone: 081222222222  -> Admin Finance
-- Phone: 081333333333  -> Admin Operational
-- Phone: 082111111111  -> Travel Admin Al-Haramain
-- Phone: 082222222222  -> Travel Admin Baitullah
-- Phone: 081298765432  -> Customer Ahmad
-- Phone: 081398765433  -> Customer Siti
-- Password for all: Password123!
-- =========================================================
