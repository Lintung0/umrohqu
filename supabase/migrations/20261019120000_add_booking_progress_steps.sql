-- =========================================================
-- Booking progress steps (fitur Tracking di navbar)
--  - Progres per-layanan per booking: pembayaran, data jamaah,
--    dokumen & visa, hotel, tiket, manasik, keberangkatan
--  - Status: pending -> in_progress -> completed
--  - Di-seed saat booking dibuat; travel dapat memperbarui
--    (manual 'completed' menempel, selebihnya diturunkan
--     dari status booking secara live)
-- =========================================================

create table if not exists public.booking_progress_steps (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  step_key text not null,
  label text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  sort_order int not null default 0,
  note text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, step_key)
);

create index if not exists idx_booking_progress_steps_booking
  on public.booking_progress_steps (booking_id, sort_order);

alter table public.booking_progress_steps enable row level security;

-- Baca/tulis lewat service role (API server) — tanpa policy publik
