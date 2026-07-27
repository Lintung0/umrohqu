-- =========================================================
-- Trigger: Auto-create public.users when auth.users row is inserted
-- Ensures every new signup (email/password, Google OAuth, etc.)
-- gets a corresponding row in public.users with role 'customer'
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, phone, role, profile)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    'customer',
    jsonb_build_object(
      'avatar_url', coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''),
      'provider', coalesce(new.raw_user_meta_data ->> 'provider', 'email')
    )
  )
  on conflict do nothing;
  return new;
end;
$$;

-- Create trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =========================================================
-- Backfill: Insert existing auth.users that don't have a public.users row
-- Run this once to fix any users who already signed up
-- =========================================================

insert into public.users (id, email, full_name, phone, role, profile)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name', ''),
  coalesce(au.raw_user_meta_data ->> 'phone', null),
  'customer',
  jsonb_build_object(
    'avatar_url', coalesce(au.raw_user_meta_data ->> 'avatar_url', au.raw_user_meta_data ->> 'picture', ''),
    'provider', coalesce(au.raw_user_meta_data ->> 'provider', 'email')
  )
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null;
