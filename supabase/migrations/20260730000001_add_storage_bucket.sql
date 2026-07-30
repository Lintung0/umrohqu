insert into storage.buckets (id, name, public) values ('packages', 'packages', true)
on conflict (id) do nothing;

create policy "Anyone can view package images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'packages');

create policy "Tenant staff can upload package images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'packages'
  and exists (
    select 1 from public.users
    where id = auth.uid()
    and role in ('travel_admin', 'travel_staff', 'super_admin', 'marketplace_admin')
  )
);

create policy "Tenant staff can update own package images"
on storage.objects for update
to authenticated
using (bucket_id = 'packages' and owner = auth.uid())
with check (bucket_id = 'packages' and owner = auth.uid());

create policy "Tenant staff can delete own package images"
on storage.objects for delete
to authenticated
using (bucket_id = 'packages' and owner = auth.uid());
