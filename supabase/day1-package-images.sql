-- Package Images Table (Gallery)
CREATE TABLE IF NOT EXISTS package_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE package_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view package images"
  ON package_images FOR SELECT
  USING (true);

CREATE POLICY "Travel staff can manage package images"
  ON package_images FOR ALL
  USING (
    auth_role() IN ('travel_admin', 'travel_staff')
    AND auth_tenant_id() = (SELECT tenant_id FROM packages WHERE id = package_id)
  );

-- Participants Table (managed by customer & travel)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nik TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  gender TEXT CHECK (gender IN ('L', 'P')),
  phone TEXT,
  birth_date DATE,
  address TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own participants"
  ON participants FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Travel can view participants of their bookings"
  ON participants FOR SELECT
  USING (
    auth_role() IN ('travel_admin', 'travel_staff')
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.tenant_id = auth_tenant_id()
      AND b.participant_ids ? id::text
    )
  );

-- Add participant_ids and service_fee columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS participant_ids UUID[] DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fee_channel TEXT DEFAULT 'portal';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add multiple images support to packages
ALTER TABLE packages ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
