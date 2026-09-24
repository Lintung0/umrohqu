Lintang Mahameru Putra || SMKN 6 MALANG
Laporan harian : selasa, 22 september 2026

umrahqu (marketplace) :
=> migrasi kolom data diri jamaah (12 kolom) + kolom VA (va_number, bank) ke Supabase via MCP ✅
=> istilah user-facing "booking" → "pesanan" pada locale id.json, migrasi SQL file dibuat ✅
=> integrasi Midtrans Snap JS: onPending menangkap nomor VA & bank, simpan via /api/payments/update-va, redirect ke detail pesanan ✅
=> fix kartu "Pesanan Terakhir" terpotong: overflow-hidden, tanpa negative margin, warna status mengikuti tema ✅
=> tombol bayar disembunyikan saat pesanan lunas ("Lunas & Dikonfirmasi"), update data diri optimistik, cek kelengkapan 11 field, label "Simpan", auto-refresh setelah pembayaran ✅
=> tambah filter rentang tanggal (Dari/Sampai) di halaman Pesanan Saya ✅
=> update types.ts sesuai operational-module-notes: packages/bookings/users (breaking changes), 5 enum, 19 interface tabel operasional ✅
=> update API routes booking (create/pay/pay-remaining/verify-payment/travel-confirm) sesuai schema baru ✅
=> checkout: tambah step "Keberangkatan" dengan pilihan package_departures ✅
=> modul operasional travel dashboard: sidebar 4 grup navigasi + komponen DataTable generik + halaman Agent Commissions ✅
=> perbaikan komponen DataTable: tulis ulang bersih (sintaks), hapus import ganda useState/icon Seat, embed hotel via package_hotels sesuai FK DB ✅
=> wiring fetchData riil untuk 16 halaman modul operasional (query scoped tenant + relasi sesuai FK aktual di database) ✅
=> tsc + build hijau, seluruh commit ter-push ke GitHub (origin main) & GitLab (main-github) ✅
=> halaman detail/create (/new) untuk 19 modul operasional masih belum dibuat 🔁