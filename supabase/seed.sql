-- =========================================================
-- UmrohQ — Seed Data (~20% fill for testing)
-- Jalankan SETELAH semua migration selesai
-- =========================================================
-- CATATAN: 
-- - Password semua akun test: Password123!
-- - Script ini idempotent (aman dijalankan berulang)
-- =========================================================

-- =========================================================
-- 0. FEE CONFIG (single row)
-- =========================================================
INSERT INTO public.fee_config (id, portal_fee_per_person, subdomain_fee_per_person, custom_domain_fee_per_person, service_fee_percent, service_fee_flat, setup_fee, tax_percent)
VALUES ('a0000000-0000-0000-0000-000000000001', 500000, 250000, 500000, 3, 300000, 5000000, 11)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 1. TENANTS (Travel Agencies)
-- =========================================================
INSERT INTO public.tenants (id, name, slug, contact_email, contact_phone, status, logo_url, city, description, founded, phone, is_verified, is_featured, packages_count, total_revenue, founded_year)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Al-Haramain Tour', 'al-haramain-tour', 'info@alharamain.id', '081234567890', 'verified', 'https://ui-avatars.com/api/?name=Al+Haramain&background=2A7D4F&color=fff&size=128&bold=true', 'Jakarta', 'Biro perjalanan umroh & haji terpercaya sejak 2005. Telah memberangkatkan lebih dari 50.000 jamaah.', '2005', '081234567890', true, true, 5, 450000000, '2005'),
  ('b0000000-0000-0000-0000-000000000002', 'Baitullah Travel', 'baitullah-travel', 'info@baitullah.id', '082134567891', 'verified', 'https://ui-avatars.com/api/?name=Baitullah&background=1d6b42&color=fff&size=128&bold=true', 'Surabaya', 'Spesialis umroh dan haji khusus dari Jawa Timur. Armada mandiri, muthawwif berpengalaman.', '2009', '082134567891', true, true, 4, 320000000, '2009'),
  ('b0000000-0000-0000-0000-000000000003', 'Mabrur Wisata', 'mabrur-wisata', 'info@mabrur.id', '083134567892', 'verified', 'https://ui-avatars.com/api/?name=Mabrur&background=059669&color=fff&size=128&bold=true', 'Bandung', 'Travel umroh amanah dari Bandung. Paket terjangkau tanpa mengorbankan kualitas.', '2012', '083134567892', true, false, 3, 180000000, '2012'),
  ('b0000000-0000-0000-0000-000000000004', 'Zamzam Tour', 'zamzam-tour', 'info@zamzam.id', '084134567893', 'verified', 'https://ui-avatars.com/api/?name=Zamzam&background=0d9488&color=fff&size=128&bold=true', 'Medan', 'Travel umroh terbesar di Sumatera. Keberangkatan rutin tiap bulan.', '2008', '084134567893', true, true, 4, 275000000, '2008'),
  ('b0000000-0000-0000-0000-000000000005', 'Nur Ilahi Travel', 'nur-ilahi-travel', 'info@nurilahi.id', '085134567894', 'pending', 'https://ui-avatars.com/api/?name=Nur+Ilahi&background=7c3aed&color=fff&size=128&bold=true', 'Makassar', 'Travel umroh terpercaya dari Sulawesi. Melayani keberangkatan dari Makassar.', '2015', '085134567894', false, false, 0, 0, '2015')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 2. WEBSITE TEMPLATES
-- =========================================================
INSERT INTO public.website_templates (id, name, preview_url, status, description, category, is_active, used_by_count)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Modern Islamic', 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', 'active', 'Template modern dengan nuansa hijau emas, cocok untuk travel premium', 'Premium', true, 3),
  ('c0000000-0000-0000-0000-000000000002', 'Clean Minimal', 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', 'active', 'Desain bersih dan minimalis, fokus pada konten paket', 'Basic', true, 1),
  ('c0000000-0000-0000-0000-000000000003', 'Royal Gold', 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', 'draft', 'Template mewah dengan aksen emas untuk travel eksklusif', 'Premium', false, 0)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 3. PACKAGES (5-6 paket per travel yang verified)
-- =========================================================

-- Travel 1: Al-Haramain Tour
INSERT INTO public.packages (id, tenant_id, name, slug, description, price, currency, quota, departure_city, departure_date, duration_days, airline, status, type, departure_cities, departure_month, original_price, image_url, is_promo, is_active, available, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars, facilities)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Umroh Reguler 12 Hari', 'umroh-reguler-12-hari', 'Paket umroh reguler dengan hotel bintang 4 dekat Masjidil Haram. Includes muthawwif, visa, dan transportasi.', 35000000, 'IDR', 45, 'Jakarta', '2026-09-15', 12, 'Garuda Indonesia', 'published', 'reguler', '["Jakarta","Bandung"]', 'September 2026', 38000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', true, true, 20, 'Al Kiswah Hotel', 4, 'Royal Inn Madinah', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 4","Bus AC","Muthawwif","Makan 3x","Ziarah"]'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Umroh VIP 10 Hari', 'umroh-vip-10-hari', 'Paket VIP dengan hotel bintang 5 tepi Masjidil Haram. Fasilitas premium, private muthawwif.', 52000000, 'IDR', 20, 'Jakarta', '2026-10-01', 10, 'Saudi Airlines', 'published', 'vip', '["Jakarta"]', 'Oktober 2026', 55000000, 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', false, true, 8, 'Pullman Zamzam Makkah', 5, 'Madinah Hilton', 5, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 5","Bus AC","Private Muthawwif","Makan VIP","Ziarah VIP","Laundry"]'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Umroh Plus Aqsho', 'umroh-plus-aqsho', 'Paket umroh + ziarah Aqsha/Jordania. Includes semua fasilitas umroh + tour Aqsha.', 45000000, 'IDR', 30, 'Jakarta', '2026-11-10', 15, 'Royal Jordanian', 'published', 'plus', '["Jakarta","Surabaya"]', 'November 2026', 48000000, 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', true, true, 12, 'Al Safwah Royale', 5, 'Madinah Plaza', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 5","Bus AC","Muthawwif","Makan 3x","Tour Aqsha","Laundry"]'),

-- Travel 2: Baitullah Travel
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Umroh Reguler 9 Hari', 'umroh-reguler-9h-baitullah', 'Paket umroh hemat 9 hari dari Surabaya. Cocok untuk jamaah dengan budget terjangkau.', 28000000, 'IDR', 50, 'Surabaya', '2026-09-20', 9, 'Lion Air', 'published', 'reguler', '["Surabaya"]', 'September 2026', 30000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', true, true, 25, 'Al Ehsan Hotel', 3, 'Madinah Grand', 3, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 3","Bus AC","Muthawwif","Makan 3x"]'),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Umroh Furoda 12 Hari', 'umroh-furoda-12h-baitullah', 'Paket Furoda (hak khusus) dengan kuota Kemenag. Hotel bintang 4, pelayanan terbaik.', 42000000, 'IDR', 25, 'Surabaya', '2026-10-05', 12, 'Batik Air', 'published', 'furoda', '["Surabaya","Malang"]', 'Oktober 2026', 45000000, 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', false, true, 10, 'Nasim Royal Hotel', 4, 'Rawdah Munawwarah', 4, '["Visa Furoda","Tiket Pesawat","Hotel Bintang 4","Bus AC","Muthawwif","Makan 3x","Ziarah"]'),

-- Travel 3: Mabrur Wisata
  ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'Umroh Hemat 9 Hari', 'umroh-hemat-9h-mabrur', 'Paket umroh termurah dari Bandung. Hotel dekat Masjidil Haram, muthawwif bersertifikat.', 26000000, 'IDR', 40, 'Bandung', '2026-09-25', 9, 'Lion Air', 'published', 'reguler', '["Bandung"]', 'September 2026', 28000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', true, true, 22, 'Al Mutmainnah', 3, 'Madinah Suites', 3, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 3","Bus","Muthawwif","Makan 3x"]'),
  ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'Umroh Reguler 12 Hari', 'umroh-reguler-12h-mabrur', 'Paket reguler 12 hari dengan hotel bintang 4. Fasilitas lengkap, jadwal pasti berangkat.', 34000000, 'IDR', 35, 'Bandung', '2026-10-15', 12, 'Garuda Indonesia', 'published', 'reguler', '["Bandung","Jakarta"]', 'Oktober 2026', null, 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', false, true, 15, 'Al Kiswah Towers', 4, 'Oberoi Madinah', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 4","Bus AC","Muthawwif","Makan 3x","Ziarah","Laundry"]'),

-- Travel 4: Zamzam Tour
  ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 'Umroh Reguler 11 Hari', 'umroh-reguler-11h-zamzam', 'Paket umroh dari Medan dengan jadwal pasti. Hotel strategis, muthawwif lokal dan Arab.', 33000000, 'IDR', 40, 'Medan', '2026-09-18', 11, 'Garuda Indonesia', 'published', 'reguler', '["Medan","Pekanbaru"]', 'September 2026', 35000000, 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', false, true, 18, 'Fajr Al Bader', 4, 'Madinah Hariyah', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 4","Bus AC","Muthawwif","Makan 3x","Ziarah"]'),
  ('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004', 'Umroh VIP 10 Hari', 'umroh-vip-10h-zamzam', 'Paket VIP dari Medan. Hotel bintang 5, fasilitas premium, jadwal pasti berangkat.', 50000000, 'IDR', 15, 'Medan', '2026-10-10', 10, 'Saudi Airlines', 'published', 'vip', '["Medan"]', 'Oktober 2026', 53000000, 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', true, true, 5, 'Conrad Makkah', 5, 'Madinah Marriott', 5, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 5","Bus VIP","Private Muthawwif","Makan VIP","Ziarah VIP","Laundry","Airport Lounge"]'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000004', 'Umroh Plus Turki 16 Hari', 'umroh-plus-turki-16h-zamzam', 'Paket umroh + wisata Turki (Istanbul, Bursa). Combines umroh dengan city tour.', 55000000, 'IDR', 20, 'Medan', '2026-11-01', 16, 'Turkish Airlines', 'published', 'plus', '["Medan"]', 'November 2026', 58000000, 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', false, true, 10, 'Hilton Makkah', 5, 'Anwar Al Madinah', 4, '["Visa Umroh","Tiket Pesawat","Hotel Bintang 5","Bus AC","Muthawwif","Makan 3x","City Tour Turki","Laundry"]')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 4. BIDDINGS (sponsored ranking)
-- =========================================================
INSERT INTO public.biddings (id, package_id, tenant_id, bid_value, status, start_date, end_date, impressions, clicks, position)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 15000, 'active', '2026-07-01', '2026-08-31', 12500, 850, 1),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 12000, 'active', '2026-07-01', '2026-08-31', 9800, 620, 2),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004', 10000, 'active', '2026-07-15', '2026-09-15', 7200, 410, 3)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 5. PROMOTIONS (global + travel-specific)
-- =========================================================
INSERT INTO public.promotions (id, tenant_id, type, value, config, active, starts_at, ends_at, title, code, description, discount_type, discount_value, min_booking, valid_until, is_active, usage_count, max_usage)
VALUES
  -- Global promos (tenant_id = placeholder for marketplace-wide)
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'discount_percent', 10, '{}', true, '2026-07-01', '2026-12-31', 'Promo Awal Tahun', 'NEWYEAR10', 'Diskon 10% untuk semua paket umroh minimal 9 hari', 'discount_percent', 10, 25000000, '2026-12-31', true, 45, 500),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'discount_amount', 500000, '{}', true, '2026-07-01', '2026-09-30', 'Cashback Rp500K', 'CASHBACK500', 'Cashback Rp500.000 untuk pemesanan paket VIP', 'discount_amount', 500000, 40000000, '2026-09-30', true, 12, 100),
  -- Travel-specific promos
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'discount_percent', 5, '{}', true, '2026-07-01', '2026-08-31', 'Promo Baitullah', 'BAIT5', 'Diskon 5% untuk paket Baitullah Travel', 'discount_percent', 5, 20000000, '2026-08-31', true, 8, 200),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'discount_amount', 250000, '{}', true, '2026-07-15', '2026-10-15', 'Promo Zamzam', 'ZAMZAM250', 'Cashback Rp250K untuk paket Zamzam Tour', 'discount_amount', 250000, 30000000, '2026-10-15', true, 3, 50)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 6. ARTICLES
-- =========================================================
INSERT INTO public.articles (id, title, slug, content, excerpt, category, image_url, author, published_at)
VALUES
  ('aa000000-0000-0000-0000-000000000001', 'Panduan Lengkap Persiapan Umroh 2026', 'panduan-persiapan-umroh-2026', 'Persiapan umroh memerlukan perencanaan matang. Mulai dari dokumen, kesehatan, hingga doa-doa yang perlu dipahami. Berikut panduan lengkapnya:

**1. Dokumen yang Diperlukan**
- Paspor minimal 6 bulan berlaku
- Foto 4x6 dengan background putih
- KTP dan surat keterangan sehat
- Buku nikah (untuk suami istri)

**2. Persiapan Kesehatan**
- Vaksinasi meningitis (wajib)
- Cek kesehatan umum
- Bawa obat pribadi yang cukup

**3. Persiapan Mental & Spiritual**
- Perbacaan Al-Quran
- Hafalan doa-doa umroh
- Niat dan keikhlasan

Semoga panduan ini bermanfaat bagi calon jamaah umroh.', 'Panduan lengkap persiapan umroh dari A sampai Z', 'Tips', 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', 'Redaksi UmrohQ', '2026-07-01'),
  ('aa000000-0000-0000-0000-000000000002', 'Perbedaan Umroh Reguler, VIP, dan Furoda', 'perbedaan-tipe-umroh', 'Banyak calon jamaah bingung memilih tipe umroh. Berikut penjelasan lengkapnya:

**Umroh Reguler**
- Hotel bintang 3-4
- Group 40-50 orang
- Fasilitas standar namun nyaman
- Harga terjangkau

**Umroh VIP**
- Hotel bintang 5 (dekat Haram)
- Group lebih kecil (15-25 orang)
- Fasilitas premium
- Muthawwif privat

**Umroh Furoda**
- Kuota khusus dari Kemenag
- Jadwal pasti berangkat
- Mix hotel bintang 4-5
- Proses visa khusus

Pilihan terbaik tergantung budget dan preferensi Anda.', 'Mengenal perbedaan umroh reguler, VIP, dan Furoda', 'Edukasi', 'https://images.unsplash.com/photo-1591604129939-f1efa4d79ef5?w=800&q=80', 'Redaksi UmrohQ', '2026-07-10'),
  ('aa000000-0000-0000-0000-000000000003', 'Tips Memilih Travel Umroh Terpercaya', 'tips-memilih-travel-terpercaya', 'Memilih travel umroh yang tepat adalah langkah awal yang krusial. Berikut tips jitu memilih travel terpercaya:

**1. Cek Legalitas**
- Pastikan memiliki izin dari Kemenag
- Nomor SIPPU/PIHK yang masih berlaku
- Terdaftar di Asprindo atau HIMPUH

**2. Reputasi & Track Record**
- Berapa lama beroperasi
- Testimoni jamaah sebelumnya
- Tersedia di marketplace terverifikasi

**3. Fasilitas yang Ditawarkan**
- Hotel dekat Masjidil Haram
- Maskapai penerbangan yang reputable
- Muthawwif bersertifikat

Jangan tergiur harga murah yang tidak masuk akal!', 'Tips memilih travel umroh yang amanah dan terpercaya', 'Tips', 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', 'Redaksi UmrohQ', '2026-07-20')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 7. USERS via auth.users (trigger auto-creates public.users)
-- Password: Password123! untuk semua
-- NOTE: We clean up existing users first to avoid conflicts
--        from previous seed runs (different IDs, same email).
-- =========================================================

-- Clean up existing auth.users + public.users by email (cascade deletes)
DELETE FROM auth.users WHERE email IN (
  'admin@umrohq.id', 'billing@umrohq.id', 'support@umrohq.id',
  'travel1@umrohq.id', 'travel2@umrohq.id',
  'jamaah1@email.com', 'jamaah2@email.com'
);

-- Admin Utama
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Utama","role":"admin"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Admin Finance
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'billing@umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Finance","role":"finance"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Admin Operational
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'support@umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Operational","role":"operational"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Travel Admin (Al-Haramain)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'travel1@umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Al-Haramain","role":"travel_admin","tenant_id":"b0000000-0000-0000-0000-000000000001"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Travel Admin (Baitullah)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'travel2@umrohq.id', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Baitullah","role":"travel_admin","tenant_id":"b0000000-0000-0000-0000-000000000002"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Customer 1
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'jamaah1@email.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ahmad Fauzi","role":"customer","phone":"081298765432"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Customer 2
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'jamaah2@email.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Siti Rahmawati","role":"customer","phone":"081398765433"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 8. USERS (public.users — update role via trigger result)
-- The auth trigger should have created these rows automatically.
-- We update role + tenant_id for travel admins.
-- =========================================================
UPDATE public.users SET role = 'admin', full_name = 'Admin Utama' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE public.users SET role = 'finance', full_name = 'Admin Finance' WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE public.users SET role = 'operational', full_name = 'Admin Operational' WHERE id = '10000000-0000-0000-0000-000000000003';
UPDATE public.users SET role = 'travel_admin', tenant_id = 'b0000000-0000-0000-0000-000000000001', full_name = 'Admin Al-Haramain' WHERE id = '20000000-0000-0000-0000-000000000001';
UPDATE public.users SET role = 'travel_admin', tenant_id = 'b0000000-0000-0000-0000-000000000002', full_name = 'Admin Baitullah' WHERE id = '20000000-0000-0000-0000-000000000002';
UPDATE public.users SET role = 'customer', full_name = 'Ahmad Fauzi', phone = '081298765432' WHERE id = '30000000-0000-0000-0000-000000000001';
UPDATE public.users SET role = 'customer', full_name = 'Siti Rahmawati', phone = '081398765433' WHERE id = '30000000-0000-0000-0000-000000000002';

-- =========================================================
-- 9. BOOKINGS + PAYMENTS + INVOICES (sample transactions)
-- =========================================================

-- Booking 1: Ahmad Fauzi booking paket Umroh VIP Al-Haramain → paid
INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, pilgrim_count, price, fee, total, notes)
VALUES ('aa100000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'marketplace', 'confirmed', 2, 52000000, 300000, 104300000, 'Mohon hotel dekat pintu utama');

INSERT INTO public.booking_participants (booking_id, full_name, id_number, relation)
VALUES
  ('aa100000-0000-0000-0000-000000000001', 'Ahmad Fauzi', '3201234567890001', 'self'),
  ('aa100000-0000-0000-0000-000000000001', 'Fatimah Fauzi', '3201234567890002', 'companion');

INSERT INTO public.payments (booking_id, tenant_id, status, gateway, gateway_reference, amount, paid_at)
VALUES ('aa100000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'paid', 'mandiri_va', 'VA-2026-001', 104300000, now() - interval '5 days');

INSERT INTO public.invoices (invoice_no, booking_id, tenant_id, total, status, due_date, paid_at, type, description, amount)
VALUES ('INV-2026-001', 'aa100000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 300000, 'paid', '2026-08-15', now() - interval '5 days', 'service_fee', 'Service fee booking Umroh VIP - Ahmad Fauzi (2 orang)', 300000);

-- Booking 2: Siti Rahmawati booking paket Reguler Baitullah → pending
INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, pilgrim_count, price, fee, total)
VALUES ('aa100000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'marketplace', 'pending_payment', 1, 28000000, 300000, 28300000);

INSERT INTO public.booking_participants (booking_id, full_name, id_number, relation)
VALUES ('aa100000-0000-0000-0000-000000000002', 'Siti Rahmawati', '3201234567890003', 'self');

INSERT INTO public.invoices (invoice_no, booking_id, tenant_id, total, status, due_date, type, description, amount)
VALUES ('INV-2026-002', 'aa100000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 300000, 'draft', '2026-08-20', 'service_fee', 'Service fee booking Umroh Reguler - Siti Rahmawati', 300000);

-- Booking 3: Ahmad Fauzi booking Umroh Hemat Mabrur → completed
INSERT INTO public.bookings (id, package_id, tenant_id, customer_id, booking_channel, status, pilgrim_count, price, fee, total)
VALUES ('aa100000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'marketplace', 'completed', 3, 26000000, 300000, 78300000);

INSERT INTO public.booking_participants (booking_id, full_name, id_number, relation)
VALUES
  ('aa100000-0000-0000-0000-000000000003', 'Ahmad Fauzi', '3201234567890001', 'self'),
  ('aa100000-0000-0000-0000-000000000003', 'Hasan Fauzi', '3201234567890004', 'companion'),
  ('aa100000-0000-0000-0000-000000000003', 'Hussein Fauzi', '3201234567890005', 'companion');

INSERT INTO public.payments (booking_id, tenant_id, status, gateway, gateway_reference, amount, paid_at)
VALUES ('aa100000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'paid', 'bca_va', 'VA-2026-003', 78300000, now() - interval '30 days');

INSERT INTO public.invoices (invoice_no, booking_id, tenant_id, total, status, due_date, paid_at, type, description, amount)
VALUES ('INV-2026-003', 'aa100000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 300000, 'paid', '2026-06-30', now() - interval '30 days', 'service_fee', 'Service fee booking Umroh Hemat - Ahmad Fauzi (3 orang)', 300000);

-- =========================================================
-- 10. REVIEWS (dari booking yang completed)
-- =========================================================
INSERT INTO public.reviews (booking_id, customer_id, tenant_id, rating, review, status)
VALUES
  ('aa100000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 5, 'Alhamdulillah, perjalanan umroh sangat lancar. Hotel bersih, makanan enak, muthawfif ramah dan profesional. Sangat recommended!', 'published');

-- =========================================================
-- 11. SUPPORT TICKETS
-- =========================================================
INSERT INTO public.support_tickets (id, tenant_id, subject, description, category, priority, status)
VALUES
  ('bb000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Paket tidak muncul di pencarian', 'Paket umroh reguler kami tidak muncul di halaman pencarian marketplace', 'technical', 'high', 'open'),
  ('bb000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Perubahan jadwal keberangkatan', 'Mohon bantuan untuk mengubah jadwal keberangkatan paket VIP dari Oktober ke November', 'general', 'medium', 'in_progress');

-- =========================================================
-- 12. CUSTOM PAGES (FAQ for marketplace)
-- =========================================================
INSERT INTO public.custom_pages (tenant_id, url, title, content, status, page_type, category)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '/faq/umroh', 'Apa itu umroh?', '{"answer": "Umroh adalah ibadah ziarah ke Kota Suci Makkah yang dapat dilakukan kapan saja sepanjang tahun, kecuali pada saat musim Haji. Umroh merupakan ibadah sunnah yang sangat dianjurkan dalam Islam."}', 'published', 'faq', 'Umum'),
  ('b0000000-0000-0000-0000-000000000001', '/faq/dokumen', 'Dokumen apa saja yang diperlukan?', '{"answer": "Dokumen yang diperlukan antara lain: Paspor (minimal 6 bulan berlaku), Foto 4x6, KTP, Surat Keterangan Sehat, Buku Nikah (jika suami-istri), dan Vaksinasi Meningitis."}', 'published', 'faq', 'Dokumen'),
  ('b0000000-0000-0000-0000-000000000001', '/faq/pembayaran', 'Bagaimana cara pembayaran?', '{"answer": "Pembayaran dapat dilakukan melalui transfer bank (VA BCA, Mandiri, BRI, BNI), e-wallet (OVO, DANA, GoPay), atau kartu kredit. Pembayaran harus diselesaikan sebelum batas waktu yang ditentukan."}', 'published', 'faq', 'Pembayaran'),
  ('b0000000-0000-0000-0000-000000000001', '/faq/pembatalan', 'Bagaimana kebijakan pembatalan?', '{"answer": "Pembatalan dapat dilakukan maksimal 30 hari sebelum keberangkatan dengan pengembalian dana sebesar 50%. Pembatalan kurang dari 30 hari tidak dapat dikembalikan. Hubungi travel untuk informasi lebih lanjut."}', 'published', 'faq', 'Kebijakan'),
  ('b0000000-0000-0000-0000-000000000001', '/faq/pembayaran', 'Apakah bisa cicilan?', '{"answer": "Beberapa travel partner kami menyediakan opsi cicilan. Silakan hubungi travel langsung untuk informasi lebih lanjut mengenai skema cicilan yang tersedia."}', 'published', 'faq', 'Pembayaran')
ON CONFLICT (tenant_id, url) DO NOTHING;

-- =========================================================
-- SELESAI!
-- Ringkasan data yang dibuat:
-- - 5 Travel agencies (4 verified, 1 pending)
-- - 3 Website templates
-- - 10 Paket umroh (reguler, vip, furoda, plus)
-- - 3 Bidding aktif
-- - 4 Promotions (global + travel-specific)
-- - 3 Articles
-- - 7 Users (3 admin, 2 travel admin, 2 customer)
-- - 3 Bookings (1 confirmed, 1 pending, 1 completed)
-- - 3 Payments
-- - 3 Invoices
-- - 1 Review
-- - 2 Support tickets
-- - 5 FAQ entries
-- - 1 Fee config
-- =========================================================
