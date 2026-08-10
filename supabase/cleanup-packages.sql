-- =========================================================
-- UmrohQ — Cleanup Package Data
-- Hapus semua paket + data terkait, tapi PERTAHANKAN akun user & travel
-- =========================================================
-- CATATAN:
-- - Jalankan ini di Supabase SQL Editor
-- - Backup database dulu sebelum menjalankan!
-- - Script ini HANYA menghapus data paket, biddings, promotions
-- - TIDAK menghapus: users, tenants, bookings, orders
-- =========================================================

-- Hapus biddings (tergantung packages)
DELETE FROM public.biddings;

-- Hapus promotions (terkait tenant)
DELETE FROM public.promotions;

-- Hapus package_itineraries (tergantung packages)
DELETE FROM public.package_itineraries;

-- Hapus packages (semua)
DELETE FROM public.packages;

-- Reset packages_count di tenants
UPDATE public.tenants SET packages_count = 0;

-- =========================================================
-- SELESAI! Sekarang:
-- 1. Login ke admin panel
-- 2. Buat paket baru melalui form
-- 3. Test upload gambar + create package
-- =========================================================