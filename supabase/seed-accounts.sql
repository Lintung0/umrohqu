-- =============================================
-- SEED DATA: Development Accounts
-- Password for all accounts: pwd123!@#
-- All emails pre-verified
-- =============================================

-- 1. ADMIN ACCOUNTS
-- Admin utama
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_super_admin, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@gmail.com',
  crypt('pwd123!@#', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "admin@gmail.com", "email_verified": true, "full_name": "Admin Utama"}',
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@gmail.com',
  'Admin Utama',
  'super_admin',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Finance admin
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_super_admin, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'finance@gmail.com',
  crypt('pwd123!@#', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "finance@gmail.com", "email_verified": true, "full_name": "Finance Admin"}',
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'finance@gmail.com',
  'Finance Admin',
  'marketplace_finance',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Operations admin
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_super_admin, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'operation@gmail.com',
  crypt('pwd123!@#', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "operation@gmail.com", "email_verified": true, "full_name": "Operation Admin"}',
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'operation@gmail.com',
  'Operation Admin',
  'marketplace_operational',
  now(), now()
) ON CONFLICT (id) DO NOTHING;


-- 2. TRAVEL ACCOUNTS
-- Travel 1
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_super_admin, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000004',
  'authenticated',
  'authenticated',
  'travel1@gmail.com',
  crypt('pwd123!@#', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "travel1@gmail.com", "email_verified": true, "full_name": "Travel Berkah"}',
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, tenant_id, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'travel1@gmail.com',
  'Travel Berkah',
  'travel_admin',
  'd0000000-0000-0000-0000-000000000001',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Travel 2
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_super_admin, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000005',
  'authenticated',
  'authenticated',
  'travel2@gmail.com',
  crypt('pwd123!@#', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "travel2@gmail.com", "email_verified": true, "full_name": "Travel Madinah"}',
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, tenant_id, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'travel2@gmail.com',
  'Travel Madinah',
  'travel_admin',
  'd0000000-0000-0000-0000-000000000002',
  now(), now()
) ON CONFLICT (id) DO NOTHING;


-- 3. JAMAAH ACCOUNTS
-- Jamaah 1
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_super_admin, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000006',
  'authenticated',
  'authenticated',
  'jamaah1@gmail.com',
  crypt('pwd123!@#', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "jamaah1@gmail.com", "email_verified": true, "full_name": "Ahmad Fauzi"}',
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'jamaah1@gmail.com',
  'Ahmad Fauzi',
  'jamaah',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Jamaah 2
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_super_admin, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000007',
  'authenticated',
  'authenticated',
  'jamaah2@gmail.com',
  crypt('pwd123!@#', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "jamaah2@gmail.com", "email_verified": true, "full_name": "Siti Aminah"}',
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000007',
  'jamaah2@gmail.com',
  'Siti Aminah',
  'jamaah',
  now(), now()
) ON CONFLICT (id) DO NOTHING;
