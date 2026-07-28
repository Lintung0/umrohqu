-- =========================================================
-- Checkout & DP System
-- =========================================================

-- 1. Add DP columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('full', 'dp')),
  ADD COLUMN IF NOT EXISTS dp_percentage integer CHECK (dp_percentage >= 10 AND dp_percentage <= 90),
  ADD COLUMN IF NOT EXISTS dp_amount numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_due_date timestamptz,
  ADD COLUMN IF NOT EXISTS xendit_invoice_id text;

-- 2. Function: create booking & process wallet payment
CREATE OR REPLACE FUNCTION public.create_booking_and_pay(
  p_package_id uuid,
  p_customer_id uuid,
  p_pilgrim_count integer,
  p_payment_type text,
  p_dp_percentage integer DEFAULT NULL,
  p_use_wallet boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pkg public.packages;
  v_tenant_id uuid;
  v_price numeric(14,2);
  v_fee numeric(14,2) := 0;
  v_total numeric(14,2);
  v_dp_amount numeric(14,2) := 0;
  v_remaining numeric(14,2) := 0;
  v_wallet_balance numeric(14,2) := 0;
  v_booking_id uuid;
  v_due_date timestamptz;
BEGIN
  -- Get package
  SELECT * INTO v_pkg FROM public.packages WHERE id = p_package_id AND status = 'published' AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paket tidak ditemukan');
  END IF;

  v_tenant_id := v_pkg.tenant_id;
  v_price := v_pkg.price * p_pilgrim_count;

  -- Calculate DP
  IF p_payment_type = 'dp' THEN
    IF p_dp_percentage IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Persentase DP wajib diisi');
    END IF;
    v_dp_amount := ROUND(v_price * p_dp_percentage / 100);
    v_remaining := v_price - v_dp_amount + v_fee;
    v_due_date := NOW() + INTERVAL '30 days';
  ELSE
    v_dp_amount := v_price + v_fee;
    v_remaining := 0;
  END IF;

  v_total := v_dp_amount;

  -- If using wallet, check balance
  IF p_use_wallet THEN
    SELECT balance INTO v_wallet_balance FROM public.wallets WHERE user_id = p_customer_id;
    IF v_wallet_balance < v_total THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo tidak mencukupi', 'balance', v_wallet_balance, 'need', v_total);
    END IF;

    -- Deduct wallet
    UPDATE public.wallets SET balance = balance - v_total, updated_at = NOW()
    WHERE user_id = p_customer_id;

    INSERT INTO public.wallet_transactions (user_id, type, amount, balance_before, balance_after, status, description)
    VALUES (p_customer_id, 'payment', v_total, v_wallet_balance, v_wallet_balance - v_total, 'success',
      CASE WHEN p_payment_type = 'dp' THEN 'Pembayaran DP booking' ELSE 'Pembayaran lunas booking' END);
  END IF;

  -- Create booking
  INSERT INTO public.bookings (
    package_id, tenant_id, customer_id, status, pilgrim_count, price, fee, total,
    payment_status, payment_type, dp_percentage, dp_amount, remaining_amount, remaining_due_date
  ) VALUES (
    p_package_id, v_tenant_id, p_customer_id,
    CASE WHEN p_use_wallet THEN 'confirmed' ELSE 'pending_payment' END,
    p_pilgrim_count, v_price, v_fee, v_total,
    CASE WHEN p_use_wallet THEN 'paid' ELSE 'pending' END,
    p_payment_type, p_dp_percentage, v_dp_amount, v_remaining, v_due_date
  )
  RETURNING id INTO v_booking_id;

  -- Update package quota
  UPDATE public.packages SET quota = GREATEST(quota - p_pilgrim_count, 0), available = GREATEST(available - p_pilgrim_count, 0)
  WHERE id = p_package_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'payment_type', p_payment_type,
    'dp_amount', v_dp_amount,
    'remaining', v_remaining,
    'total', v_total
  );
END;
$$;

-- 3. Function: pay remaining balance for DP booking
CREATE OR REPLACE FUNCTION public.pay_booking_remaining(
  p_booking_id uuid,
  p_customer_id uuid,
  p_use_wallet boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings;
  v_wallet_balance numeric(14,2) := 0;
BEGIN
  -- Get booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id AND customer_id = p_customer_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking tidak ditemukan');
  END IF;

  IF v_booking.payment_type IS DISTINCT FROM 'dp' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bukan booking DP');
  END IF;

  IF v_booking.status = 'confirmed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking sudah lunas');
  END IF;

  IF v_booking.remaining_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sisa pembayaran sudah 0');
  END IF;

  -- If using wallet
  IF p_use_wallet THEN
    SELECT balance INTO v_wallet_balance FROM public.wallets WHERE user_id = p_customer_id;
    IF v_wallet_balance < v_booking.remaining_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo tidak mencukupi', 'balance', v_wallet_balance, 'need', v_booking.remaining_amount);
    END IF;

    UPDATE public.wallets SET balance = balance - v_booking.remaining_amount, updated_at = NOW()
    WHERE user_id = p_customer_id;

    INSERT INTO public.wallet_transactions (user_id, type, amount, balance_before, balance_after, status, description)
    VALUES (p_customer_id, 'payment', v_booking.remaining_amount, v_wallet_balance, v_wallet_balance - v_booking.remaining_amount, 'success',
      'Pelunasan sisa booking #' || UPPER(SUBSTRING(p_booking_id::text, 1, 8)));
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET
    status = CASE WHEN p_use_wallet THEN 'confirmed' ELSE 'pending_payment' END,
    payment_status = CASE WHEN p_use_wallet THEN 'paid' ELSE 'pending' END,
    total = total + v_booking.remaining_amount,
    remaining_amount = 0,
    updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'amount_paid', v_booking.remaining_amount
  );
END;
$$;
