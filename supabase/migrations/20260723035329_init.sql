-- =========================================================
-- UmrohQ — Supabase Database Initialization Schema
-- Disusun berdasarkan PRD UmrohQ (Marketplace Haji & Umroh)
-- =========================================================
-- Catatan umum:
-- - Pola ID: uuid (gen_random_uuid()), konsisten dengan auth.users milik Supabase Auth
-- - Soft delete: kolom deleted_at pada tabel yang relevan (sesuai PRD)
-- - Tabel multi-tenant menyimpan tenant_id langsung (denormalisasi) di bookings/
--   payments/invoices/reviews supaya RLS policy tidak perlu join, lebih cepat & simpel
-- - Jalankan file ini sebagai 1 migration awal, misal:
--     supabase migration new init_schema
--     (lalu tempel isi file ini ke file migration yang dihasilkan)
-- =========================================================

-- ---------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------
create type user_role as enum (
  'admin',
  'finance',
  'operational',
  'travel_admin',
  'travel_operational',
  'travel_finance',
  'customer'
);

create type tenant_status as enum ('pending', 'verified', 'suspended', 'rejected');
create type package_status as enum ('draft', 'published', 'archived');
create type promotion_type as enum ('discount_percent', 'discount_amount', 'bundle', 'voucher');
create type bidding_status as enum ('active', 'outbid', 'expired', 'cancelled');
create type booking_channel as enum ('marketplace', 'agency_subdomain', 'agency_custom_domain');
create type booking_status as enum ('pending_payment', 'confirmed', 'cancelled', 'completed', 'refunded');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
create type invoice_status as enum ('draft', 'issued', 'paid', 'overdue', 'cancelled');
create type review_status as enum ('pending', 'published', 'hidden', 'rejected');
create type template_status as enum ('active', 'draft', 'archived');
create type page_status as enum ('draft', 'published');
create type notification_channel as enum ('email', 'whatsapp', 'push', 'system');
create type notification_status as enum ('queued', 'sent', 'failed');

-- ---------------------------------------------------------
-- 2. CORE TABLES
-- ---------------------------------------------------------

-- 2.1 Tenants (agency travel)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,              -- dipakai untuk subdomain: {slug}.umrohq.com
  custom_domain text unique,               -- domain custom milik agency, nullable
  contact_email text,
  contact_phone text,
  config jsonb not null default '{}',
  status tenant_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_tenants_status on tenants(status);
create index idx_tenants_created_at on tenants(created_at);

-- 2.2 Users (profil, 1-1 dengan auth.users milik Supabase Auth)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  phone text,
  full_name text,
  role user_role not null default 'customer',
  tenant_id uuid references tenants(id),  -- null untuk customer & role level-marketplace
  profile jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_users_tenant_id on users(tenant_id);
create index idx_users_role on users(role);

-- 2.3 Website templates (master template, dikelola marketplace admin)
create table website_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  config jsonb not null default '{}',
  preview_url text,
  status template_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.4 Tenant website settings (1-1 per tenant, hasil website builder)
create table tenant_websites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  template_id uuid references website_templates(id),
  theme_config jsonb not null default '{}',
  seo_meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.5 Packages
create table packages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  price numeric(14,2) not null,
  currency text not null default 'IDR',
  quota integer not null default 0,
  departure_city text,
  departure_date date,
  duration_days integer,
  hotel_info jsonb not null default '{}',
  airline text,
  facilities jsonb not null default '{}',
  status package_status not null default 'draft',
  is_shared_to_marketplace boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, slug)
);
create index idx_packages_status on packages(status);
create index idx_packages_created_at on packages(created_at);
create index idx_packages_tenant_id on packages(tenant_id);

-- 2.6 Promotions
create table promotions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  type promotion_type not null,
  value numeric(14,2) not null,
  config jsonb not null default '{}',
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_promotions_tenant_id on promotions(tenant_id);

-- 2.7 Bidding (sponsored ranking)
create table biddings (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  bid_value numeric(14,2) not null,
  status bidding_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_biddings_package_id on biddings(package_id);
create index idx_biddings_status on biddings(status);
-- catatan: tie-break bidding (bid-time lalu rating agency) ditangani di application logic

-- 2.8 Bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages(id),
  tenant_id uuid not null references tenants(id),   -- denormalisasi untuk RLS
  customer_id uuid not null references users(id),
  booking_channel booking_channel not null default 'marketplace',
  status booking_status not null default 'pending_payment',
  pilgrim_count integer not null default 1,
  price numeric(14,2) not null,
  fee numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_bookings_tenant_id on bookings(tenant_id);
create index idx_bookings_customer_id on bookings(customer_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_booking_channel on bookings(booking_channel);
create index idx_bookings_created_at on bookings(created_at);

-- 2.9 Booking participants (data jamaah/companion — turunan dari user flow
-- "enter details for self and companions" di PRD)
create table booking_participants (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  full_name text not null,
  id_number text,                          -- KTP/paspor
  relation text not null default 'self',   -- 'self' | 'companion'
  created_at timestamptz not null default now()
);
create index idx_booking_participants_booking_id on booking_participants(booking_id);

-- 2.10 Payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  tenant_id uuid not null references tenants(id),  -- denormalisasi untuk RLS
  status payment_status not null default 'pending',
  gateway text,
  gateway_reference text,
  amount numeric(14,2) not null,
  currency text not null default 'IDR',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payments_booking_id on payments(booking_id);
create index idx_payments_status on payments(status);

-- 2.11 Invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  booking_id uuid not null references bookings(id) on delete cascade,
  tenant_id uuid not null references tenants(id),  -- denormalisasi untuk RLS
  total numeric(14,2) not null,
  status invoice_status not null default 'draft',
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_invoices_booking_id on invoices(booking_id);
create index idx_invoices_status on invoices(status);

-- 2.12 Reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  customer_id uuid not null references users(id),
  tenant_id uuid not null references tenants(id),  -- denormalisasi untuk RLS
  rating integer not null check (rating between 1 and 5),
  review text,
  status review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_reviews_tenant_id on reviews(tenant_id);
create index idx_reviews_status on reviews(status);

-- 2.13 Custom pages (CMS: blog, testimoni, gallery, halaman custom lain)
create table custom_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  url text not null,          -- slug/path halaman
  title text not null,
  content jsonb not null default '{}',
  status page_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, url)
);
create index idx_custom_pages_tenant_id on custom_pages(tenant_id);

-- 2.14 Notifications (log pengiriman notifikasi)
create table notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  user_id uuid references users(id),
  channel notification_channel not null,
  template_key text not null,
  payload jsonb not null default '{}',
  status notification_status not null default 'queued',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_status on notifications(status);

-- 2.15 Audit log (immutable)
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  tenant_id uuid references tenants(id),
  action text not null,
  object_type text not null,
  object_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_audit_logs_tenant_id on audit_logs(tenant_id);
create index idx_audit_logs_object on audit_logs(object_type, object_id);
create index idx_audit_logs_created_at on audit_logs(created_at);

-- ---------------------------------------------------------
-- 3. TRIGGER updated_at
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'tenants','users','tenant_websites','website_templates','packages',
      'promotions','biddings','bookings','payments','invoices','reviews',
      'custom_pages'
    ])
  loop
    execute format(
      'create trigger trg_%I_updated_at before update on %I for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------
-- 4. HELPER FUNCTIONS UNTUK RLS
-- ---------------------------------------------------------
create or replace function auth_role()
returns text
language sql stable
as $$
  select role::text from public.users where id = auth.uid();
$$;

create or replace function auth_tenant_id()
returns uuid
language sql stable
as $$
  select tenant_id from public.users where id = auth.uid();
$$;

create or replace function is_marketplace_staff()
returns boolean
language sql stable
as $$
  select coalesce(auth_role(), '') in
    ('admin', 'finance', 'operational');
$$;

create or replace function is_tenant_staff(check_tenant_id uuid)
returns boolean
language sql stable
as $$
  select coalesce(auth_role(), '') in ('travel_admin', 'travel_operational', 'travel_finance')
    and auth_tenant_id() = check_tenant_id;
$$;

-- ---------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------

-- 5.1 tenants
alter table tenants enable row level security;

create policy "public can view verified tenants" on tenants
  for select to anon, authenticated
  using (status = 'verified' and deleted_at is null);

create policy "tenant staff can view own tenant" on tenants
  for select to authenticated
  using (is_tenant_staff(id));

create policy "marketplace staff manage tenants" on tenants
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.2 users
alter table users enable row level security;

create policy "user can view own profile" on users
  for select to authenticated
  using (id = auth.uid());

create policy "user can update own profile" on users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "marketplace staff manage users" on users
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

create policy "tenant staff view own tenant users" on users
  for select to authenticated
  using (is_tenant_staff(tenant_id));

-- 5.3 website_templates
alter table website_templates enable row level security;

create policy "everyone can view active templates" on website_templates
  for select to anon, authenticated
  using (status = 'active');

create policy "marketplace staff manage templates" on website_templates
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.4 tenant_websites
alter table tenant_websites enable row level security;

create policy "public can view tenant website config" on tenant_websites
  for select to anon, authenticated
  using (true);   -- dipakai untuk render situs agency, memang publik

create policy "tenant staff manage own website" on tenant_websites
  for all to authenticated
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all websites" on tenant_websites
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.5 packages
alter table packages enable row level security;

create policy "public can view published packages" on packages
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

create policy "tenant staff manage own packages" on packages
  for all to authenticated
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all packages" on packages
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.6 promotions
alter table promotions enable row level security;

create policy "public can view active promotions" on promotions
  for select to anon, authenticated
  using (active = true and deleted_at is null);

create policy "tenant staff manage own promotions" on promotions
  for all to authenticated
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all promotions" on promotions
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.7 biddings
alter table biddings enable row level security;

create policy "tenant staff manage own bids" on biddings
  for all to authenticated
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all bids" on biddings
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.8 bookings
alter table bookings enable row level security;

create policy "customer view own bookings" on bookings
  for select to authenticated
  using (customer_id = auth.uid());

create policy "customer create own booking" on bookings
  for insert to authenticated
  with check (customer_id = auth.uid());

create policy "tenant staff manage own tenant bookings" on bookings
  for all to authenticated
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all bookings" on bookings
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.9 booking_participants (ikut RLS booking induknya)
alter table booking_participants enable row level security;

create policy "access participants via booking ownership" on booking_participants
  for all to authenticated
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_participants.booking_id
        and (
          b.customer_id = auth.uid()
          or is_tenant_staff(b.tenant_id)
          or is_marketplace_staff()
        )
    )
  );

-- 5.10 payments
alter table payments enable row level security;

create policy "customer view own payments" on payments
  for select to authenticated
  using (
    exists (
      select 1 from bookings b
      where b.id = payments.booking_id and b.customer_id = auth.uid()
    )
  );

create policy "tenant staff manage own tenant payments" on payments
  for all to authenticated
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all payments" on payments
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.11 invoices (pola sama dengan payments)
alter table invoices enable row level security;

create policy "customer view own invoices" on invoices
  for select to authenticated
  using (
    exists (
      select 1 from bookings b
      where b.id = invoices.booking_id and b.customer_id = auth.uid()
    )
  );

create policy "tenant staff manage own tenant invoices" on invoices
  for all to authenticated
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all invoices" on invoices
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.12 reviews
alter table reviews enable row level security;

create policy "public can view published reviews" on reviews
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

create policy "customer manage own review" on reviews
  for all to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "tenant staff moderate own tenant reviews" on reviews
  for select to authenticated
  using (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all reviews" on reviews
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.13 custom_pages
alter table custom_pages enable row level security;

create policy "public can view published pages" on custom_pages
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

create policy "tenant staff manage own pages" on custom_pages
  for all to authenticated
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "marketplace staff manage all pages" on custom_pages
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.14 notifications
alter table notifications enable row level security;

create policy "user view own notifications" on notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy "marketplace staff manage all notifications" on notifications
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());

-- 5.15 audit_logs (read-only untuk staff; insert sebaiknya lewat service role)
alter table audit_logs enable row level security;

create policy "marketplace staff view audit logs" on audit_logs
  for select to authenticated
  using (is_marketplace_staff());

create policy "tenant staff view own tenant audit logs" on audit_logs
  for select to authenticated
  using (is_tenant_staff(tenant_id));

-- insert ke audit_logs sebaiknya dilakukan lewat service_role key (bypass RLS) dari
-- server, bukan langsung dari client, supaya log tidak bisa dimanipulasi user.

-- ---------------------------------------------------------
-- 6. CATATAN UNTUK TIM
-- ---------------------------------------------------------
-- - invoice_no sudah unique; sebaiknya nomor invoice digenerate via function/sequence
--   tersendiri, bukan dari client.
-- - Soft delete (deleted_at) tetap perlu difilter manual di query layer (Prisma/tRPC)
--   untuk operasi UPDATE/DELETE; policy SELECT publik di atas sudah menambahkan filter
--   deleted_at is null sebagai pengaman tambahan.
-- - Tabel booking_participants, notifications, dan tenant_websites adalah tambahan di
--   luar daftar "Core Entities" eksplisit di PRD, ditambahkan karena diperlukan oleh
--   user flow (data peserta/companion, notifikasi, & konfigurasi website per tenant).
-- - Tie-break bidding & fallback template (edge case di PRD) ditangani di application
--   logic, bukan di level schema.