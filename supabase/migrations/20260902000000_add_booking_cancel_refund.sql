-- =========================================================
-- Customer cancellation + manual refund by travel
--  - bookings.cancel_reason  : alasan pembatalan dari customer
--  - booking_refunds         : catatan refund (diproses manual oleh travel)
-- =========================================================

alter table public.bookings add column if not exists cancel_reason text;

-- Status refund: pending -> processing -> completed
create table if not exists public.booking_refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  reason text,
  method text,
  reference text,
  note text,
  status text not null default 'pending',
  requested_by uuid references public.users(id),
  processed_by uuid references public.users(id),
  processed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_booking_refunds_booking_id on public.booking_refunds(booking_id);

-- RLS (pola sama dengan payments)
alter table public.booking_refunds enable row level security;

create policy "customer view own refunds" on public.booking_refunds
  for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_refunds.booking_id and b.customer_id = auth.uid()
    )
  );

create policy "tenant staff manage own tenant refunds" on public.booking_refunds
  for all to authenticated
  using (is_tenant_staff((select tenant_id from public.bookings b where b.id = booking_refunds.booking_id)))
  with check (is_tenant_staff((select tenant_id from public.bookings b where b.id = booking_refunds.booking_id)));

create policy "marketplace staff manage all refunds" on public.booking_refunds
  for all to authenticated
  using (is_marketplace_staff())
  with check (is_marketplace_staff());