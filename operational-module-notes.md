# 📌 Developer Release Notes: Modul Operasional Travel & Standarisasi Skema

Dokumen ringkas ini ditujukan untuk seluruh tim pengembang (developer) yang mengerjakan ekosistem UmrahQu (Marketplace, Travel Dashboard, dan Admin Platform) terkait penambahan fitur operasional travel, refaktorisasi kolom legacy, dan standarisasi skema database.

---

## 1. Breaking Changes & Pembersihan Kolom Legacy

Beberapa kolom lama yang bersifat ambigu atau redundant telah dihapus dan digantikan oleh relasi database yang terstruktur:

### Tabel `public.packages`
* ❌ **`departure_city` (text) Dihapus**  
  *Alasan:* Sebelumnya ambigu karena satu paket tidak bisa memiliki banyak kota keberangkatan dari cabang yang berbeda.  
  *Solusi:* Kini digantikan oleh relasi 1-to-many pada tabel **`package_departures`**. Seluruh data lama telah di-backfill.
* ❌ **`currency` (text) Dihapus**  
  *Alasan:* Seluruh sistem UmrahQu beroperasi dalam mata uang IDR (`Rp`), kolom ini redundant.
* ❌ **`doc_drive_link` (text) Dihapus**  
  *Alasan:* Out of scope dari kebutuhan inti skema paket.

### Tabel `public.bookings`
* ❌ **`booking_source` Dihapus** (redundant dengan `booking_channel`).
* ❌ **`dp_percentage` Dihapus** (bisa dihitung dinamis dari `dp_amount / price * 100`).
* ❌ **`gateway_invoice_id` Dihapus** (posisi yang tepat berada di tabel `payments`, bukan di header booking).
* ➕ **Kolom Baru Ditambahkan**:
  * `agent_id` (uuid, FK ke `agents.id` ON DELETE SET NULL).
  * `referral_code` (varchar(20), snapshot kode referal saat pemesanan).
  * `package_departure_id` (uuid, FK ke `package_departures.id` ON DELETE SET NULL).

### Tabel `public.users`
* ➕ **`branch_id` Ditambahkan** (uuid, FK ke `branches.id` ON DELETE SET NULL). Berguna untuk role `travel_agent` dan `travel_muthawif`.

---

## 2. Tabel-Tabel Baru (Konvensi Nama Langsung ke Inti)

Semua tabel baru menggunakan penamaan langsung ke entitas inti (tanpa prefix `travel_` atau `tenant_`):

### A. SDM, Mitra, & Struktur Cabang
1. **`branches`**: Master kantor cabang travel operasional (`name`, `city`, `address`, `phone`, `is_primary`).
2. **`agents`**: Profil agen mitra perorangan penutup penjualan (`user_id`, `branch_id`, `referral_code`, `commission_amount`, `commission_trigger`).
3. **`muthawifs`**: Profil pembimbing manasik & ibadah (`user_id`, `branch_id`, `certification_no`, `specialization`).
4. **`agent_commissions`**: Catatan komisi agen flat per booking berhasil (`amount`, status: `pending`/`paid`/`cancelled`).

### B. Multi-Kota Keberangkatan & Akomodasi
5. **`package_departures`**: Pilihan multi-kota & jadwal keberangkatan per paket (`package_id`, `branch_id`, `departure_city`, `departure_date`, `quota`, `price_adjustment`).
6. **`hotels`**: Master hotel per travel (diperkaya dengan `tenant_id`, `facilities`, `distance_to_haram_meters`, `deleted_at`).
7. **`airlines`**: Master maskapai penerbangan (`name`, `iata_code`, `logo_url`).
8. **`package_hotels`**: Relasi hotel dalam paket (check-in/out, `night_count`, `sort_order`).
9. **`package_flights`**: Relasi penerbangan paket yang kini terhubung FK ke `airlines.id` (`flight_type`: `outbound`/`return`).

### C. Rooming & Bus (Plotting Lapangan)
10. **`room_templates`**: Template kamar per paket dan per hotel (`room_number`, `room_type`, `capacity`, `floor`).
11. **`bus_templates`**: Template unit armada bus per paket (`bus_number`, `capacity`).
12. **`bus_seats`**: Daftar nomor kursi bus (`seat_number` e.g. `1A`, `1B`).
13. **`room_assignments`**: Penempatan kamar jamaah (`participant_id`, `room_template_id`). Jamaah bisa ditempatkan di kamar Makkah dan Madinah tanpa konflik.
14. **`seat_assignments`**: Penempatan kursi bus jamaah (`participant_id`, `bus_seat_id` UNIQUE per kursi).

### D. Bimbingan Manasik & Logistik Perlengkapan
15. **`manasik_programs`**: Program manasik paket (`name`, `lead_muthawif_id`).
16. **`manasik_sessions`**: Jadwal sesi pertemuan materi manasik (`session_date`, `start_time`, `location`, `muthawif_id`, `materials_url`).
17. **`manasik_attendances`**: Presensi kehadiran jamaah per sesi (`status`: `present`, `absent`, `excused`).
18. **`equipment_templates`**: Master perlengkapan paket (koper, kain ihram, seragam, buku doa, `requires_size`, `size_options`).
19. **`participant_equipment`**: Penyerahan perlengkapan ke jamaah individual (`size`, `quantity`, `status`: `pending`, `ready`, `distributed`, `returned`).

---

## 3. Enum Baru

| Enum | Nilai / Values | Keterangan |
|---|---|---|
| `user_role` | `+ travel_agent`, `+ travel_muthawif` | Menambahkan role mitra agen dan muthawif |
| `agent_commission_trigger` | `'on_dp'`, `'on_paid'`, `'on_departure'` | Kondisi pencatatan komisi agen flat |
| `manasik_attendance_status` | `'present'`, `'absent'`, `'excused'` | Status absensi kehadiran manasik |
| `equipment_status` | `'pending'`, `'ready'`, `'distributed'`, `'returned'` | Alur distribusi perlengkapan jamaah |
| `room_type` | `'single'`, `'double'`, `'triple'`, `'quad'` | Tipe kapasitas kamar hotel |

---

## 4. Otomasi Database Trigger

1. **`trg_resolve_booking_agent` (BEFORE INSERT/UPDATE pada `bookings`)**:
   - Jika saat booking diisi `referral_code` tetapi `agent_id` kosong, trigger akan otomatis mencari agen aktif dengan kode tersebut dan mengisi `agent_id`.
2. **`trg_auto_record_agent_commission` (AFTER INSERT/UPDATE pada `bookings`)**:
   - Ketika booking memiliki `agent_id` dan pembayaran terkonfirmasi (`paid_amount > 0` atau status `confirmed`), sistem otomatis meng-insert baris baru di `agent_commissions` dengan status `pending` sejumlah flat `agents.commission_amount`.

---

## 5. Konsep Keamanan RLS (Penting untuk Frontend)

* **Marketplace Layer (Akses Publik)**:
  - User dengan role `travel_muthawif` atau `travel_agent` **tetap dapat melihat seluruh paket publik aktif di marketplace dan bebas melakukan checkout/booking** untuk diri mereka sendiri sebagai customer biasa.
* **Internal Operational Layer**:
  - Muthawif hanya dapat melihat program manasik, sesi, dan daftar jamaah pada sesi yang ditugaskan kepada mereka.
  - Agen hanya dapat melihat profil dan riwayat komisi mereka sendiri.
  - Travel staff mengelola operasional sesuai tenant mereka (`is_tenant_staff(tenant_id)`).

---

## 6. Checklist untuk Developer

- [x] Sinkronisasi migrasi Supabase: Jalankan `bun run supabase:push` (status harus *Remote database is up to date*).
- [x] Pembaruan Types TypeScript: Jalankan `bun run update-types` jika ada perubahan skema database terbaru.
- [x] Verifikasi build aplikasi: Jalankan `bun run build` sebelum push branch.
