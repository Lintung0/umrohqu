-- Seed Umroh Packages from 7 PPIU Travel Agencies
-- Data extracted from official websites (August 2026)

-- First, update tenant packages_count
UPDATE tenants SET packages_count = 0 WHERE ppiu_number IS NOT NULL;

-- =====================================================
-- 1. RABBANITOUR (bcc6d38b-38c3-4f32-b03e-a145eac767b1)
-- =====================================================

INSERT INTO packages (
  id, tenant_id, name, slug, description, price, original_price, currency, 
  quota, available, departure_city, departure_date, departure_cities, departure_month,
  duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars,
  status, is_shared_to_marketplace, type, is_promo, is_active,
  image_url, gallery_urls, itinerary, includes, excludes, terms, cancellation_policy,
  country, country_code, city
) VALUES
-- Umroh Hebat 1 Sep 2026
(
  gen_random_uuid(),
  'bcc6d38b-38c3-4f32-b03e-a145eac767b1',
  'Umroh Hebat 1 September 2026',
  'umroh-hebat-1-september-2026',
  'Paket Umroh Reguler dengan harga terjangkau. Include Kereta Cepat, City Tour Thaif & Al Ula. Hotel Makkah: Maysan Al Mashaer, Hotel Madinah: Grand Plaza.',
  32500000, NULL, 'IDR',
  35, 0, 'Jakarta', '2026-09-01', '["Jakarta"]', 'September',
  9, 'Saudia Airlines', 'Maysan Al Mashaer / Setaraf', 4, 'Grand Plaza / Setaraf', 4,
  'published', true, 'reguler', false, true,
  'https://rabbanitour.travel/wp-content/uploads/2026/03/1-September-Umroh-Hebat-819x1024.jpeg',
  '["https://rabbanitour.travel/wp-content/uploads/2026/03/1-September-Umroh-Hebat-819x1024.jpeg"]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah. Transit di Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi. City Tour Madinah."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram). Check-in hotel di Makkah."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul. Ibadah mandiri di Masjidil Haram."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram. Ziarah Makkah."},{"day":7,"title":"Makkah - Thaif","description":"City Tour Thaif. Kunjungan ke kebun mawar dan pasar tradisional Thaif."},{"day":8,"title":"Makkah - Al Ula","description":"City Tour Al Ula. Kunjungan ke situs bersejarah dan pemandangan alam."},{"day":9,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Perjalanan dari Makkah ke Jeddah. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 4 Makkah & Madinah","Makan 3x Sehari Menu Indonesia","Transportasi Bus AC","Guide/Muthawif","Kereta Cepat","City Tour Thaif & Al Ula","Umroh 2x","Air Zam-zam 5 Liter","Perlengkapan Umroh","Manasik 2x"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry & Telepon","Kelebihan Bagasi","Pengeluaran Pribadi","Biaya Kursi Dorong Thawaf"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket","Pembatalan H-7: 100% harga paket"]',
  'Harga dapat berubah sewaktu-waktu. Minimal group 35 orang.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Hebat 5 Oct 2026
(
  gen_random_uuid(),
  'bcc6d38b-38c3-4f32-b03e-a145eac767b1',
  'Umroh Hebat 5 Oktober 2026',
  'umroh-hebat-5-oktober-2026',
  'Paket Umroh Reguler dengan harga terjangkau. Include Kereta Cepat & Al Ula. Hotel Makkah: Maysan Al Mashaer, Hotel Madinah: Grand Plaza.',
  32900000, NULL, 'IDR',
  35, 0, 'Jakarta', '2026-10-05', '["Jakarta"]', 'Oktober',
  10, 'Saudia Airlines', 'Maysan Al Mashaer / Setaraf', 4, 'Grand Plaza / Setaraf', 4,
  'published', true, 'reguler', false, true,
  'https://rabbanitour.travel/wp-content/uploads/2026/07/5-Oktober-Hebat-819x1024.jpeg',
  '["https://rabbanitour.travel/wp-content/uploads/2026/07/5-Oktober-Hebat-819x1024.jpeg"]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":5,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":6,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah - Al Ula","description":"City Tour Al Ula. Kunjungan ke situs bersejarah."},{"day":9,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":10,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 4","Makan 3x Sehari","Transportasi Bus AC","Guide/Muthawif","Kereta Cepat","City Tour Al Ula","Umroh 2x","Air Zam-zam 5 Liter","Perlengkapan Umroh"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry","Kelebihan Bagasi","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Pelataran 1 Sep 2026
(
  gen_random_uuid(),
  'bcc6d38b-38c3-4f32-b03e-a145eac767b1',
  'Umroh Pelataran 1 September 2026',
  'umroh-pelataran-1-september-2026',
  'Paket Umroh Reguler dengan hotel dekat Pelataran Masjidil Haram. Include Kereta Cepat, Thaif & Al Ula. Hotel Makkah: Safwah Hotel, Hotel Madinah: Hayah Golden.',
  32900000, NULL, 'IDR',
  35, 0, 'Jakarta', '2026-09-01', '["Jakarta"]', 'September',
  9, 'Saudia Airlines', 'Safwah Hotel / Setaraf', 5, 'Hayah Golden / Setaraf', 4,
  'published', true, 'reguler', false, true,
  'https://rabbanitour.travel/wp-content/uploads/2026/03/1-September-Umroh-Pelataran-819x1024.jpeg',
  '["https://rabbanitour.travel/wp-content/uploads/2026/03/1-September-Umroh-Pelataran-819x1024.jpeg"]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah - Thaif","description":"City Tour Thaif. Kunjungan ke kebun mawar dan pasar tradisional Thaif."},{"day":8,"title":"Makkah - Al Ula","description":"City Tour Al Ula. Kunjungan ke situs bersejarah."},{"day":9,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 4-5","Makan 3x Sehari","Transportasi Bus AC","Guide/Muthawif","Kereta Cepat","City Tour Thaif & Al Ula","Umroh 2x","Air Zam-zam 5 Liter","Perlengkapan Umroh"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry","Kelebihan Bagasi","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Pelataran 19 Sep 2026
(
  gen_random_uuid(),
  'bcc6d38b-38c3-4f32-b03e-a145eac767b1',
  'Umroh Pelataran 19 September 2026',
  'umroh-pelataran-19-september-2026',
  'Paket Umroh Reguler landing langsung di Madinah. Include Kereta Cepat & Al Ula. Hotel Makkah: Safwah Tower 3, Hotel Madinah: Hayah Golden.',
  34900000, NULL, 'IDR',
  35, 20, 'Jakarta', '2026-09-19', '["Jakarta"]', 'September',
  10, 'Saudia Airlines', 'Safwah Tower 3 / Setaraf', 5, 'Hayah Golden / Setaraf', 4,
  'published', true, 'reguler', false, true,
  'https://rabbanitour.travel/wp-content/uploads/2026/07/19-September-Pelataran-819x1024.jpeg',
  '["https://rabbanitour.travel/wp-content/uploads/2026/07/19-September-Pelataran-819x1024.jpeg"]',
  '[{"day":1,"title":"Jakarta - Madinah","description":"Keberangkatan dari Soekarno-Hatta International Airport langsung ke Madinah."},{"day":2,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":3,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram. Ziarah Makkah."},{"day":8,"title":"Makkah - Al Ula","description":"City Tour Al Ula. Kunjungan ke situs bersejarah."},{"day":9,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":10,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 4-5","Makan 3x Sehari","Transportasi Bus AC","Guide/Muthawif","Kereta Cepat","City Tour Al Ula","Umroh 2x","Air Zam-zam 5 Liter","Perlengkapan Umroh"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry","Kelebihan Bagasi","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Premium 19 Sep 2026
(
  gen_random_uuid(),
  'bcc6d38b-38c3-4f32-b03e-a145eac767b1',
  'Umroh Premium 19 September 2026',
  'umroh-premium-19-september-2026',
  'Paket Umroh Premium dengan hotel bintang 5. Include Kereta Cepat, Thaif & Al Ula. Hotel Makkah: Pullman/Movenpick, Hotel Madinah: Dar Al Eiman AL Haram.',
  39500000, NULL, 'IDR',
  35, 20, 'Jakarta', '2026-09-19', '["Jakarta"]', 'September',
  10, 'Saudia Airlines', 'Pullman / Movenpick / Setaraf', 5, 'Dar Al Eiman AL Haram / Setaraf', 5,
  'published', true, 'reguler', false, true,
  'https://rabbanitour.travel/wp-content/uploads/2026/07/19-September-Pelataran-Premium-815x1024-1.webp',
  '["https://rabbanitour.travel/wp-content/uploads/2026/07/19-September-Pelataran-Premium-815x1024-1.webp"]',
  '[{"day":1,"title":"Jakarta - Madinah","description":"Keberangkatan dari Soekarno-Hatta International Airport langsung ke Madinah."},{"day":2,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":3,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah - Thaif","description":"City Tour Thaif dengan Cable Car."},{"day":8,"title":"Makkah - Al Ula","description":"City Tour Al Ula."},{"day":9,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":10,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 5","Makan 3x Sehari","Transportasi Bus AC","Guide/Muthawif","Kereta Cepat","City Tour Thaif & Al Ula","Umroh 2x","Air Zam-zam 5 Liter","Perlengkapan Umroh","Handling VIP"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry","Kelebihan Bagasi","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Reguler Direct 15 Oct 2026
(
  gen_random_uuid(),
  'bcc6d38b-38c3-4f32-b03e-a145eac767b1',
  'Umroh Reguler Direct 15 Oktober 2026',
  'umroh-reguler-direct-15-oktober-2026',
  'Paket Umroh Reguler dengan harga promo. Hotel Makkah: Mather Al Eiman, Hotel Madinah: Hayah Golden.',
  28500000, 30500000, 'IDR',
  35, 15, 'Jakarta', '2026-10-15', '["Jakarta"]', 'Oktober',
  9, 'Saudia Airlines', 'Mather Al Eiman / Setaraf', 4, 'Hayah Golden / Setaraf', 4,
  'published', true, 'reguler', true, true,
  NULL,
  '[]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 4","Makan 3x Sehari","Transportasi Bus AC","Guide/Muthawif","Umroh 2x","Air Zam-zam 5 Liter","Perlengkapan Umroh"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry","Kelebihan Bagasi","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga promo terbatas.',
  'Indonesia', 'ID', 'Jakarta'
);

-- =====================================================
-- 2. ALHIJAZ INDOWISATA (766d585d-fafe-45d8-b3e6-cfafb4f8600a)
-- =====================================================

INSERT INTO packages (
  id, tenant_id, name, slug, description, price, original_price, currency, 
  quota, available, departure_city, departure_date, departure_cities, departure_month,
  duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars,
  status, is_shared_to_marketplace, type, is_promo, is_active,
  image_url, gallery_urls, itinerary, includes, excludes, terms, cancellation_policy,
  country, country_code, city
) VALUES
-- Umroh Promo Agustus 2025
(
  gen_random_uuid(),
  '766d585d-fafe-45d8-b3e6-cfafb4f8600a',
  'Umroh Promo Agustus 2025',
  'umroh-promo-agustus-2025',
  'Paket Umroh Promo All In. Include Visa, Hotel, Transport, Makan 3x, City Tour, Perlengkapan. Hotel Makkah: Al Massa Grand, Hotel Madinah: ODST Al Madinah.',
  28900000, NULL, 'IDR',
  90, 0, 'Jakarta', '2025-08-02', '["Jakarta"]', 'Agustus',
  9, 'Saudia Airlines', 'Al Massa Grand / Setaraf', 4, 'ODST Al Madinah / Setaraf', 3,
  'archived', true, 'reguler', true, false,
  'https://alhijaz.id/storage/2025/04/UMROH-PROMO-2025-08.jpg',
  '["https://alhijaz.id/storage/2025/04/UMROH-PROMO-2025-08.jpg"]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah - Jeddah","description":"City Tour Jeddah. Belanja di Pasar Corniche."},{"day":9,"title":"Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 4 & 3","Makan 3x Sehari Fullboard","Transportasi Bus AC","Guide/Muthawif","Manasik 2x","Umroh 2x","City Tour Makkah, Madinah & Jeddah","Air Zam-zam 5 Liter","Perlengkapan Umroh","Free Ayam Al Baik"]',
  '["Biaya Paspor","Suntik Meningitis","Dam/Qurban","Biaya Kursi Dorong Thawaf","Kelebihan Bagasi","Guide Khusus Pribadi","Pengeluaran Pribadi"]',
  '["Pembatalan sebelum H-30: Rp 1.000.000","Pembatalan setelah H-30: 25% harga paket","Pembatalan H-21: 50% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Promo September 2025
(
  gen_random_uuid(),
  '766d585d-fafe-45d8-b3e6-cfafb4f8600a',
  'Umroh Promo September 2025',
  'umroh-promo-september-2025',
  'Paket Umroh Promo All In. Include Visa, Hotel, Transport, Makan 3x, City Tour, Perlengkapan. Hotel Makkah: Al Massa Grand, Hotel Madinah: ODST Al Madinah.',
  27900000, NULL, 'IDR',
  90, 0, 'Jakarta', '2025-08-30', '["Jakarta"]', 'September',
  9, 'Saudia Airlines', 'Al Massa Grand / Setaraf', 4, 'ODST Al Madinah / Setaraf', 3,
  'archived', true, 'reguler', true, false,
  'https://alhijaz.id/storage/2025/04/Umroh-Promo-2025-08-30.jpg',
  '["https://alhijaz.id/storage/2025/04/Umroh-Promo-2025-08-30.jpg"]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Sholat Jumat di Masjidil Haram."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah - Jeddah","description":"City Tour Jeddah."},{"day":9,"title":"Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Syariah","Hotel Bintang 4 & 3","Makan 3x Sehari Fullboard","Transportasi Bus AC","Guide/Muthawif","Manasik 2x","Umroh 2x","Sholat Jumat di Masjidil Haram","City Tour Makkah, Madinah & Jeddah","Air Zam-zam 5 Liter","Perlengkapan Umroh","Free Ayam Al Baik"]',
  '["Biaya Paspor","Suntik Meningitis","Dam/Qurban","Kelebihan Bagasi","Pengeluaran Pribadi"]',
  '["Pembatalan sebelum H-30: Rp 1.000.000","Pembatalan setelah H-30: 25% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Plus Taif Milad Alhijaz 25 Oct 2025
(
  gen_random_uuid(),
  '766d585d-fafe-45d8-b3e6-cfafb4f8600a',
  'Umroh Plus Taif Milad Alhijaz 25 Oktober 2025',
  'umroh-plus-taif-milad-alhijaz-25-oktober-2025',
  'Paket Umroh Plus Taif dengan bonus Door Prize Umroh Gratis untuk 2 orang. Include Visa, Hotel, Transport, Makan 3x, City Tour Taif, Perlengkapan. Hotel Makkah: Al Massa Grand, Hotel Madinah: ODST Al Madinah.',
  29700000, NULL, 'IDR',
  350, 0, 'Jakarta', '2025-10-25', '["Jakarta"]', 'Oktober',
  9, 'Saudia Airlines', 'Al Massa Grand / Setaraf', 4, 'ODST Al Madinah / Setaraf', 3,
  'archived', true, 'reguler', true, false,
  'https://alhijaz.id/storage/2025/07/Umroh-Oktober-Promo-Milad-25.webp',
  '["https://alhijaz.id/storage/2025/07/Umroh-Oktober-Promo-Milad-25.webp"]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah - Thaif","description":"City Tour Thaif dengan Cable Car."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Syariah","Hotel Bintang 4 & 3","Makan 3x Sehari Fullboard","Transportasi Bus AC","Guide/Muthawif","Manasik 2x","Umroh 2x","City Tour Taif dengan Cable Car","City Tour Makkah & Madinah","Air Zam-zam 5 Liter","Perlengkapan Umroh","Free Ayam Al Baik","Door Prize Umroh Gratis"]',
  '["Biaya Paspor","Suntik Meningitis","Kelebihan Bagasi","Pengeluaran Pribadi"]',
  '["Pembatalan sebelum H-30: Rp 1.000.000","Pembatalan setelah H-30: 25% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Plus Taif & RedSea 25 Oct 2025
(
  gen_random_uuid(),
  '766d585d-fafe-45d8-b3e6-cfafb4f8600a',
  'Umroh Plus Taif & RedSea 25 Oktober 2025',
  'umroh-plus-taif-redsea-25-oktober-2025',
  'Paket Umroh Plus Taif & RedSea dengan bonus Door Prize Umroh Gratis untuk 2 orang. Include Visa, Hotel, Transport, Makan 3x, City Tour, Perlengkapan. Hotel Makkah: Al Massa Dar Al Fayzeen, Hotel Madinah: ODST Al Madinah.',
  27900000, NULL, 'IDR',
  96, 0, 'Jakarta', '2025-10-25', '["Jakarta"]', 'Oktober',
  9, 'Saudia Airlines', 'Al Massa Dar Al Fayzeen / Setaraf', 4, 'ODST Al Madinah / Setaraf', 3,
  'archived', true, 'reguler', true, false,
  'https://alhijaz.id/storage/2025/07/Umroh-Oktober-Promo-Milad-25-Red-Sea.webp',
  '["https://alhijaz.id/storage/2025/07/Umroh-Oktober-Promo-Milad-25-Red-Sea.webp"]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah - Thaif & RedSea","description":"City Tour Thaif & RedSea."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Syariah","Hotel Bintang 4 & 3","Makan 3x Sehari Fullboard","Transportasi Bus AC","Guide/Muthawif","Manasik 2x","Umroh 2x","City Tour Taif & RedSea","City Tour Makkah & Madinah","Air Zam-zam 5 Liter","Perlengkapan Umroh","Free Ayam Al Baik","Door Prize Umroh Gratis"]',
  '["Biaya Paspor","Suntik Meningitis","Kelebihan Bagasi","Pengeluaran Pribadi"]',
  '["Pembatalan sebelum H-30: Rp 1.000.000","Pembatalan setelah H-30: 25% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
);

-- =====================================================
-- 3. PAKEM TOURS (28ac3d14-3288-467f-adb8-02d6f9ab198e)
-- =====================================================

INSERT INTO packages (
  id, tenant_id, name, slug, description, price, original_price, currency, 
  quota, available, departure_city, departure_date, departure_cities, departure_month,
  duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars,
  status, is_shared_to_marketplace, type, is_promo, is_active,
  image_url, gallery_urls, itinerary, includes, excludes, terms, cancellation_policy,
  country, country_code, city
) VALUES
-- Umroh 12 Hari Start Jakarta
(
  gen_random_uuid(),
  '28ac3d14-3288-467f-adb8-02d6f9ab198e',
  'Umroh 12 Hari Start Jakarta',
  'umroh-12-hari-start-jakarta',
  'Paket Umroh 12 Hari dari Jakarta. Include Tiket Pesawat, Visa, Hotel Bintang 3, Makan 3x, City Tour, Perlengkapan. Hotel Makkah: Maysan Al Maqom, Hotel Madinah: Qash Al Anshar.',
  29500000, NULL, 'IDR',
  54, 49, 'Jakarta', NULL, '["Jakarta"]', NULL,
  12, 'Lion Air', 'Maysan Al Maqom / Emaar Andalosiah', 3, 'Qash Al Anshar / Jawharat Al Rasheed', 3,
  'published', true, 'reguler', false, true,
  'https://pakemtours.co.id/wp-content/uploads/WhatsApp-Image-2025-07-23-at-01.55.41-2-300x225.jpeg',
  '["https://pakemtours.co.id/wp-content/uploads/WhatsApp-Image-2025-07-23-at-01.55.41-2-300x225.jpeg","https://pakemtours.co.id/wp-content/uploads/2016/12/madinah-badan-pstingan-1-1024x683.jpg"]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":5,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi."},{"day":6,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":7,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":10,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":11,"title":"Makkah - Jeddah","description":"Thawaf Wada. Perjalanan ke Jeddah."},{"day":12,"title":"Jeddah - Jakarta","description":"Keberangkatan ke Jakarta. Tiba di Jakarta pukul 14:25."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 3","Makan 3x Sehari Menu Indonesia","Transportasi Bus AC","Guide/Muthawif","Manasik 2x","Umroh 2x","City Tour Makkah, Madinah & Jeddah","Air Zam-zam 5 Liter","Airport Tax","Perlengkapan Umroh"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry & Telepon","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket","Pembatalan H-7: 100% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh 12 Hari Start Makassar
(
  gen_random_uuid(),
  '28ac3d14-3288-467f-adb8-02d6f9ab198e',
  'Umroh 12 Hari Start Makassar',
  'umroh-12-hari-start-makassar',
  'Paket Umroh 12 Hari dari Makassar. Include Tiket Pesawat, Visa, Hotel Bintang 3, Makan 3x, City Tour, Perlengkapan.',
  32500000, NULL, 'IDR',
  47, 47, 'Makassar', NULL, '["Makassar"]', NULL,
  12, 'Lion Air', 'Hotel Bintang 3', 3, 'Hotel Bintang 3', 3,
  'published', true, 'reguler', false, true,
  'https://pakemtours.co.id/wp-content/uploads/IMG-20250608-WA0001-700x466.jpg',
  '["https://pakemtours.co.id/wp-content/uploads/IMG-20250608-WA0001-700x466.jpg","https://pakemtours.co.id/wp-content/uploads/2016/12/madinah-badan-pstingan-1-1024x683.jpg"]',
  '[{"day":1,"title":"Makassar - Jeddah","description":"Keberangkatan dari Sultan Hasanuddin International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":5,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi."},{"day":6,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":7,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":10,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":11,"title":"Makkah - Jeddah","description":"Thawaf Wada. Perjalanan ke Jeddah."},{"day":12,"title":"Jeddah - Makassar","description":"Keberangkatan ke Makassar."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 3","Makan 3x Sehari Menu Indonesia","Transportasi Bus AC","Guide/Muthawif","Manasik 2x","Umroh 2x","City Tour Makkah, Madinah & Jeddah","Air Zam-zam 5 Liter","Airport Tax","Perlengkapan Umroh"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry & Telepon","Pengeluaran Pribadi","Biaya Surat Keterangan Bebas Covid 19"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket","Pembatalan H-7: 100% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Makassar'
),
-- Marhaban Ramadhan 2026 Start Makassar
(
  gen_random_uuid(),
  '28ac3d14-3288-467f-adb8-02d6f9ab198e',
  'Marhaban Ramadhan 2026 Start Makassar',
  'marhaban-ramadhan-2026-start-makassar',
  'Paket Umroh Marhaban Ramadhan 2026 dari Makassar. Hotel Bintang 5! Include Tiket Pesawat Lion A330-900 Neo, Visa, Hotel Bintang 5, Makan 3x, City Tour, Perlengkapan. Hotel Makkah: Pullman Zamzam, Hotel Madinah: Rawda Royal Inn.',
  33800000, NULL, 'IDR',
  49, 49, 'Makassar', '2026-02-10', '["Makassar"]', 'Februari',
  13, 'Lion Air A330-900 Neo', 'Pullman Zamzam / Burj Diyafat Mubarak', 5, 'Rawda Royal Inn / Jawharat Al-Rasheed', 5,
  'published', true, 'reguler', false, true,
  'https://pakemtours.co.id/wp-content/uploads/Brosur-Marhaban-Ramadhan-700x466.jpg',
  '["https://pakemtours.co.id/wp-content/uploads/Brosur-Marhaban-Ramadhan-700x466.jpg","https://pakemtours.co.id/wp-content/uploads/2016/12/madinah-badan-pstingan-1-1024x683.jpg"]',
  '[{"day":1,"title":"Makassar - Jeddah","description":"Keberangkatan dari Sultan Hasanuddin International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":5,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi."},{"day":6,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Sholat Jumat di Masjid Nabawi."},{"day":7,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":8,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":9,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":10,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram. Sholat Jumat di Masjidil Haram."},{"day":11,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":12,"title":"Makkah - Jeddah","description":"Thawaf Wada. Perjalanan ke Jeddah."},{"day":13,"title":"Jeddah - Makassar","description":"Keberangkatan ke Makassar."}]',
  '["Tiket Pesawat PP Lion A330-900 Neo","Visa Umroh","Asuransi Perjalanan","Hotel Bintang 5","Makan 3x Sehari Menu Indonesia","Transportasi Bus AC","Guide/Muthawif","Manasik 2x","Umroh 2x","Sholat Jumat di Masjid Nabawi & Masjidil Haram","City Tour Makkah, Madinah & Jeddah","Air Zam-zam 5 Liter","Airport Tax","Perlengkapan Umroh"]',
  '["Biaya Paspor","Suntik Meningitis","Biaya Laundry & Telepon","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket","Pembatalan H-7: 100% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Makassar'
);

-- =====================================================
-- 4. NABAWI MULIA (57f310d6-253f-4ad3-b370-6e998feb77cf)
-- =====================================================

INSERT INTO packages (
  id, tenant_id, name, slug, description, price, original_price, currency, 
  quota, available, departure_city, departure_date, departure_cities, departure_month,
  duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars,
  status, is_shared_to_marketplace, type, is_promo, is_active,
  image_url, gallery_urls, itinerary, includes, excludes, terms, cancellation_policy,
  country, country_code, city
) VALUES
-- Umroh Garuda Reguler
(
  gen_random_uuid(),
  '57f310d6-253f-4ad3-b370-6e998feb77cf',
  'Umroh Garuda Reguler',
  'umroh-garuda-reguler',
  'Paket Umroh Berkah dengan Garuda Indonesia. Include Konsumsi, Visa, Perlengkapan, Tiket Pesawat, Tour Leader, Hotel, Transport, Dokumentasi. Hotel Makkah: Elaf Diamond, Hotel Madinah: Concorde An Nazel.',
  33900000, NULL, 'IDR',
  157, 157, 'Jakarta', '2026-10-15', '["Jakarta"]', 'Oktober',
  10, 'Garuda Indonesia', 'Elaf Diamond', 3, 'Concorde An Nazel', 4,
  'published', true, 'reguler', false, true,
  'https://bb71d2eac085c69b0.nos.wjv-1.neo.id/eh-storage/1774495482-aCj76UBcTX.webp',
  '["https://bb71d2eac085c69b0.nos.wjv-1.neo.id/eh-storage/1774495482-aCj76UBcTX.webp","https://bb71d2eac085c69b0.nos.wjv-1.neo.id/eh-storage/1774435630-qa8OXyogk4.webp"]',
  '[{"day":1,"title":"Jakarta - Madinah","description":"Keberangkatan dari Soekarno-Hatta International Airport langsung ke Madinah."},{"day":2,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":3,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah","description":"Thawaf Wada. Perjalanan ke Jeddah."},{"day":10,"title":"Jeddah - Jakarta","description":"Keberangkatan ke Jakarta."}]',
  '["Konsumsi 3x Sehari","Visa Haji & Umrah","Perlengkapan Umrah","Tiket Pesawat PP","Tour Leader/Muthawif","Hotel Penginapan","Transportasi","Dokumentasi"]',
  '["Biaya Paspor","Suntik Meningitis","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh By Malaysia Airlines
(
  gen_random_uuid(),
  '57f310d6-253f-4ad3-b370-6e998feb77cf',
  'Umroh By Malaysia Airlines',
  'umroh-by-malaysia-airlines',
  'Paket Umroh Hebat dengan Malaysia Airlines. Include Konsumsi, Visa, Perlengkapan, Tiket Pesawat, Tour Leader, Hotel, Transport, Dokumentasi. Hotel Makkah: Elaf Diamond, Hotel Madinah: Concorde Al Madinah.',
  30900000, NULL, 'IDR',
  327, 327, 'Yogyakarta', '2026-09-05', '["Yogyakarta"]', 'September',
  9, 'Malaysia Airlines', 'Elaf Diamond', 3, 'Concorde Al Madinah', 4,
  'published', true, 'reguler', false, true,
  NULL,
  '["https://bb71d2eac085c69b0.nos.wjv-1.neo.id/1638869882-890430/16585571166399-GLlqU1TWVQo6LqQW6uLVl3wCyHeAp57fBSem2LXq.jpg"]',
  '[{"day":1,"title":"Yogyakarta - Kuala Lumpur","description":"Keberangkatan dari YIA menuju Kuala Lumpur."},{"day":2,"title":"Kuala Lumpur - Madinah","description":"Perjalanan dari KL ke Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi."},{"day":5,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":6,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah - Yogyakarta","description":"Thawaf Wada. Keberangkatan ke Yogyakarta via KL."}]',
  '["Konsumsi 3x Sehari","Visa Haji & Umrah","Perlengkapan Umrah","Tiket Pesawat PP","Tour Leader/Muthawif","Hotel Penginapan","Transportasi","Dokumentasi"]',
  '["Biaya Paspor","Suntik Meningitis","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Yogyakarta'
),
-- Umroh Garuda VIP
(
  gen_random_uuid(),
  '57f310d6-253f-4ad3-b370-6e998feb77cf',
  'Umroh Garuda VIP',
  'umroh-garuda-vip',
  'Paket Umroh Hebat VIP dengan Garuda Indonesia. Include Konsumsi, Visa, Perlengkapan, Tiket Pesawat, Tour Leader, Hotel Bintang 4, Transport, Dokumentasi. Hotel Makkah: Azka Al Safa, Hotel Madinah: Concorde An Nazel.',
  37900000, NULL, 'IDR',
  130, 130, 'Jakarta', '2026-10-15', '["Jakarta"]', 'Oktober',
  10, 'Garuda Indonesia', 'Azka Al Safa Hotel', 4, 'Concorde An Nazel', 4,
  'published', true, 'reguler', false, true,
  'https://bb71d2eac085c69b0.nos.wjv-1.neo.id/eh-storage/1774372813-I8Qs7q2244.webp',
  '["https://bb71d2eac085c69b0.nos.wjv-1.neo.id/eh-storage/1774372813-I8Qs7q2244.webp","https://bb71d2eac085c69b0.nos.wjv-1.neo.id/eh-storage/1774435630-qa8OXyogk4.webp"]',
  '[{"day":1,"title":"Jakarta - Madinah","description":"Keberangkatan dari Soekarno-Hatta International Airport langsung ke Madinah."},{"day":2,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":3,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah","description":"Thawaf Wada. Perjalanan ke Jeddah."},{"day":10,"title":"Jeddah - Jakarta","description":"Keberangkatan ke Jakarta."}]',
  '["Konsumsi 3x Sehari","Visa Haji & Umrah","Perlengkapan Umrah","Tiket Pesawat PP","Tour Leader/Muthawif","Hotel Bintang 4","Transportasi VIP","Dokumentasi"]',
  '["Biaya Paspor","Suntik Meningitis","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
);

-- =====================================================
-- 5. DUTA MULIA TRAVEL (16f52d2b-0a4f-4bba-bf8c-75ba1ff989b4)
-- =====================================================

INSERT INTO packages (
  id, tenant_id, name, slug, description, price, original_price, currency, 
  quota, available, departure_city, departure_date, departure_cities, departure_month,
  duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars,
  status, is_shared_to_marketplace, type, is_promo, is_active,
  image_url, gallery_urls, itinerary, includes, excludes, terms, cancellation_policy,
  country, country_code, city
) VALUES
-- Umroh Hemat Musim Baru 2026
(
  gen_random_uuid(),
  '16f52d2b-0a4f-4bba-bf8c-75ba1ff989b4',
  'Umroh Hemat Musim Baru 2026',
  'umroh-hemat-musim-baru-2026',
  'Paket Umroh Hemat dengan Oman Airlines. Hotel Dekat Masjid (3-5 Menit Jalan Kaki). Include Visa, Perlengkapan Umrah Premium, Handling Bandara, Makan 3x, Pembimbing Ibadah, Pendampingan 24 Jam.',
  26800000, NULL, 'IDR',
  45, 45, 'Jakarta', '2026-06-28', '["Jakarta"]', 'Juni',
  9, 'Oman Airlines', 'Dekat Masjid (3-5 Menit Jalan Kaki)', 4, 'Dekat Masjid (3-5 Menit Jalan Kaki)', 4,
  'published', true, 'reguler', true, true,
  NULL,
  '[]',
  '[{"day":1,"title":"Jakarta - Muscat","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Muscat."},{"day":2,"title":"Muscat - Madinah","description":"Transit di Muscat, lanjut ke Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi."},{"day":5,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":6,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta via Muscat."}]',
  '["Tiket Pesawat PP","Visa Umroh","Hotel Dekat Masjid","Makan 3x Sehari","Transportasi","Pembimbing Ibadah","Pendampingan 24 Jam","Perlengkapan Umrah Premium","Handling Bandara Indonesia & Saudi","Visa Sisko Patuh"]',
  '["Biaya Paspor","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
),
-- Umroh Milad Duta Mulia Travel 2026
(
  gen_random_uuid(),
  '16f52d2b-0a4f-4bba-bf8c-75ba1ff989b4',
  'Umroh Milad Duta Mulia Travel 2026',
  'umroh-milad-duta-mulia-travel-2026',
  'Paket Umroh Milad Spesial dengan Saudia Airways. Hotel Dekat Masjid (3-5 Menit Jalan Kaki). Include Visa, Perlengkapan Umrah Premium, Handling Bandara, Makan 3x, Pembimbing Ibadah, Pendampingan 24 Jam.',
  25900000, NULL, 'IDR',
  45, 45, 'Jakarta', '2026-10-17', '["Jakarta"]', 'Oktober',
  9, 'Saudia Airways', 'Dekat Masjid (3-5 Menit Jalan Kaki)', 4, 'Dekat Masjid (3-5 Menit Jalan Kaki)', 4,
  'published', true, 'reguler', true, true,
  NULL,
  '[]',
  '[{"day":1,"title":"Jakarta - Jeddah","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Jeddah."},{"day":2,"title":"Jeddah - Madinah","description":"Perjalanan dari Jeddah ke Madinah. Check-in hotel di Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi."},{"day":5,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":6,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP","Visa Umroh","Hotel Dekat Masjid","Makan 3x Sehari","Transportasi","Pembimbing Ibadah","Pendampingan 24 Jam","Perlengkapan Umrah Premium","Handling Bandara Indonesia & Saudi","Visa Sisko Patuh"]',
  '["Biaya Paspor","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
);

-- =====================================================
-- 6. BATIK TRAVEL (0e1fc995-e9ba-4926-9781-1d9d9f0e3cf6)
-- =====================================================

INSERT INTO packages (
  id, tenant_id, name, slug, description, price, original_price, currency, 
  quota, available, departure_city, departure_date, departure_cities, departure_month,
  duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars,
  status, is_shared_to_marketplace, type, is_promo, is_active,
  image_url, gallery_urls, itinerary, includes, excludes, terms, cancellation_policy,
  country, country_code, city
) VALUES
-- Umroh Garuda Start Jogja 9 Hari
(
  gen_random_uuid(),
  '0e1fc995-e9ba-4926-9781-1d9d9f0e3cf6',
  'Umroh Garuda Start Jogja 9 Hari',
  'umroh-garuda-start-jogja-9-hari',
  'Paket Umroh dari Yogyakarta dengan Garuda Indonesia. Transit 1 malam di Jakarta. Hotel Makkah: Mira/Ramada, Hotel Madinah: Durrat/Ansar GT. Pembimbing: Ustadz Yulian Purnama.',
  32999000, NULL, 'IDR',
  45, 0, 'Yogyakarta', '2026-08-15', '["Yogyakarta"]', 'Agustus',
  10, 'Garuda Indonesia', 'Mira / Ramada / Setaraf', 4, 'Durrat / Ansar GT / Setaraf', 4,
  'published', true, 'reguler', false, false,
  'https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/Umroh-15-Agustus-2026-Jogja.jpeg',
  '["https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/Umroh-15-Agustus-2026-Jogja.jpeg","https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/5.png","https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/2.png","https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/1.png"]',
  '[{"day":1,"title":"Yogyakarta - Jakarta","description":"Keberangkatan dari YIA menuju CGK. Transit 1 malam di Jakarta hotel."},{"day":2,"title":"Jakarta - Madinah","description":"Keberangkatan dari CGK langsung ke Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":5,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":6,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah","description":"Thawaf Wada. Perjalanan ke Jeddah."},{"day":10,"title":"Jeddah - Jakarta - Yogyakarta","description":"Keberangkatan ke Jakarta, lanjut ke Yogyakarta."}]',
  '["Tiket Pesawat PP","Visa Umroh","Manasik","Pembimbing/Tour Leader","Muthawwif","Hotel Makkah & Madinah","Makan 3x Sehari","City Tour","Kajian & Konsultasi Agama","Air Zamzam 5 Liter"]',
  '["Biaya Passport","Suntik Meningitis & Polio","Perlengkapan","Keperluan Pribadi","Akomodasi Domestik"]',
  '["Pelunasan 45 hari sebelum keberangkatan","Harga & Jadwal bisa berubah sewaktu-waktu"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Yogyakarta'
),
-- Umroh Start Jogja 11 Hari 2x Jumat Plus Thaif
(
  gen_random_uuid(),
  '0e1fc995-e9ba-4926-9781-1d9d9f0e3cf6',
  'Umroh Start Jogja 11 Hari 2x Jumat Plus Thaif',
  'umroh-start-jogja-11-hari-2x-jumat-plus-thaif',
  'Paket Umroh dari Yogyakarta dengan Garuda Indonesia. 2x Sholat Jumat (Madinah & Makkah) + Bonus Tour Thaif. Hotel Makkah: Mira/Ramada, Hotel Madinah: Anshar Golden Tulip. Pembimbing: Ustadz Rony Setyawan.',
  34499000, NULL, 'IDR',
  45, 20, 'Yogyakarta', '2026-08-20', '["Yogyakarta"]', 'Agustus',
  12, 'Garuda Indonesia', 'Mira / Ramada / Setaraf', 4, 'Anshar Golden Tulip / Setaraf', 4,
  'published', true, 'reguler', false, true,
  'https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/Umroh-20-Agustus-2026.jpeg',
  '["https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/Umroh-20-Agustus-2026.jpeg","https://cdn.ptbatik.co.id/wp-content/uploads/2026/07/Umroh_20_Agustus_2026-1024x576.jpeg"]',
  '[{"day":1,"title":"Yogyakarta - Jakarta","description":"Keberangkatan dari YIA menuju CGK. Transit 1 malam di Jakarta hotel."},{"day":2,"title":"Jakarta - Madinah","description":"Keberangkatan dari CGK langsung ke Madinah. 1st Jumat di Masjid Nabawi."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Mamsya Quba."},{"day":5,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":6,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram. 2nd Jumat di Masjidil Haram."},{"day":9,"title":"Makkah - Thaif","description":"Bonus Tour Thaif. Kunjungan ke kebun mawar dan pasar tradisional Thaif."},{"day":10,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":11,"title":"Makkah - Jeddah","description":"Thawaf Wada. Perjalanan ke Jeddah."},{"day":12,"title":"Jeddah - Jakarta - Yogyakarta","description":"Keberangkatan ke Jakarta, lanjut ke Yogyakarta."}]',
  '["Tiket Pesawat PP","Visa Umroh","Manasik","Pembimbing/Tour Leader","Muthawwif","Hotel Makkah & Madinah","Makan 3x Sehari","City Tour","Kajian & Konsultasi Agama","Air Zamzam 5 Liter","Bonus Tour Thaif"]',
  '["Biaya Passport","Suntik Meningitis & Polio","Perlengkapan","Keperluan Pribadi","Akomodasi Domestik"]',
  '["Pelunasan 45 hari sebelum keberangkatan","Harga & Jadwal bisa berubah sewaktu-waktu"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Yogyakarta'
),
-- Umroh Garuda Silver Direct Flight
(
  gen_random_uuid(),
  '0e1fc995-e9ba-4926-9781-1d9d9f0e3cf6',
  'Umroh Garuda Silver Direct Flight Landing Madinah',
  'umroh-garuda-silver-direct-flight-landing-madinah',
  'Paket Umroh dari Jakarta dengan Garuda Indonesia Direct Flight. Hotel Makkah: Snood Ajyad/Mira Ajyad, Hotel Madinah: Ansar GT/Grand Plaza. Pembimbing: Ustadz Abu Umair.',
  31999000, NULL, 'IDR',
  45, 20, 'Jakarta', '2026-08-24', '["Jakarta"]', 'Agustus',
  9, 'Garuda Indonesia', 'Snood Ajyad / Mira Ajyad / Setaraf', 4, 'Ansar GT / Grand Plaza / Setaraf', 4,
  'published', true, 'reguler', false, true,
  'https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/24-Agustus-GA-silver-2026-Potrait.jpg',
  '["https://cdn.ptbatik.co.id/wp-content/uploads/2026/02/24-Agustus-GA-silver-2026-Potrait.jpg"]',
  '[{"day":1,"title":"Jakarta - Madinah","description":"Keberangkatan dari CGK langsung ke Madinah (Direct Flight)."},{"day":2,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":3,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Ziarah Kota Madinah."},{"day":4,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":5,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":6,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah - Jeddah","description":"Thawaf Wada. Perjalanan ke Jeddah."},{"day":9,"title":"Jeddah - Jakarta","description":"Keberangkatan ke Jakarta."}]',
  '["Tiket Pesawat PP","Visa Umroh","Manasik","Pembimbing/Tour Leader","Muthawwif","Hotel Makkah & Madinah","Makan 3x Sehari","City Tour","Kajian & Konsultasi Agama","Air Zamzam 5 Liter"]',
  '["Biaya Passport","Suntik Meningitis & Polio","Perlengkapan","Keperluan Pribadi","Akomodasi Domestik"]',
  '["Pelunasan 45 hari sebelum keberangkatan","Harga & Jadwal bisa berubah sewaktu-waktu"]',
  'Harga dapat berubah sewaktu-waktu.',
  'Indonesia', 'ID', 'Jakarta'
);

-- =====================================================
-- 7. AL AMIN MULIA (6b32e715-7e35-48a7-be62-ec86743b52fd)
-- =====================================================

INSERT INTO packages (
  id, tenant_id, name, slug, description, price, original_price, currency, 
  quota, available, departure_city, departure_date, departure_cities, departure_month,
  duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars,
  status, is_shared_to_marketplace, type, is_promo, is_active,
  image_url, gallery_urls, itinerary, includes, excludes, terms, cancellation_policy,
  country, country_code, city
) VALUES
-- Umroh Rabi'ul Awal 2026
(
  gen_random_uuid(),
  '6b32e715-7e35-48a7-be62-ec86743b52fd',
  'Umroh Rabi''ul Awal 2026',
  'umroh-rabiul-awal-2026',
  'Paket Umroh Promo dengan Etihad Airways. Include Tiket Pesawat, Visa, Tasreh Raudhah, Perlengkapan Umroh, Muthawwif, Transportasi, Handling Airport, Air Zam-zam 5 Liter, Hotel, Asuransi, Pembimbing Ibadah, Makan 3x, Manasik, Kereta Cepat. Hotel Makkah: Maysan Al Maqam, Hotel Madinah: Dar Al Naeem.',
  28500000, NULL, 'IDR',
  40, 40, 'Jakarta', '2026-08-30', '["Jakarta"]', 'Agustus',
  9, 'Etihad Airways', 'Maysan Al Maqam', 4, 'Dar Al Naeem Hotel', 4,
  'published', true, 'reguler', true, true,
  'https://bb71d2eac085c69b0.nos.wjv-1.neo.id/1693463144-830620/17707934389723-ilyBAKWOqK.jpeg',
  '["https://bb71d2eac085c69b0.nos.wjv-1.neo.id/1693463144-830620/17707934389723-ilyBAKWOqK.jpeg"]',
  '[{"day":1,"title":"Jakarta - Abu Dhabi","description":"Keberangkatan dari Soekarno-Hatta International Airport menuju Abu Dhabi."},{"day":2,"title":"Abu Dhabi - Madinah","description":"Transit di Abu Dhabi, lanjut ke Madinah."},{"day":3,"title":"Madinah","description":"Ziarah Masjid Nabawi, Makam Rasulullah SAW, Makam Baqi."},{"day":4,"title":"Madinah","description":"Ibadah mandiri di Masjid Nabawi. Tasreh Raudhah."},{"day":5,"title":"Madinah - Makkah","description":"Perjalanan dari Madinah ke Makkah melalui Bir Ali (Miqat Ihram)."},{"day":6,"title":"Makkah - Umroh 1","description":"Ibadah Umroh 1: Tawaf, Sa, Tahallul."},{"day":7,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":8,"title":"Makkah","description":"Ibadah mandiri di Masjidil Haram."},{"day":9,"title":"Makkah - Jeddah - Jakarta","description":"Thawaf Wada. Keberangkatan ke Jakarta via Abu Dhabi."}]',
  '["Tiket Pesawat PP Ekonomi","Visa Umroh","Tasreh Raudhah","Perlengkapan Umroh","Muthawwif","Transportasi","Handling Airport","Air Zam-zam 5 Liter","Hotel Bintang 4","Asuransi Perjalanan","Pembimbing Ibadah","Makan 3x Sehari","Manasik di Hotel","Kereta Cepat"]',
  '["Pembuatan Passport","Vaksin Meningitis","Kelebihan Bagasi","Transport dari Daerah ke Jakarta PP","Pengeluaran Pribadi"]',
  '["Pembatalan H-30: Rp 1.000.000","Pembatalan H-21: 25% harga paket","Pembatalan H-14: 75% harga paket","Pembatalan H-7: 100% harga paket"]',
  'Harga dapat berubah sewaktu-waktu. Booking deposit Rp 10.000.000/orang.',
  'Indonesia', 'ID', 'Jakarta'
);

-- Update packages_count for all tenants
UPDATE tenants SET packages_count = (
  SELECT COUNT(*) FROM packages WHERE packages.tenant_id = tenants.id
) WHERE ppiu_number IS NOT NULL;

-- Verify
SELECT t.name, COUNT(p.id) as package_count, SUM(p.price) as total_price
FROM tenants t
LEFT JOIN packages p ON p.tenant_id = t.id
WHERE t.ppiu_number IS NOT NULL
GROUP BY t.name
ORDER BY t.name;
