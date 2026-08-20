-- =========================================================
-- UmrohQ — Complete Database Schema + Seed Data
-- Untuk dijalankan di Supabase SQL Editor (New Query)
-- Password semua akun: Password123!
-- =========================================================
-- CARA PAKAI:
-- 1. Buat Supabase project baru
-- 2. Buka SQL Editor
-- 3. Paste seluruh isi file ini
-- 4. Klik "Run"
-- 5. Semua tabel, RLS, trigger, dan data siap digunakan
-- =========================================================

-- =========================================================
-- PART 1: EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- PART 2: ENUM TYPES
-- =========================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'admin','finance','operational',
    'travel_admin','travel_operational','travel_finance','customer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM ('pending','verified','suspended','rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE package_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE promotion_type AS ENUM ('discount_percent','discount_amount','bundle','voucher');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bidding_status AS ENUM ('active','outbid','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_channel AS ENUM ('marketplace','agency_subdomain','agency_custom_domain');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending_payment','confirmed','cancelled','completed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded','partially_refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending','published','hidden','rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE template_status AS ENUM ('active','draft','archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE page_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================
-- PART 3: CORE TABLES
-- =========================================================

-- 3.1 Tenants (Travel Agencies)
DROP TABLE IF EXISTS public.tenants CASCADE;
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  custom_domain text UNIQUE,
  contact_email text,
  contact_phone text,
  config jsonb NOT NULL DEFAULT '{}',
  status tenant_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  -- Frontend columns
  logo_url text,
  city text,
  description text,
  founded text,
  brand_color text,
  phone text,
  website text,
  is_verified boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  country text,
  country_code text,
  packages_count integer NOT NULL DEFAULT 0,
  total_revenue numeric(14,2) NOT NULL DEFAULT 0,
  founded_year text
);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- 3.2 Users (Profil — 1:1 dengan auth.users)
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text,
  full_name text,
  role user_role NOT NULL DEFAULT 'customer',
  tenant_id uuid REFERENCES public.tenants(id),
  profile jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX idx_users_role ON public.users(role);

-- 3.3 Website Templates
DROP TABLE IF EXISTS public.website_templates CASCADE;
CREATE TABLE public.website_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  preview_url text,
  status template_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  description text,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  used_by_count integer NOT NULL DEFAULT 0
);

-- 3.4 Tenant Websites (1:1 per tenant)
DROP TABLE IF EXISTS public.tenant_websites CASCADE;
CREATE TABLE public.tenant_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.website_templates(id),
  theme_config jsonb NOT NULL DEFAULT '{}',
  seo_meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.5 Packages
DROP TABLE IF EXISTS public.packages CASCADE;
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'IDR',
  quota integer NOT NULL DEFAULT 0,
  departure_city text,
  departure_date date,
  duration_days integer,
  hotel_info jsonb NOT NULL DEFAULT '{}',
  airline text,
  facilities jsonb NOT NULL DEFAULT '{}',
  status package_status NOT NULL DEFAULT 'draft',
  is_shared_to_marketplace boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  -- Frontend columns
  type text NOT NULL DEFAULT 'reguler',
  departure_cities jsonb NOT NULL DEFAULT '[]',
  departure_month text,
  original_price numeric(14,2),
  image_url text,
  is_promo boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  available integer NOT NULL DEFAULT 0,
  hotel_makkah text,
  hotel_makkah_stars integer DEFAULT 5,
  hotel_madinah text,
  hotel_madinah_stars integer DEFAULT 5,
  itinerary jsonb NOT NULL DEFAULT '[]',
  includes jsonb NOT NULL DEFAULT '[]',
  excludes jsonb NOT NULL DEFAULT '[]',
  terms jsonb NOT NULL DEFAULT '[]',
  cancellation_policy text,
  country text,
  country_code text,
  city text,
  UNIQUE (tenant_id, slug)
);
CREATE INDEX idx_packages_status ON public.packages(status);
CREATE INDEX idx_packages_tenant_id ON public.packages(tenant_id);

-- 3.6 Promotions
DROP TABLE IF EXISTS public.promotions CASCADE;
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type promotion_type NOT NULL,
  value numeric(14,2) NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  -- Frontend columns
  title text,
  code text,
  description text,
  discount_type text,
  discount_value numeric(14,2),
  min_booking numeric(14,2),
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  max_usage integer
);
CREATE INDEX idx_promotions_tenant_id ON public.promotions(tenant_id);

-- 3.7 Biddings (Sponsored Ranking)
DROP TABLE IF EXISTS public.biddings CASCADE;
CREATE TABLE public.biddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bid_value numeric(14,2) NOT NULL,
  status bidding_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  start_date date,
  end_date date,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  position integer
);
CREATE INDEX idx_biddings_package_id ON public.biddings(package_id);
CREATE INDEX idx_biddings_status ON public.biddings(status);

-- 3.8 Bookings
DROP TABLE IF EXISTS public.bookings CASCADE;
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  customer_id uuid NOT NULL REFERENCES public.users(id),
  booking_channel booking_channel NOT NULL DEFAULT 'marketplace',
  status booking_status NOT NULL DEFAULT 'pending_payment',
  pilgrim_count integer NOT NULL DEFAULT 1,
  price numeric(14,2) NOT NULL,
  fee numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  -- Payment columns
  payment_status text DEFAULT 'pending',
  payment_method text,
  va_number text,
  payment_code text,
  payment_deadline timestamptz
);
CREATE INDEX idx_bookings_tenant_id ON public.bookings(tenant_id);
CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- 3.9 Booking Participants
DROP TABLE IF EXISTS public.booking_participants CASCADE;
CREATE TABLE public.booking_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  id_number text,
  relation text NOT NULL DEFAULT 'self',
  created_at timestamptz NOT NULL DEFAULT now(),
  nik text,
  passport_no text,
  passport_expiry date,
  birth_date date,
  gender text,
  phone text
);
CREATE INDEX idx_booking_participants_booking_id ON public.booking_participants(booking_id);

-- 3.10 Payments
DROP TABLE IF EXISTS public.payments CASCADE;
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  status payment_status NOT NULL DEFAULT 'pending',
  gateway text,
  gateway_reference text,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'IDR',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);

-- 3.11 Invoices
DROP TABLE IF EXISTS public.invoices CASCADE;
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  total numeric(14,2),
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  type text DEFAULT 'service_fee',
  description text,
  amount numeric(14,2)
);
CREATE INDEX idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- 3.12 Reviews
DROP TABLE IF EXISTS public.reviews CASCADE;
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.users(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  status review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);

-- 3.13 Custom Pages (CMS)
DROP TABLE IF EXISTS public.custom_pages CASCADE;
CREATE TABLE public.custom_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  status page_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  page_type text,
  category text,
  UNIQUE (tenant_id, url)
);
CREATE INDEX idx_custom_pages_tenant_id ON public.custom_pages(tenant_id);

-- 3.14 Articles
DROP TABLE IF EXISTS public.articles CASCADE;
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  category text,
  image_url text,
  author text,
  read_time text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_articles_slug ON public.articles(slug);

-- 3.15 Fee Config (Single-row config)
DROP TABLE IF EXISTS public.fee_config CASCADE;
CREATE TABLE public.fee_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_fee_per_person numeric(14,2) NOT NULL DEFAULT 500000,
  subdomain_fee_per_person numeric(14,2) NOT NULL DEFAULT 250000,
  custom_domain_fee_per_person numeric(14,2) NOT NULL DEFAULT 500000,
  service_fee_percent numeric(5,2) NOT NULL DEFAULT 3,
  service_fee_flat numeric(14,2) NOT NULL DEFAULT 300000,
  setup_fee numeric(14,2) NOT NULL DEFAULT 5000000,
  tax_percent numeric(5,2) NOT NULL DEFAULT 11,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.16 Wishlists
DROP TABLE IF EXISTS public.wishlists CASCADE;
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, package_id)
);
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);

-- 3.17 Support Tickets
DROP TABLE IF EXISTS public.support_tickets CASCADE;
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text,
  response text,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);

-- 3.18 Payouts
DROP TABLE IF EXISTS public.payouts CASCADE;
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  amount numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  period_start date,
  period_end date,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_tenant_id ON public.payouts(tenant_id);

-- 3.19 Contact Messages
DROP TABLE IF EXISTS public.contact_messages CASCADE;
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.20 Package Gallery
DROP TABLE IF EXISTS public.package_gallery CASCADE;
CREATE TABLE public.package_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_package_gallery_package_id ON public.package_gallery(package_id);

-- 3.21 Notifications
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.users(id),
  channel text NOT NULL DEFAULT 'system',
  template_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.22 Audit Logs
DROP TABLE IF EXISTS public.audit_logs CASCADE;
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.users(id),
  tenant_id uuid REFERENCES public.tenants(id),
  action text NOT NULL,
  object_type text NOT NULL,
  object_id uuid,
  meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);

-- =========================================================
-- PART 4: VIEWS (for code that queries 'bids' table)
-- =========================================================
DROP VIEW IF EXISTS public.bids CASCADE;
CREATE VIEW public.bids AS
SELECT
  b.id,
  b.tenant_id AS travel_id,
  b.bid_value,
  (b.status = 'active') AS is_active,
  b.impressions,
  b.clicks,
  b.start_date,
  b.end_date,
  b.position,
  b.created_at,
  b.updated_at
FROM public.biddings b;

-- =========================================================
-- PART 5: TRIGGER — updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(array[
      'tenants','users','tenant_websites','website_templates','packages',
      'promotions','biddings','bookings','payments','invoices','reviews',
      'custom_pages','articles','support_tickets'
    ])
  LOOP
    -- Drop existing trigger first
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- =========================================================
-- PART 5b: OTP CODES TABLE (WhatsApp OTP)
-- =========================================================
DROP TABLE IF EXISTS public.otp_codes CASCADE;
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL DEFAULT 'password_reset',
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_purpose ON public.otp_codes(phone, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes(expires_at);
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_manage_otp" ON public.otp_codes;
CREATE POLICY "service_role_manage_otp" ON public.otp_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- PART 6: TRIGGER — Auto-create public.users from auth.users
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role, tenant_id, profile)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    COALESCE(new.raw_user_meta_data ->> 'phone', NULL),
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'customer'::user_role),
    CASE WHEN new.raw_user_meta_data ? 'tenant_id'
      THEN (new.raw_user_meta_data ->> 'tenant_id')::uuid
      ELSE NULL
    END,
    jsonb_build_object(
      'avatar_url', COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''),
      'provider', COALESCE(new.raw_user_meta_data ->> 'provider', 'email')
    )
  )
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger is created AFTER seed data (see Part 6b below)

-- =========================================================
-- PART 7: HELPER FUNCTIONS FOR RLS
-- =========================================================
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.auth_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_marketplace_staff()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(public.auth_role(), '') IN
    ('admin','finance','operational');
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_staff(check_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(public.auth_role(), '') IN ('travel_admin','travel_operational','travel_finance')
    AND public.auth_tenant_id() = check_tenant_id;
$$;

-- =========================================================
-- PART 8: ROW LEVEL SECURITY
-- =========================================================

-- 8.1 tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_can_view_verified_tenants" ON public.tenants;
CREATE POLICY "public_can_view_verified_tenants" ON public.tenants
  FOR SELECT TO anon, authenticated
  USING (status = 'verified' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "tenant_staff_view_own" ON public.tenants;
CREATE POLICY "tenant_staff_view_own" ON public.tenants
  FOR SELECT TO authenticated
  USING (public.is_tenant_staff(id));
DROP POLICY IF EXISTS "marketplace_staff_manage" ON public.tenants;
CREATE POLICY "marketplace_staff_manage" ON public.tenants
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.2 users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_view_own" ON public.users;
CREATE POLICY "user_view_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());
DROP POLICY IF EXISTS "user_update_own" ON public.users;
CREATE POLICY "user_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "marketplace_staff_manage_users" ON public.users;
CREATE POLICY "marketplace_staff_manage_users" ON public.users
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());
DROP POLICY IF EXISTS "tenant_staff_view_own_users" ON public.users;
CREATE POLICY "tenant_staff_view_own_users" ON public.users
  FOR SELECT TO authenticated
  USING (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "user_insert_own" ON public.users;
CREATE POLICY "user_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 8.3 website_templates
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_active_templates" ON public.website_templates;
CREATE POLICY "public_view_active_templates" ON public.website_templates
  FOR SELECT TO anon, authenticated
  USING (status = 'active' OR is_active = true);
DROP POLICY IF EXISTS "marketplace_staff_manage_templates" ON public.website_templates;
CREATE POLICY "marketplace_staff_manage_templates" ON public.website_templates
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.4 tenant_websites
ALTER TABLE public.tenant_websites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_tenant_websites" ON public.tenant_websites;
CREATE POLICY "public_view_tenant_websites" ON public.tenant_websites
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tenant_staff_manage_own_website" ON public.tenant_websites;
CREATE POLICY "tenant_staff_manage_own_website" ON public.tenant_websites
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_staff_manage_all_websites" ON public.tenant_websites;
CREATE POLICY "marketplace_staff_manage_all_websites" ON public.tenant_websites
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.5 packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_published_packages" ON public.packages;
CREATE POLICY "public_view_published_packages" ON public.packages
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "tenant_staff_manage_own_packages" ON public.packages;
CREATE POLICY "tenant_staff_manage_own_packages" ON public.packages
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_staff_manage_all_packages" ON public.packages;
CREATE POLICY "marketplace_staff_manage_all_packages" ON public.packages
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());
DROP POLICY IF EXISTS "customer_view_all_packages" ON public.packages;
CREATE POLICY "customer_view_all_packages" ON public.packages
  FOR SELECT TO authenticated
  USING (true);

-- 8.6 promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_active_promotions" ON public.promotions;
CREATE POLICY "public_view_active_promotions" ON public.promotions
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND deleted_at IS NULL);
DROP POLICY IF EXISTS "tenant_staff_manage_own_promotions" ON public.promotions;
CREATE POLICY "tenant_staff_manage_own_promotions" ON public.promotions
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_staff_manage_all_promotions" ON public.promotions;
CREATE POLICY "marketplace_staff_manage_all_promotions" ON public.promotions
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.7 biddings
ALTER TABLE public.biddings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_staff_manage_own_bids" ON public.biddings;
CREATE POLICY "tenant_staff_manage_own_bids" ON public.biddings
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_staff_manage_all_bids" ON public.biddings;
CREATE POLICY "marketplace_staff_manage_all_bids" ON public.biddings
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());
DROP POLICY IF EXISTS "public_view_active_biddings" ON public.biddings;
CREATE POLICY "public_view_active_biddings" ON public.biddings
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- 8.8 bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_view_own_bookings" ON public.bookings;
CREATE POLICY "customer_view_own_bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "customer_create_own_booking" ON public.bookings;
CREATE POLICY "customer_create_own_booking" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "customer_update_own_booking" ON public.bookings;
CREATE POLICY "customer_update_own_booking" ON public.bookings
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "tenant_staff_manage_own_bookings" ON public.bookings;
CREATE POLICY "tenant_staff_manage_own_bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_staff_manage_all_bookings" ON public.bookings;
CREATE POLICY "marketplace_staff_manage_all_bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.9 booking_participants
ALTER TABLE public.booking_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "access_via_booking" ON public.booking_participants;
CREATE POLICY "access_via_booking" ON public.booking_participants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_participants.booking_id
        AND (b.customer_id = auth.uid() OR public.is_tenant_staff(b.tenant_id) OR public.is_marketplace_staff())
    )
  );

-- 8.10 payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_view_own_payments" ON public.payments;
CREATE POLICY "customer_view_own_payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = payments.booking_id AND b.customer_id = auth.uid())
  );
DROP POLICY IF EXISTS "tenant_manage_own_payments" ON public.payments;
CREATE POLICY "tenant_manage_own_payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_manage_all_payments" ON public.payments;
CREATE POLICY "marketplace_manage_all_payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.11 invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_manage_own_invoices" ON public.invoices;
CREATE POLICY "tenant_manage_own_invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_manage_all_invoices" ON public.invoices;
CREATE POLICY "marketplace_manage_all_invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());
DROP POLICY IF EXISTS "customer_view_own_invoices" ON public.invoices;
CREATE POLICY "customer_view_own_invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = invoices.booking_id AND b.customer_id = auth.uid())
  );

-- 8.12 reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_published_reviews" ON public.reviews;
CREATE POLICY "public_view_published_reviews" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "customer_manage_own_review" ON public.reviews;
CREATE POLICY "customer_manage_own_review" ON public.reviews
  FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "marketplace_manage_all_reviews" ON public.reviews;
CREATE POLICY "marketplace_manage_all_reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.13 custom_pages
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_published_pages" ON public.custom_pages;
CREATE POLICY "public_view_published_pages" ON public.custom_pages
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "tenant_manage_own_pages" ON public.custom_pages;
CREATE POLICY "tenant_manage_own_pages" ON public.custom_pages
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_manage_all_pages" ON public.custom_pages;
CREATE POLICY "marketplace_manage_all_pages" ON public.custom_pages
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.14 articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_published_articles" ON public.articles;
CREATE POLICY "public_view_published_articles" ON public.articles
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL);
DROP POLICY IF EXISTS "marketplace_manage_articles" ON public.articles;
CREATE POLICY "marketplace_manage_articles" ON public.articles
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.15 fee_config
ALTER TABLE public.fee_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_view_fee_config" ON public.fee_config;
CREATE POLICY "auth_view_fee_config" ON public.fee_config
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "marketplace_manage_fee_config" ON public.fee_config;
CREATE POLICY "marketplace_manage_fee_config" ON public.fee_config
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.16 wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_manage_own_wishlist" ON public.wishlists;
CREATE POLICY "user_manage_own_wishlist" ON public.wishlists
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8.17 support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_manage_own_tickets" ON public.support_tickets;
CREATE POLICY "tenant_manage_own_tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.is_tenant_staff(tenant_id))
  WITH CHECK (public.is_tenant_staff(tenant_id));
DROP POLICY IF EXISTS "marketplace_manage_all_tickets" ON public.support_tickets;
CREATE POLICY "marketplace_manage_all_tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.18 payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketplace_manage_payouts" ON public.payouts;
CREATE POLICY "marketplace_manage_payouts" ON public.payouts
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());
DROP POLICY IF EXISTS "tenant_view_own_payouts" ON public.payouts;
CREATE POLICY "tenant_view_own_payouts" ON public.payouts
  FOR SELECT TO authenticated
  USING (public.is_tenant_staff(tenant_id));

-- 8.19 contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_contact" ON public.contact_messages;
CREATE POLICY "anon_insert_contact" ON public.contact_messages
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "marketplace_manage_contacts" ON public.contact_messages;
CREATE POLICY "marketplace_manage_contacts" ON public.contact_messages
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.20 package_gallery
ALTER TABLE public.package_gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_gallery" ON public.package_gallery;
CREATE POLICY "public_view_gallery" ON public.package_gallery
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tenant_manage_own_gallery" ON public.package_gallery;
CREATE POLICY "tenant_manage_own_gallery" ON public.package_gallery
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_gallery.package_id AND public.is_tenant_staff(p.tenant_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_gallery.package_id AND public.is_tenant_staff(p.tenant_id))
  );

-- 8.21 notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_view_own_notifications" ON public.notifications;
CREATE POLICY "user_view_own_notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "marketplace_manage_notifications" ON public.notifications;
CREATE POLICY "marketplace_manage_notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_marketplace_staff())
  WITH CHECK (public.is_marketplace_staff());

-- 8.22 audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketplace_view_audit_logs" ON public.audit_logs;
CREATE POLICY "marketplace_view_audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_marketplace_staff());

-- =========================================================
-- PART 9: SEED DATA
-- =========================================================

-- 9.1 Fee Config
INSERT INTO public.fee_config (id, portal_fee_per_person, subdomain_fee_per_person, custom_domain_fee_per_person, service_fee_percent, service_fee_flat, setup_fee, tax_percent)
VALUES ('a0000000-0000-0000-0000-000000000001', 500000, 250000, 500000, 3, 300000, 5000000, 11)
ON CONFLICT (id) DO NOTHING;

-- 9.2 Tenants (Travel Agencies)
INSERT INTO public.tenants (id, name, slug, contact_email, contact_phone, status, logo_url, city, description, founded, phone, is_verified, is_featured, country, country_code, packages_count, total_revenue, founded_year)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Al-Haramain Tour', 'al-haramain-tour', 'info@alharamain.id', '081234567890', 'verified', 'https://ui-avatars.com/api/?name=Al+Haramain&background=2A7D4F&color=fff&size=128&bold=true', 'Jakarta', 'Biro perjalanan umroh & haji terpercaya sejak 2005. Telah memberangkatkan lebih dari 50.000 jamaah.', '2005', '081234567890', true, true, 'Indonesia', 'id', 5, 450000000, '2005'),
  ('b0000000-0000-0000-0000-000000000002', 'Baitullah Travel', 'baitullah-travel', 'info@baitullah.id', '082134567891', 'verified', 'https://ui-avatars.com/api/?name=Baitullah&background=1d6b42&color=fff&size=128&bold=true', 'Surabaya', 'Spesialis umroh dan haji khusus dari Jawa Timur. Armada mandiri, muthawwif berpengalaman.', '2009', '082134567891', true, true, 'Indonesia', 'id', 4, 320000000, '2009'),
  ('b0000000-0000-0000-0000-000000000003', 'Mabrur Wisata', 'mabrur-wisata', 'info@mabrur.id', '083134567892', 'verified', 'https://ui-avatars.com/api/?name=Mabrur&background=059669&color=fff&size=128&bold=true', 'Bandung', 'Travel umroh amanah dari Bandung. Paket terjangkau tanpa mengorbankan kualitas.', '2012', '083134567892', true, false, 'Indonesia', 'id', 3, 180000000, '2012'),
  ('b0000000-0000-0000-0000-000000000004', 'Zamzam Tour', 'zamzam-tour', 'info@zamzam.id', '084134567893', 'verified', 'https://ui-avatars.com/api/?name=Zamzam&background=0d9488&color=fff&size=128&bold=true', 'Medan', 'Travel umroh terbesar di Sumatera. Keberangkatan rutin tiap bulan.', '2008', '084134567893', true, true, 'Indonesia', 'id', 4, 275000000, '2008'),
  ('b0000000-0000-0000-0000-000000000005', 'Nur Ilahi Travel', 'nur-ilahi-travel', 'info@nurilahi.id', '085134567894', 'pending', 'https://ui-avatars.com/api/?name=Nur+Ilahi&background=7c3aed&color=fff&size=128&bold=true', 'Makassar', 'Travel umroh terpercaya dari Sulawesi. Melayani keberangkatan dari Makassar.', '2015', '085134567894', false, false, 'Indonesia', 'id', 0, 0, '2015')
ON CONFLICT (id) DO NOTHING;

-- 9.3 Website Templates
INSERT INTO public.website_templates (id, name, preview_url, status, description, category, is_active, used_by_count)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Modern Islamic', 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', 'active', 'Template modern dengan nuansa hijau emas', 'Premium', true, 3),
  ('c0000000-0000-0000-0000-000000000002', 'Clean Minimal', 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', 'active', 'Desain bersih dan minimalis', 'Basic', true, 1),
  ('c0000000-0000-0000-0000-000000000003', 'Royal Gold', 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', 'draft', 'Template mewah untuk travel eksklusif', 'Premium', false, 0)
ON CONFLICT (id) DO NOTHING;

-- 9.4 Packages
INSERT INTO public.packages (id, tenant_id, name, slug, description, price, currency, quota, departure_city, departure_date, duration_days, airline, status, type, departure_cities, departure_month, original_price, image_url, is_promo, is_active, available, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars, facilities, country, country_code)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Umroh Reguler 12 Hari', 'umroh-reguler-12-hari', 'Paket umroh reguler dengan hotel bintang 4 dekat Masjidil Haram. Includes muthawwif, visa, dan transportasi.', 35000000, 'IDR', 45, 'Jakarta', '2026-09-15', 12, 'Garuda Indonesia', 'published', 'reguler', '["Jakarta","Bandung"]', 'September 2026', 38000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', true, true, 20, 'Al Kiswah Hotel', 4, 'Royal Inn Madinah', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 4","Bus AC","Muthawwif","Makan 3x","Ziarah"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Umroh VIP 10 Hari', 'umroh-vip-10-hari', 'Paket VIP dengan hotel bintang 5 tepi Masjidil Haram. Fasilitas premium, private muthawwif.', 52000000, 'IDR', 20, 'Jakarta', '2026-10-01', 10, 'Saudi Airlines', 'published', 'vip', '["Jakarta"]', 'Oktober 2026', 55000000, 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', false, true, 8, 'Pullman Zamzam Makkah', 5, 'Madinah Hilton', 5, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 5","Bus AC","Private Muthawwif","Makan VIP","Ziarah VIP","Laundry"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Umroh Plus Aqsho', 'umroh-plus-aqsho', 'Paket umroh + ziarah Aqsha/Jordania. Includes semua fasilitas umroh + tour Aqsha.', 45000000, 'IDR', 30, 'Jakarta', '2026-11-10', 15, 'Royal Jordanian', 'published', 'plus', '["Jakarta","Surabaya"]', 'November 2026', 48000000, 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', true, true, 12, 'Al Safwah Royale', 5, 'Madinah Plaza', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 5","Bus AC","Muthawwif","Makan 3x","Tour Aqsha","Laundry"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Umroh Reguler 9 Hari', 'umroh-reguler-9h-baitullah', 'Paket umroh hemat 9 hari dari Surabaya. Cocok untuk jamaah dengan budget terjangkau.', 28000000, 'IDR', 50, 'Surabaya', '2026-09-20', 9, 'Lion Air', 'published', 'reguler', '["Surabaya"]', 'September 2026', 30000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', true, true, 25, 'Al Ehsan Hotel', 3, 'Madinah Grand', 3, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 3","Bus AC","Muthawwif","Makan 3x"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Umroh Furoda 12 Hari', 'umroh-furoda-12h-baitullah', 'Paket Furoda (hak khusus) dengan kuota Kemenag. Hotel bintang 4, pelayanan terbaik.', 42000000, 'IDR', 25, 'Surabaya', '2026-10-05', 12, 'Batik Air', 'published', 'furoda', '["Surabaya","Malang"]', 'Oktober 2026', 45000000, 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', false, true, 10, 'Nasim Royal Hotel', 4, 'Rawdah Munawwarah', 4, '["Visa Furoda","Tiket Pesawat","Hotel Bintang 4","Bus AC","Muthawwif","Makan 3x","Ziarah"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'Umroh Hemat 9 Hari', 'umroh-hemat-9h-mabrur', 'Paket umroh termurah dari Bandung. Hotel dekat Masjidil Haram, muthawwif bersertifikat.', 26000000, 'IDR', 40, 'Bandung', '2026-09-25', 9, 'Lion Air', 'published', 'reguler', '["Bandung"]', 'September 2026', 28000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', true, true, 22, 'Al Mutmainnah', 3, 'Madinah Suites', 3, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 3","Bus","Muthawwif","Makan 3x"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'Umroh Reguler 12 Hari', 'umroh-reguler-12h-mabrur', 'Paket reguler 12 hari dengan hotel bintang 4. Fasilitas lengkap, jadwal pasti berangkat.', 34000000, 'IDR', 35, 'Bandung', '2026-10-15', 12, 'Garuda Indonesia', 'published', 'reguler', '["Bandung","Jakarta"]', 'Oktober 2026', NULL, 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', false, true, 15, 'Al Kiswah Towers', 4, 'Oberoi Madinah', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 4","Bus AC","Muthawwif","Makan 3x","Ziarah","Laundry"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 'Umroh Reguler 11 Hari', 'umroh-reguler-11h-zamzam', 'Paket umroh dari Medan dengan jadwal pasti. Hotel strategis, muthawwif lokal dan Arab.', 33000000, 'IDR', 40, 'Medan', '2026-09-18', 11, 'Garuda Indonesia', 'published', 'reguler', '["Medan","Pekanbaru"]', 'September 2026', 35000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', false, true, 18, 'Fajr Al Bader', 4, 'Madinah Hariyah', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 4","Bus AC","Muthawwif","Makan 3x","Ziarah"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004', 'Umroh VIP 10 Hari', 'umroh-vip-10h-zamzam', 'Paket VIP dari Medan. Hotel bintang 5, fasilitas premium, jadwal pasti berangkat.', 50000000, 'IDR', 15, 'Medan', '2026-10-10', 10, 'Saudi Airlines', 'published', 'vip', '["Medan"]', 'Oktober 2026', 53000000, 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', true, true, 5, 'Conrad Makkah', 5, 'Madinah Marriott', 5, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 5","Bus VIP","Private Muthawwif","Makan VIP","Ziarah VIP","Laundry","Airport Lounge"]', 'Indonesia', 'id'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000004', 'Umroh Plus Turki 16 Hari', 'umroh-plus-turki-16h-zamzam', 'Paket umroh + wisata Turki (Istanbul, Bursa). Combines umroh dengan city tour.', 55000000, 'IDR', 20, 'Medan', '2026-11-01', 16, 'Turkish Airlines', 'published', 'plus', '["Medan"]', 'November 2026', 58000000, 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', false, true, 10, 'Hilton Makkah', 5, 'Anwar Al Madinah', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 5","Bus AC","Muthawwif","Makan 3x","City Tour Turki","Laundry"]', 'Indonesia', 'id')
ON CONFLICT (id) DO NOTHING;

-- 9.5 Biddings
INSERT INTO public.biddings (id, package_id, tenant_id, bid_value, status, start_date, end_date, impressions, clicks, position)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 15000, 'active', '2026-07-01', '2026-08-31', 12500, 850, 1),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 12000, 'active', '2026-07-01', '2026-08-31', 9800, 620, 2),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004', 10000, 'active', '2026-07-15', '2026-09-15', 7200, 410, 3)
ON CONFLICT (id) DO NOTHING;

-- 9.6 Promotions
INSERT INTO public.promotions (id, tenant_id, type, value, config, active, starts_at, ends_at, title, code, description, discount_type, discount_value, min_booking, valid_until, is_active, usage_count, max_usage)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'discount_percent', 10, '{}', true, '2026-07-01', '2026-12-31', 'Promo Awal Tahun', 'NEWYEAR10', 'Diskon 10% untuk semua paket umroh minimal 9 hari', 'percent', 10, 25000000, '2026-12-31', true, 45, 500),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'discount_amount', 500000, '{}', true, '2026-07-01', '2026-09-30', 'Cashback Rp500K', 'CASHBACK500', 'Cashback Rp500.000 untuk pemesanan paket VIP', 'fixed', 500000, 40000000, '2026-09-30', true, 12, 100),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'discount_percent', 5, '{}', true, '2026-07-01', '2026-08-31', 'Promo Baitullah', 'BAIT5', 'Diskon 5% untuk paket Baitullah Travel', 'percent', 5, 20000000, '2026-08-31', true, 8, 200),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'discount_amount', 250000, '{}', true, '2026-07-15', '2026-10-15', 'Promo Zamzam', 'ZAMZAM250', 'Cashback Rp250K untuk paket Zamzam Tour', 'fixed', 250000, 30000000, '2026-10-15', true, 3, 50)
ON CONFLICT (id) DO NOTHING;

-- 9.7 Articles
INSERT INTO public.articles (id, title, slug, content, excerpt, category, image_url, author, published_at)
VALUES
  ('aa000000-0000-0000-0000-000000000001', 'Panduan Lengkap Persiapan Umroh 2026', 'panduan-persiapan-umroh-2026', 'Persiapan umroh memerlukan perencanaan matang. Mulai dari dokumen, kesehatan, hingga doa-doa yang perlu dipahami.', 'Panduan lengkap persiapan umroh dari A sampai Z', 'Tips', 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', 'Redaksi UmrohQ', '2026-07-01'),
  ('aa000000-0000-0000-0000-000000000002', 'Perbedaan Umroh Reguler, VIP, dan Furoda', 'perbedaan-tipe-umroh', 'Banyak calon jamaah bingung memilih tipe umroh. Berikut penjelasan lengkapnya.', 'Mengenal perbedaan umroh reguler, VIP, dan Furoda', 'Edukasi', 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', 'Redaksi UmrohQ', '2026-07-10'),
  ('aa000000-0000-0000-0000-000000000003', 'Tips Memilih Travel Umroh Terpercaya', 'tips-memilih-travel-terpercaya', 'Memilih travel umroh yang tepat adalah langkah awal yang krusial. Berikut tips jitu memilih travel terpercaya.', 'Tips memilih travel umroh yang amanah dan terpercaya', 'Tips', 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', 'Redaksi UmrohQ', '2026-07-20')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 9.8 USERS (via auth.users → trigger creates public.users)
-- Password: Password123! untuk semua
-- =========================================================
-- Cleanup
DELETE FROM auth.users WHERE email IN (
  '081111111111@phone.umrohq.id', '082222222222@phone.umrohq.id', '083333333333@phone.umrohq.id',
  '085555555501@phone.umrohq.id', '085555555502@phone.umrohq.id', '085555555503@phone.umrohq.id', '085555555504@phone.umrohq.id',
  '081298765432@phone.umrohq.id', '081398765433@phone.umrohq.id'
);

-- Admin Utama
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '081111111111@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Utama","role":"admin","phone":"081111111111"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Admin Billing
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', '082222222222@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Finance","role":"finance","phone":"082222222222"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Admin Support
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', '083333333333@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Operational","role":"operational","phone":"083333333333"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Travel Admin (Al-Haramain)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '085555555501@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Al-Haramain","role":"travel_admin","tenant_id":"b0000000-0000-0000-0000-000000000001","phone":"085555555501"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Travel Admin (Baitullah)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', '085555555502@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Baitullah","role":"travel_admin","tenant_id":"b0000000-0000-0000-0000-000000000002","phone":"085555555502"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Travel Admin (Mabrur)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', '085555555503@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Mabrur","role":"travel_admin","tenant_id":"b0000000-0000-0000-0000-000000000003","phone":"085555555503"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Travel Admin (Zamzam)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', '085555555504@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Zamzam","role":"travel_admin","tenant_id":"b0000000-0000-0000-0000-000000000004","phone":"085555555504"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Customer 1
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '081298765432@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ahmad Fauzi","role":"customer","phone":"081298765432"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Customer 2
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', '081398765433@phone.umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Siti Rahmawati","role":"customer","phone":"081398765433"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 9.9 Explicit INSERT public.users (tidak depends on trigger)
-- Kalau trigger sudah jalan, ON CONFLICT DO NOTHING skip.
-- Kalau trigger gagal, INSERT ini tetap buat row-nya.
INSERT INTO public.users (id, email, full_name, phone, role, tenant_id, profile)
VALUES
  ('10000000-0000-0000-0000-000000000001', '081111111111@phone.umrohq.id', 'Admin Utama', '081111111111', 'admin', NULL, '{"provider":"email","avatar_url":""}'),
  ('10000000-0000-0000-0000-000000000002', '082222222222@phone.umrohq.id', 'Admin Finance', '082222222222', 'finance', NULL, '{"provider":"email","avatar_url":""}'),
  ('10000000-0000-0000-0000-000000000003', '083333333333@phone.umrohq.id', 'Admin Operational', '083333333333', 'operational', NULL, '{"provider":"email","avatar_url":""}'),
  ('20000000-0000-0000-0000-000000000001', '085555555501@phone.umrohq.id', 'Admin Al-Haramain', '085555555501', 'travel_admin', 'b0000000-0000-0000-0000-000000000001', '{"provider":"email","avatar_url":""}'),
  ('20000000-0000-0000-0000-000000000002', '085555555502@phone.umrohq.id', 'Admin Baitullah', '085555555502', 'travel_admin', 'b0000000-0000-0000-0000-000000000002', '{"provider":"email","avatar_url":""}'),
  ('20000000-0000-0000-0000-000000000003', '085555555503@phone.umrohq.id', 'Admin Mabrur', '085555555503', 'travel_admin', 'b0000000-0000-0000-0000-000000000003', '{"provider":"email","avatar_url":""}'),
  ('20000000-0000-0000-0000-000000000004', '085555555504@phone.umrohq.id', 'Admin Zamzam', '085555555504', 'travel_admin', 'b0000000-0000-0000-0000-000000000004', '{"provider":"email","avatar_url":""}'),
  ('30000000-0000-0000-0000-000000000001', '081298765432@phone.umrohq.id', 'Ahmad Fauzi', '081298765432', 'customer', NULL, '{"provider":"email","avatar_url":""}'),
  ('30000000-0000-0000-0000-000000000002', '081398765433@phone.umrohq.id', 'Siti Rahmawati', '081398765433', 'customer', NULL, '{"provider":"email","avatar_url":""}')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 9.10 BOOKINGS + PARTICIPANTS + PAYMENTS + INVOICES
-- =========================================================

-- Booking 1: Ahmad Fauzi → VIP Al-Haramain → confirmed
INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, payment_status, pilgrim_count, price, fee, total, notes, payment_method, va_number)
VALUES ('aa100000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'marketplace', 'confirmed', 'paid', 2, 104000000, 3120000, 107120000, 'Mohon hotel dekat pintu utama', 'va_bca', '8801234567890123');

INSERT INTO public.booking_participants (booking_id, full_name, id_number, nik, gender, phone, relation)
VALUES
  ('aa100000-0000-0000-0000-000000000001', 'Ahmad Fauzi', '3201234567890001', '3201234567890001', 'male', '081298765432', 'self'),
  ('aa100000-0000-0000-0000-000000000001', 'Fatimah Fauzi', '3201234567890002', '3201234567890002', 'female', '081298765433', 'companion');

INSERT INTO public.payments (booking_id, tenant_id, status, gateway, gateway_reference, amount, paid_at)
VALUES ('aa100000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'paid', 'mandiri_va', 'VA-2026-001', 107120000, now() - interval '5 days');

INSERT INTO public.invoices (booking_id, tenant_id, total, status, due_date, paid_at, type, description, amount)
VALUES ('aa100000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3120000, 'paid', (now() + interval '14 days')::timestamptz, now() - interval '5 days', 'service_fee', 'Service fee booking Umroh VIP - Ahmad Fauzi (2 orang)', 3120000);

-- Booking 2: Siti Rahmawati → Reguler Baitullah → pending
INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, payment_status, pilgrim_count, price, fee, total, payment_method, va_number)
VALUES ('aa100000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'marketplace', 'pending_payment', 'pending', 1, 28000000, 840000, 28840000, 'va_mandiri', '8809876543210123');

INSERT INTO public.booking_participants (booking_id, full_name, id_number, nik, gender, phone, relation)
VALUES ('aa100000-0000-0000-0000-000000000002', 'Siti Rahmawati', '3201234567890003', '3201234567890003', 'female', '081398765433', 'self');

INSERT INTO public.invoices (booking_id, tenant_id, total, status, due_date, type, description, amount)
VALUES ('aa100000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 840000, 'issued', (now() + interval '14 days')::timestamptz, 'service_fee', 'Service fee booking Umroh Reguler - Siti Rahmawati', 840000);

-- Booking 3: Ahmad Fauzi → Hemat Mabrur → completed
INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, payment_status, pilgrim_count, price, fee, total, payment_method, va_number, payment_deadline)
VALUES ('aa100000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'marketplace', 'completed', 'paid', 3, 78000000, 2340000, 80340000, 'bca_va', 'VA-2026-003', (now() - interval '29 days')::timestamptz);

INSERT INTO public.booking_participants (booking_id, full_name, id_number, nik, gender, phone, relation)
VALUES
  ('aa100000-0000-0000-0000-000000000003', 'Ahmad Fauzi', '3201234567890001', '3201234567890001', 'male', '081298765432', 'self'),
  ('aa100000-0000-0000-0000-000000000003', 'Hasan Fauzi', '3201234567890004', '3201234567890004', 'male', '081298765434', 'companion'),
  ('aa100000-0000-0000-0000-000000000003', 'Hussein Fauzi', '3201234567890005', '3201234567890005', 'male', '081298765435', 'companion');

INSERT INTO public.payments (booking_id, tenant_id, status, gateway, gateway_reference, amount, paid_at)
VALUES ('aa100000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'paid', 'bca_va', 'VA-2026-003', 80340000, now() - interval '30 days');

INSERT INTO public.invoices (booking_id, tenant_id, total, status, due_date, paid_at, type, description, amount)
VALUES ('aa100000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 2340000, 'paid', (now() - interval '16 days')::timestamptz, now() - interval '30 days', 'service_fee', 'Service fee booking Umroh Hemat - Ahmad Fauzi (3 orang)', 2340000);

-- 9.11 Reviews
INSERT INTO public.reviews (booking_id, customer_id, tenant_id, rating, review, status)
VALUES
  ('aa100000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 5, 'Alhamdulillah, perjalanan umroh sangat lancar. Hotel bersih, makanan enak, muthawfif ramah dan profesional. Sangat recommended!', 'published');

-- 9.12 Support Tickets
INSERT INTO public.support_tickets (id, tenant_id, subject, description, category, priority, status)
VALUES
  ('bb000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Paket tidak muncul di pencarian', 'Paket umroh reguler kami tidak muncul di halaman pencarian marketplace', 'technical', 'high', 'open'),
  ('bb000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Perubahan jadwal keberangkatan', 'Mohon bantuan untuk mengubah jadwal keberangkatan paket VIP dari Oktober ke November', 'general', 'medium', 'in_progress');

-- 9.13 Contact Messages
INSERT INTO public.contact_messages (name, email, phone, subject, message)
VALUES
  ('Budi Santoso', 'budi@email.com', '08123456789', 'Informasi Paket', 'Apakah ada paket umroh dengan keberangkatan dari Yogyakarta?'),
  ('Rina Wati', 'rina@email.com', '08567890123', 'Kendala Pembayaran', 'Saya sudah transfer tapi status booking masih pending. Mohon bantu.');

-- =========================================================
-- PART 6b: CREATE TRIGGER (setelah seed data, bukan sebelum)
-- =========================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- SELESAI!
-- =========================================================
-- Ringkasan:
-- 14 role enum types
-- 22 tabel utama
-- 1 view (bids → biddings)
-- 22+ RLS policies
-- 4 travel agencies (3 verified + 1 pending)
-- 3 website templates
-- 10 paket umroh
-- 3 biddings aktif
-- 4 promosi
-- 3 artikel
-- 9 users (3 admin + 4 travel + 2 customer)
-- 3 bookings (1 confirmed, 1 pending, 1 completed)
-- 8 booking participants
-- 2 payments
-- 3 invoices
-- 1 review
-- 2 support tickets
-- 2 contact messages
-- 1 fee config
-- Password semua: Password123!
-- =========================================================
