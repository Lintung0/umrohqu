Lintang Mahameru Putra || SMKN 6 Malang
Laporan Mingguan 21–25 September 2026
Project: UmrahQu
- => terapkan tema dashboard ivory/gold/emerald ke homepage, kartu paket, navbar & halaman autentikasi: data riil dari DB, tanpa stats/testimoni palsu, tanpa gradient ✅
- => rework checkout step 1–3: hapus box info, hapus card Pembayaran Aman/SSL/Midtrans/PPIU, hapus kata Midtrans & label Pilih Keberangkatan, tombol jadi Lanjutkan, title tab jadi Pesan ✅
- => rework step Selesai: kiri tampil data input jemaah, kanan ringkasan + tombol Bayar; tombol Snap alihkan via finish verifikasi dulu ✅
- => perbaiki bug tombol bayar masih muncul setelah lunas: tombol Bayar hanya bila belum ada transaksi, kartu VA aktif + Cek Status, cegah duplikat pesanan (idempotency guard) ✅
- => finish pembayaran auto-polling + auto redirect ke detail, teks buntu Menunggu Konfirmasi dihapus ✅
- => tema ivory ke checkout, search, compare, faq, travel, detail paket + skeleton loading; badge cashback diseragamkan emas terang ✅
- => pagination notifikasi 10 per halaman + reset saat ganti filter; itinerary multiple-expand + Buka/Tutup Semua ✅
- => dashboard jamaah: foto paket tampil di Ringkasan + Pesanan Saya; WhyUs hijau seragam; tombol travel jadi Semua; trust responsif mobile; toggle settings flat; Prev/Next jadi Indonesia ✅
- => card paket gaya marketplace Shopee (foto 1:1, padat, grid 2/3/4) + H1 dinamis otomatis huruf besar di awal ✅
- => investigasi Midtrans sandbox vs production (temuan mismatch key–endpoint) + perbaiki 2x build Vercel gagal hingga hijau ✅
url website : https://umrahqu-marketplace.vercel.app
url youtube : https://youtu.be/hFGgw-ObbWk
