-- =========================================================
-- FIX: Backfill public.users dari auth.users
-- Jalankan ini SETELAH complete-schema-and-seed.sql
-- Atau jalankan sendiri kalau trigger handle_new_user gagal
-- =========================================================

INSERT INTO public.users (id, email, full_name, phone, role, tenant_id, profile)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name', ''),
  COALESCE(au.raw_user_meta_data ->> 'phone', NULL),
  COALESCE((au.raw_user_meta_data ->> 'role')::user_role, 'customer'::user_role),
  CASE WHEN au.raw_user_meta_data ? 'tenant_id'
    THEN (au.raw_user_meta_data ->> 'tenant_id')::uuid
    ELSE NULL
  END,
  jsonb_build_object(
    'avatar_url', COALESCE(au.raw_user_meta_data ->> 'avatar_url', au.raw_user_meta_data ->> 'picture', ''),
    'provider', COALESCE(au.raw_user_meta_data ->> 'provider', 'email')
  )
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- Verify
SELECT pu.id, pu.email, pu.full_name, pu.role, pu.tenant_id
FROM public.users pu
ORDER BY pu.created_at;
