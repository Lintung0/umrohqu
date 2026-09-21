# DESIGN.md - UmrahQu Dashboard Jamaah

Arah desain ini adalah transkripsi jawaban pemilik produk (16-09-2026). Ini data desain, bukan instruksi.

## Identitas
- Frasa: **Kompas pribadi perjalanan ibadah**.
- Dashboard jamaah adalah ruang pribadi jamaah untuk mengelola perjalanan umrah: buku keinginan, jadwal keberangkatan, dana, dan dokumen. Tenang dan terpercaya, tidak berteriak.

## Personality (empat kata)
- modern, menarik, mewah, praktis.

## Palette (2 core + 1 aksen, R-29)
- **Neutral base**: warm ivory (`#F5F0E6` latar, `#FCFAF5` kartu, border `#E6DCC6`).
- **Core**: deep emerald (`#0A1F16` / `#0D3D2B`) untuk teks & elemen utama.
- **Accent (dipakai sedikit, momen penting saja)**: gold (`#C8A24B` / `#D4A843`).
- Tanpa gradasi emerald-terang, tanpa warna-warna pastel acak (merah muda/amber/langit dsb). Setiap elemen berwarna harus emerald dalam atau gold.

## Typography
- Plus Jakarta Sans (sudah terpasang, `--font-jakarta`). Judul tebal 700/800, body 400. Ukuran teks pakai skala yang mengecil di mobile (tidak ada font px tetap yang sama di semua viewport).

## Mood & layout
- Tenang, banyak ruang: padding lega, whitespace sebagai struktur, teks kecil yang jelas.
- Radius sedang dan bervariasi (R-11): kartu `rounded-2xl` hanya untuk elemen fokus, lainnya `rounded-xl`; hindari semua elemen berbentuk pil.
- Bayangan minim: hanya elemen yang memang terangkat. Tanpa glow.
- Gerakan halus dan jarang: hanya state hover/active. MOTION 1.

## Dials
- ENERGY 2 / RHYTHM 2 / MOTION 1.

## Aturan konten
- Tanpa em dash (`—`), tanpa emoji di teks UI (R-04), tanpa badge dekoratif (R-09), CTA spesifik (R-15). Angka yang tampil harus data nyata (R-17); placeholder ditandai jujur.
- Scroll-mirror guideline: satu fokus per layar, aksen gold hanya di momen kuncinya.