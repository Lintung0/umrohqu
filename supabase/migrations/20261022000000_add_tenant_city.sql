-- Lokasi pusat travel (kota) — ditampilkan di card travel pada halaman paket detail
-- dan di halaman profil travel.
alter table public.tenants
  add column if not exists city text;

comment on column public.tenants.city is 'Kota / lokasi pusat travel (mis. Surabaya)';
