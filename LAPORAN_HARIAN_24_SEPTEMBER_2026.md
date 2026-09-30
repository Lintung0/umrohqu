Lintang Mahameru Putra || SMKN 6 MALANG
Laporan harian : Kamis, 24 September 2026

umrahqu (marketplace) :
=> rework checkout step 1-3: hapus box info, hapus card Pembayaran Aman/SSL/Midtrans/PPIU, hapus kata Midtrans dari metode bayar, hapus label Pilih Keberangkatan, tombol jadi Lanjutkan, title tab Checkout jadi Pesan ✅
=> rework checkout step 4 (Selesai): kiri tampil data input jemaah, kanan tetap ringkasan pembayaran + tombol bayar ✅
=> perbaiki bug tombol bayar masih muncul setelah lunas: Snap callback redirect ke finish page untuk verifikasi dulu sebelum detail pesanan + idempotency guard cegah duplikat pesanan ✅
=> terapkan tema ivory/gold/emerald ke checkout/finish & booking-success, perbaiki 2 error build Vercel (JSX booking-success & checkout), commit + push e28170e ✅
