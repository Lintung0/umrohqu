-- =========================================================
-- UmrohQ — Migration: ALTER existing tables + CREATE new tables
-- Jalankan via Supabase SQL Editor
-- =========================================================

-- ---------------------------------------------------------
-- PART A: ALTER EXISTING TABLES
-- ---------------------------------------------------------

-- A.1 packages — tambah kolom sesuai frontend
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS type text not null default 'reguler',
  ADD COLUMN IF NOT EXISTS departure_cities jsonb not null default '[]',
  ADD COLUMN IF NOT EXISTS departure_month text,
  ADD COLUMN IF NOT EXISTS original_price numeric(14,2),
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_promo boolean not null default false,
  ADD COLUMN IF NOT EXISTS is_active boolean not null default true,
  ADD COLUMN IF NOT EXISTS available integer not null default 0,
  ADD COLUMN IF NOT EXISTS hotel_makkah text,
  ADD COLUMN IF NOT EXISTS hotel_makkah_stars integer default 5,
  ADD COLUMN IF NOT EXISTS hotel_madinah text,
  ADD COLUMN IF NOT EXISTS hotel_madinah_stars integer default 5,
  ADD COLUMN IF NOT EXISTS itinerary jsonb not null default '[]',
  ADD COLUMN IF NOT EXISTS includes jsonb not null default '[]',
  ADD COLUMN IF NOT EXISTS excludes jsonb not null default '[]',
  ADD COLUMN IF NOT EXISTS terms jsonb not null default '[]',
  ADD COLUMN IF NOT EXISTS cancellation_policy text;

-- A.2 biddings — tambah kolom tracking
ALTER TABLE public.biddings
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS impressions integer not null default 0,
  ADD COLUMN IF NOT EXISTS clicks integer not null default 0;

-- A.3 tenants — tambah kolom eksplisit (dari config jsonb)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS founded text,
  ADD COLUMN IF NOT EXISTS brand_color text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text;

-- A.4 booking_participants — tambah kolom data jamaah
ALTER TABLE public.booking_participants
  ADD COLUMN IF NOT EXISTS nik text,
  ADD COLUMN IF NOT EXISTS passport_no text,
  ADD COLUMN IF NOT EXISTS passport_expiry date,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS phone text;

-- ---------------------------------------------------------
-- PART B: NEW TABLES
-- ---------------------------------------------------------

-- B.1 fee_config — pengaturan biaya platform (single-row config)
CREATE TABLE IF NOT EXISTS public.fee_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_fee_per_person numeric(14,2) NOT NULL DEFAULT 300000,
  subdomain_fee_per_person numeric(14,2) NOT NULL DEFAULT 100000,
  custom_domain_fee_per_person numeric(14,2) NOT NULL DEFAULT 100000,
  service_fee_percent numeric(5,2) NOT NULL DEFAULT 3,
  service_fee_flat numeric(14,2) NOT NULL DEFAULT 300000,
  setup_fee numeric(14,2) NOT NULL DEFAULT 5000000,
  tax_percent numeric(5,2) NOT NULL DEFAULT 11,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace staff manage fee config" ON public.fee_config
  FOR ALL TO authenticated
  USING (is_marketplace_staff())
  WITH CHECK (is_marketplace_staff());

CREATE POLICY "authenticated can view fee config" ON public.fee_config
  FOR SELECT TO authenticated
  USING (true);

-- Insert default row
INSERT INTO public.fee_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- B.2 wishlists — paket favorit user
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, package_id)
);

CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_package_id ON public.wishlists(package_id);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manage own wishlist" ON public.wishlists
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- B.3 package_gallery — multiple gambar per paket
CREATE TABLE IF NOT EXISTS public.package_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_package_gallery_package_id ON public.package_gallery(package_id);

ALTER TABLE public.package_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can view package gallery" ON public.package_gallery
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "tenant staff manage own package gallery" ON public.package_gallery
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.packages p
      WHERE p.id = package_gallery.package_id
        AND is_tenant_staff(p.tenant_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.packages p
      WHERE p.id = package_gallery.package_id
        AND is_tenant_staff(p.tenant_id)
    )
  );

-- B.4 articles — blog/platform content
CREATE TABLE IF NOT EXISTS public.articles (
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
CREATE INDEX idx_articles_category ON public.articles(category);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can view published articles" ON public.articles
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL);

CREATE POLICY "marketplace staff manage articles" ON public.articles
  FOR ALL TO authenticated
  USING (is_marketplace_staff())
  WITH CHECK (is_marketplace_staff());

-- B.5 contact_messages — form kontak
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can insert contact message" ON public.contact_messages
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "marketplace staff manage contact messages" ON public.contact_messages
  FOR ALL TO authenticated
  USING (is_marketplace_staff())
  WITH CHECK (is_marketplace_staff());

-- B.6 support_tickets — tiket kendala admin
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant staff view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (is_tenant_staff(tenant_id));

CREATE POLICY "tenant staff create ticket" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (is_tenant_staff(tenant_id));

CREATE POLICY "marketplace staff manage tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (is_marketplace_staff())
  WITH CHECK (is_marketplace_staff());

-- B.7 payouts — payout ke travel
CREATE TABLE IF NOT EXISTS public.payouts (
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
CREATE INDEX idx_payouts_status ON public.payouts(status);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace staff manage payouts" ON public.payouts
  FOR ALL TO authenticated
  USING (is_marketplace_staff())
  WITH CHECK (is_marketplace_staff());

CREATE POLICY "tenant staff view own payouts" ON public.payouts
  FOR SELECT TO authenticated
  USING (is_tenant_staff(tenant_id));

-- ---------------------------------------------------------
-- PART C: UPDATE EXISTING TRIGGER (tambah tabel baru)
-- ---------------------------------------------------------

-- Drop old trigger function and recreate with new tables
DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS trg_tenant_websites_updated_at ON public.tenant_websites;
DROP TRIGGER IF EXISTS trg_website_templates_updated_at ON public.website_templates;
DROP TRIGGER IF EXISTS trg_packages_updated_at ON public.packages;
DROP TRIGGER IF EXISTS trg_promotions_updated_at ON public.promotions;
DROP TRIGGER IF EXISTS trg_biddings_updated_at ON public.biddings;
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS trg_invoices_updated_at ON public.invoices;
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
DROP TRIGGER IF EXISTS trg_custom_pages_updated_at ON public.custom_pages;

-- Recreate updated_at trigger for all tables that need it
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
    EXECUTE format(
      'create trigger trg_%I_updated_at before update on %I for each row execute function set_updated_at();',
      t, t
    );
  END loop;
END $$;
