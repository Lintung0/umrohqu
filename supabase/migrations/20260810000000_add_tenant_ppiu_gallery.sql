-- =========================================================
-- UmrohQ — Add PPIU & staff fields to tenants
-- =========================================================
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS ppiu_number text,
  ADD COLUMN IF NOT EXISTS accredited_at date,
  ADD COLUMN IF NOT EXISTS total_jamaah integer not null default 0,
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb not null default '[]',
  ADD COLUMN IF NOT EXISTS video_urls jsonb not null default '[]';
