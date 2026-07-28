-- Fix: RLS recursive error 54001 on users table
-- auth_role() and auth_tenant_id() need SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.auth_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$;
