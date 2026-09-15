-- Fitur Pencairan Cashback (jamaah -> admin review -> IRIS/manual)
-- 2026-09-15: sudah diaplikasikan langsung ke DB produksi via supa-api.
-- Tabel `cashbacks` + sebagian policy RLS dibuat manual via Dashboard.

-- 1. Snapshot nominal cashback di booking (agar tidak berubah saat nilai paket diedit)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cashback_amount numeric(14,2) NOT NULL DEFAULT 0;

-- 2. Backfill booking lama dari nilai cashback paket saat ini
UPDATE bookings b
SET cashback_amount = COALESCE(p.cashback_amount, 0)
FROM packages p
WHERE p.id = b.package_id
  AND b.cashback_amount = 0;

-- 3. RLS tambahan yang belum ada (defense-in-depth).
--    Policy lain di tabel `cashbacks` (jamaah lihat punya sendiri, admin/finance
--    kelola semua) sudah dibuat via Dashboard dan tidak akan ditimpa.
ALTER TABLE cashbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cashbacks_insert_own ON cashbacks;
CREATE POLICY cashbacks_insert_own
  ON cashbacks
  FOR INSERT
  WITH CHECK (
    jamaah_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.customer_id = auth.uid()
    )
  );