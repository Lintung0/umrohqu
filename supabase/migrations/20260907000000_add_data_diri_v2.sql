-- Data Diri tahap 2 (lebih lengkap) untuk jamaah.
-- Field tambahan disimpan di users.profile (jsonb) + kolom baru di user_addresses.

alter table user_addresses
  add column if not exists village text,
  add column if not exists district text,
  add column if not exists rt_rw text;