-- =========================================================
-- Pembatalan customer memerlukan persetujuan travel
--  - booking_status + 'cancellation_pending' : permintaan batal menunggu persetujuan
--  - booking_refunds.previous_status         : status booking sebelum permintaan (untuk tolak)
-- =========================================================

alter type public.booking_status add value if not exists 'cancellation_pending';

alter table public.booking_refunds add column if not exists previous_status text;