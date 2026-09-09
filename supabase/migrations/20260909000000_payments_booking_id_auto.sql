-- payments.booking_id diisi otomatis oleh database (fungsi + trigger),
-- bukan ditimpa aplikasi pada saat insert.

create or replace function public.payments_auto_booking_id()
returns trigger
language plpgsql
as $$
declare
  v_booking_id uuid := nullif(current_setting('app.booking_id', true), '');
begin
  if v_booking_id is null then
    raise exception 'app.booking_id belum diset';
  end if;
  NEW.booking_id := v_booking_id;
  return NEW;
end;
$$;

drop trigger if exists trg_payments_auto_booking_id on public.payments;
create trigger trg_payments_auto_booking_id
before insert on public.payments
for each row execute function public.payments_auto_booking_id();

-- Helper pembayaran: set konteks booking_id lalu insert payments
-- dalam SATU transaksi agar trigger membaca nilai dari current_setting.
create or replace function public.create_payment(
  p_booking_id uuid,
  p_tenant_id uuid,
  p_amount numeric,
  p_status text default 'pending',
  p_gateway text default 'midtrans',
  p_currency text default 'IDR'
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
begin
  perform set_config('app.booking_id', p_booking_id::text, true);
  insert into public.payments (tenant_id, status, payment_gateway, amount, currency)
  values (p_tenant_id, p_status::public.payment_status, p_gateway, p_amount, p_currency)
  returning id into v_id;
  return v_id;
end;
$$;