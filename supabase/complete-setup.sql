-- =============================================================
-- COMPLETE SETUP SCRIPT — Jalanin sekali di Supabase SQL Editor
-- =============================================================

-- 1. TAMBAH STATUS PROCESSING KE BOOKING (kalo belum ada)
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'processing' AFTER 'pending_payment';

-- 2. TAMBAH KOLOM SETUP FEE KE TENANTS
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS setup_fee numeric(14,2) DEFAULT 5000000,
  ADD COLUMN IF NOT EXISTS setup_fee_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_fee_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- 3. ADD TYPE 'setup_fee' KE invoice_type CHECK
-- Skip dulu karena invoices pake check type text, kita update langsung
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_type_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_type_check
  CHECK (type IN ('setup_fee', 'service_fee', 'subscription', 'refund'));

-- 4. SETUP FEE CONFIG DEFAULT (kalo belum ada)
INSERT INTO public.fee_config (portal_fee_per_person, subdomain_fee_per_person, custom_domain_fee_per_person, service_fee_percent, service_fee_flat, setup_fee, tax_percent)
SELECT 300000, 100000, 100000, 3.00, 300000, 5000000, 11.00
WHERE NOT EXISTS (SELECT 1 FROM public.fee_config);

-- 5. WALLET TABLES (kalo belum ada)
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user can view own wallet" ON public.wallets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "system can manage all wallets" ON public.wallets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','marketplace_admin','marketplace_finance')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','marketplace_admin','marketplace_finance')));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('topup', 'payment', 'refund', 'withdrawal', 'fee_deduction')),
  amount numeric(14,2) NOT NULL,
  balance_before numeric(14,2) NOT NULL DEFAULT 0,
  balance_after numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_method text,
  xendit_invoice_id text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_xendit ON public.wallet_transactions(xendit_invoice_id);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user can view own transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "system can manage transactions" ON public.wallet_transactions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','marketplace_admin','marketplace_finance')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','marketplace_admin','marketplace_finance')));

-- 6. TRIGGER: AUTO-CREATE WALLET UNTUK USER BARU
CREATE OR REPLACE FUNCTION public.auto_create_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_wallet ON public.users;
CREATE TRIGGER trg_auto_create_wallet
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_wallet();

-- 7. FUNCTION: TOPUP WALLET
CREATE OR REPLACE FUNCTION public.topup_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_xendit_invoice_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance_before numeric;
  v_balance_after numeric;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_balance_after := v_balance_before + p_amount;

  UPDATE public.wallets
  SET balance = v_balance_after, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_before, balance_after, status, xendit_invoice_id, description)
  VALUES (p_user_id, 'topup', p_amount, v_balance_before, v_balance_after, 'success', p_xendit_invoice_id, 'Topup via Xendit');

  RETURN jsonb_build_object('success', true, 'balance', v_balance_after);
END;
$$;

-- 8. FUNCTION: DEDUCT FEE FROM WALLET (dipanggil setelah booking dibayar)
CREATE OR REPLACE FUNCTION public.deduct_fee(
  p_user_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance_before numeric;
  v_balance_after numeric;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_balance_after := v_balance_before - p_amount;

  UPDATE public.wallets
  SET balance = v_balance_after, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_before, balance_after, status, description)
  VALUES (p_user_id, 'fee_deduction', -p_amount, v_balance_before, v_balance_after, 'success', p_description);

  RETURN jsonb_build_object('success', true, 'balance', v_balance_after);
END;
$$;

-- 9. BACKFILL: buat wallet untuk user yang udah ada tapi belum punya wallet
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0 FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;

-- 10. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('packages', 'packages', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view package images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'packages');

CREATE POLICY "Tenant staff can upload package images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'packages'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('travel_admin', 'travel_staff', 'super_admin', 'marketplace_admin')
    )
  );

CREATE POLICY "Tenant staff can update own package images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'packages' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'packages' AND owner = auth.uid());

CREATE POLICY "Tenant staff can delete own package images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'packages' AND owner = auth.uid());
