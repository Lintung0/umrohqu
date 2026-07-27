-- =========================================================
-- UmrohQ — Migration: Add columns needed by frontend
-- =========================================================

-- A.1 promotions — tambah kolom flat untuk frontend
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric(14,2),
  ADD COLUMN IF NOT EXISTS min_booking numeric(14,2),
  ADD COLUMN IF NOT EXISTS valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean not null default true,
  ADD COLUMN IF NOT EXISTS usage_count integer not null default 0,
  ADD COLUMN IF NOT EXISTS max_usage integer;

-- A.2 website_templates — tambah kolom frontend
ALTER TABLE public.website_templates
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS is_active boolean not null default true,
  ADD COLUMN IF NOT EXISTS used_by_count integer not null default 0;

-- A.3 biddings — tambah kolom position
ALTER TABLE public.biddings
  ADD COLUMN IF NOT EXISTS position integer;

-- A.4 custom_pages — tambah kolom untuk FAQ
ALTER TABLE public.custom_pages
  ADD COLUMN IF NOT EXISTS page_type text,
  ADD COLUMN IF NOT EXISTS category text;

-- A.5 invoices — tambah kolom type & description
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS type text default 'service_fee',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS amount numeric(14,2);

-- A.6 tenants — tambah kolom is_verified, is_featured, packages_count, total_revenue
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_verified boolean not null default false,
  ADD COLUMN IF NOT EXISTS is_featured boolean not null default false,
  ADD COLUMN IF NOT EXISTS packages_count integer not null default 0,
  ADD COLUMN IF NOT EXISTS total_revenue numeric(14,2) not null default 0,
  ADD COLUMN IF NOT EXISTS founded_year text;
