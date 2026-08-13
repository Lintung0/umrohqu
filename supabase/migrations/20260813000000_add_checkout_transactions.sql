-- =========================================================
-- Transaction records for checkout RPCs
-- - create_booking_and_pay  : compute fees from fee_config (server-side), insert payments + invoices
-- - pay_booking_remaining   : insert payments + invoices on wallet settlement
-- =========================================================

-- 1. create_booking_and_pay
CREATE OR REPLACE FUNCTION public.create_booking_and_pay(
  p_package_id uuid,
  p_customer_id uuid,
  p_pilgrim_count integer,
  p_payment_type text,
  p_dp_percentage integer DEFAULT NULL,
  p_use_wallet boolean DEFAULT false,
  p_fee_channel text DEFAULT 'portal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pkg public.packages;
  v_fc public.fee_config%ROWTYPE;
  v_tenant_id uuid;
  v_price numeric(14,2);
  v_fee numeric(14,2) := 0;
  v_total numeric(14,2);
  v_dp_amount numeric(14,2) := 0;
  v_remaining numeric(14,2) := 0;
  v_wallet_balance numeric(14,2) := 0;
  v_booking_id uuid;
  v_due_date timestamptz;
  v_platform_fee numeric(14,2) := 0;
  v_service_fee numeric(14,2) := 0;
  v_tax numeric(14,2) := 0;
  v_now timestamptz := NOW();
BEGIN
  -- Get package
  SELECT * INTO v_pkg FROM public.packages WHERE id = p_package_id AND status = 'published' AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paket tidak ditemukan');
  END IF;

  -- Fee config (sumber kebenaran harga layanan)
  SELECT * INTO v_fc FROM public.fee_config LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Konfigurasi fee tidak ditemukan');
  END IF;

  v_tenant_id := v_pkg.tenant_id;
  v_price := v_pkg.price * p_pilgrim_count;

  -- Hitung fee dari fee_config (tidak menerima fee dari client)
  v_platform_fee := CASE p_fee_channel
    WHEN 'portal' THEN v_fc.portal_fee_per_person
    WHEN 'custom_domain' THEN v_fc.custom_domain_fee_per_person
    ELSE v_fc.subdomain_fee_per_person
  END * p_pilgrim_count;
  v_service_fee := GREATEST(v_price * v_fc.service_fee_percent / 100, v_fc.service_fee_flat);
  v_tax := ROUND((v_platform_fee + v_service_fee) * v_fc.tax_percent / 100);
  v_fee := v_platform_fee + v_service_fee + v_tax;

  -- Calculate DP
  IF p_payment_type = 'dp' THEN
    IF p_dp_percentage IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Persentase DP wajib diisi');
    END IF;
    v_dp_amount := ROUND(v_price * p_dp_percentage / 100);
    v_remaining := v_price - v_dp_amount + v_fee;
    v_due_date := v_now + INTERVAL '30 days';
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

    UPDATE public.wallets SET balance = balance - v_total, updated_at = v_now WHERE user_id = p_customer_id;

    INSERT INTO public.wallet_transactions (user_id, type, amount, balance_before, balance_after, status, description)
    VALUES (p_customer_id, 'payment', v_total, v_wallet_balance, v_wallet_balance - v_total, 'success',
      CASE WHEN p_payment_type = 'dp' THEN 'Pembayaran DP booking' ELSE 'Pembayaran lunas booking' END);
  END IF;

  -- Create booking
  INSERT INTO public.bookings (
    package_id, tenant_id, customer_id, status, pilgrim_count, price, fee, total,
    payment_status, payment_type, dp_percentage, dp_amount, remaining_amount, remaining_due_date,
    platform_fee, service_fee, tax_amount, fee_channel
  ) VALUES (
    p_package_id, v_tenant_id, p_customer_id,
    CASE WHEN p_use_wallet THEN 'confirmed'::public.booking_status ELSE 'pending_payment'::public.booking_status END,
    p_pilgrim_count, v_price, v_fee, v_total,
    CASE WHEN p_use_wallet THEN 'paid'::public.payment_status ELSE 'pending'::public.payment_status END,
    p_payment_type, p_dp_percentage, v_dp_amount, v_remaining, v_due_date,
    v_platform_fee, v_service_fee, v_tax, p_fee_channel
  )
  RETURNING id INTO v_booking_id;

  -- Catat transaksi (payments + invoices)
  INSERT INTO public.payments (booking_id, tenant_id, status, gateway, amount, paid_at)
  VALUES (v_booking_id, v_tenant_id,
    CASE WHEN p_use_wallet THEN 'paid'::public.payment_status ELSE 'pending'::public.payment_status END,
    CASE WHEN p_use_wallet THEN 'wallet' ELSE 'xendit' END,
    v_total,
    CASE WHEN p_use_wallet THEN v_now ELSE NULL END);

  INSERT INTO public.invoices (invoice_no, booking_id, tenant_id, total, status, amount, type, description, paid_at)
  VALUES (
    'INV-B-' || UPPER(SUBSTRING(v_booking_id::text, 1, 8)),
    v_booking_id, v_tenant_id, v_price + v_fee,
    CASE WHEN p_use_wallet THEN 'paid'::public.invoice_status ELSE 'issued'::public.invoice_status END,
    v_total, 'booking',
    (SELECT name FROM public.packages WHERE id = p_package_id) || ' (' || p_pilgrim_count || ' jemaah)',
    CASE WHEN p_use_wallet THEN v_now ELSE NULL END);

  -- Update package quota
  UPDATE public.packages SET quota = GREATEST(quota - p_pilgrim_count, 0), available = GREATEST(available - p_pilgrim_count, 0)
  WHERE id = p_package_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'payment_type', p_payment_type,
    'dp_amount', v_dp_amount,
    'remaining', v_remaining,
    'total', v_total,
    'fee', v_fee
  );
END;
$$;

-- 2. pay_booking_remaining
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
  v_now timestamptz := NOW();
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

    UPDATE public.wallets SET balance = balance - v_booking.remaining_amount, updated_at = v_now
    WHERE user_id = p_customer_id;

    INSERT INTO public.wallet_transactions (user_id, type, amount, balance_before, balance_after, status, description)
    VALUES (p_customer_id, 'payment', v_booking.remaining_amount, v_wallet_balance, v_wallet_balance - v_booking.remaining_amount, 'success',
      'Pelunasan sisa booking #' || UPPER(SUBSTRING(p_booking_id::text, 1, 8)));

    INSERT INTO public.payments (booking_id, tenant_id, status, gateway, amount, paid_at)
    VALUES (p_booking_id, v_booking.tenant_id, 'paid', 'wallet', v_booking.remaining_amount, v_now);

    INSERT INTO public.invoices (invoice_no, booking_id, tenant_id, total, status, amount, type, description, paid_at)
    VALUES (
      'INV-B-' || UPPER(SUBSTRING(p_booking_id::text, 1, 8)),
      p_booking_id, v_booking.tenant_id, v_booking.remaining_amount, 'paid',
      v_booking.remaining_amount, 'booking',
      'Pelunasan sisa booking #' || UPPER(SUBSTRING(p_booking_id::text, 1, 8)),
      v_now);
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET
    status = CASE WHEN p_use_wallet THEN 'confirmed' ELSE 'pending_payment' END,
    payment_status = CASE WHEN p_use_wallet THEN 'paid' ELSE 'pending' END,
    total = total + v_booking.remaining_amount,
    remaining_amount = 0,
    updated_at = v_now
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'amount_paid', v_booking.remaining_amount
  );
END;
$$;
