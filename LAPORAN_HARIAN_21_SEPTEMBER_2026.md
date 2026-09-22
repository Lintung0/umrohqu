Lintang Mahameru Putra || SMKN 6 MALANG
Laporan harian : senin, 21 september 2026

umrahqu (marketplace) :
=> instalasi skill antislop-ai (6 skills) ke .opencode/skills/ ✅
=> pembuatan DESIGN.md acuan desain (identitas, personality, palet ivory+emas+emerald, tipografi Jakarta Sans) ✅
=> penambahan token warna ivory ke globals.css ✅
=> restyle seluruh halaman dashboard jamaah (11 halaman) mengikuti DESIGN.md: hapus gradient/glow/shadow, kartu ivory, aksen emas, tombol solid emerald-deep, no emoji/em dash ✅
=> penambahan prop hideFooter pada StatCard ✅
=> hapus Quick Actions dari dashboard ringkasan ✅
=> rename istilah "Pesan" → "Pesanan" di seluruh codebase ✅
=> fix FAQ & locale: Xendit → Midtrans (gateway aktual) ✅
=> update NEXT_PUBLIC_APP_URL ke https://umrahqu.com/ + fallback appUrl() ✅
=> hapus tombol "Kembali" di halaman detail pesanan ✅
=> hapus subtitle "Semoga perjalanan ibadah..." di header ringkasan ✅
=> hapus label statistik di kartu ringkasan ✅
=> fix judul halaman bookings: "Pemesanan Saya" → "Pesanan Saya", hapus subtitle, rapikan jarak filter ↔ grup tanggal ✅
=> hapus menu "Data Diri" dari sidebar dashboard ✅
=> pindah pengisian data diri ke detail pesanan: kolom status + tombol edit per jamaah ✅
=> modal form lengkap per jamaah (identitas/paspor, kontak darurat, alamat) simpan ke booking_participants ✅
=> redirect /dashboard/data-diri → /dashboard/bookings ✅
=> update API booking/detail select field include kolom baru ✅