-- Izinkan jamaah menyimpan (insert) alamat miliknya sendiri.
-- Sebelumnya user_addresses hanya punya policy INSERT untuk admin,
-- sehingga simpan data diri (POST /rest/v1/user_addresses) gagal 42501.

create policy "user_addresses: users can insert own"
  on user_addresses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_addresses: users can delete own"
  on user_addresses
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);