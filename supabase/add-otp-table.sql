-- =========================================================
-- UmrohQ — OTP Codes Table (WhatsApp OTP)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL DEFAULT 'password_reset',
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_purpose ON public.otp_codes(phone, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes(expires_at);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage OTP codes (never accessed from client directly)
CREATE POLICY "service_role_manage_otp" ON public.otp_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
