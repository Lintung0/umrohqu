-- =========================================================
-- Wallet & Topup System
-- =========================================================

-- 1. Wallets
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

-- 2. Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('topup', 'payment', 'refund', 'withdrawal')),
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

-- 3. Trigger: auto-create wallet for new users
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

-- 4. Function: topup wallet (dipanggil dari API setelah Xendit callback)
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
