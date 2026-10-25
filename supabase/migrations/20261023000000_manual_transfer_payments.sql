-- Manual transfer & cash payment support (align with UmrahQu Admin schema)
-- Adds per-tenant bank accounts, payment proof fields, and the payment-proofs bucket.

create table if not exists public.banks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  bank_code varchar(20) not null,
  bank_name varchar(120) not null,
  account_number varchar(60) not null,
  account_holder_name varchar(160) not null,
  is_active boolean not null default true,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_banks_tenant_active
  on public.banks (tenant_id, is_active, is_primary desc);

alter table public.banks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'banks' and policyname = 'public_view_active_banks'
  ) then
    create policy "public_view_active_banks" on public.banks
      for select to anon, authenticated
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'banks' and policyname = 'tenant_staff_all_banks'
  ) then
    create policy "tenant_staff_all_banks" on public.banks
      for all to authenticated
      using (
        tenant_id in (
          select users.tenant_id from public.users
          where users.id = (select auth.uid())
            and users.role in ('travel_admin', 'travel_finance', 'travel_operational')
        )
      )
      with check (
        tenant_id in (
          select users.tenant_id from public.users
          where users.id = (select auth.uid())
            and users.role in ('travel_admin', 'travel_finance', 'travel_operational')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'banks' and policyname = 'platform_admin_all_banks'
  ) then
    create policy "platform_admin_all_banks" on public.banks
      for all to authenticated
      using (
        exists (
          select 1 from public.users
          where users.id = (select auth.uid()) and users.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.users
          where users.id = (select auth.uid()) and users.role = 'admin'
        )
      );
  end if;
end $$;

alter table public.payments add column if not exists destination_bank_id uuid references public.banks(id) on delete set null;
alter table public.payments add column if not exists proof_url text;
alter table public.payments add column if not exists sender_bank text;
alter table public.payments add column if not exists sender_account_name text;
alter table public.payments add column if not exists sender_account_number text;
alter table public.payments add column if not exists transferred_at timestamptz;
alter table public.payments add column if not exists verified_at timestamptz;
alter table public.payments add column if not exists verified_by uuid references public.users(id) on delete set null;
alter table public.payments add column if not exists rejection_reason text;
alter table public.payments add column if not exists notes text;
alter table public.payments add column if not exists installment_sequence integer;

alter table public.payments drop constraint if exists payments_payment_channel_check;
alter table public.payments add constraint payments_payment_channel_check
  check (payment_channel in (
    'va_transfer', 'credit_card', 'ewallet', 'qris', 'retail_outlet', 'direct_debit',
    'manual', 'disbursement', 'bank_transfer', 'cash'
  ));

create index if not exists idx_payments_booking_created
  on public.payments (booking_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;
