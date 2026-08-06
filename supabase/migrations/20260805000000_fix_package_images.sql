-- =============================================
-- Migration: Fix all package image_url to Islamic images
-- Generated: 2026-08-05
-- Run in Supabase SQL Editor
-- =============================================

-- Islamic images bank:
-- Ka'bah crowd:    https://images.unsplash.com/photo-1564769625905-50e93615e769
-- Ka'bah close-up: https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa
-- Masjid Nabawi:   https://images.unsplash.com/photo-1565552645632-d725f8bfc19a
-- Masjid Aqsa:     https://images.unsplash.com/photo-1542810634-71277d95dcbb
-- Ka'bah night:    https://images.unsplash.com/photo-1584738766473-61c083514bf4

-- Step 1: Reset ALL images to Ka'bah (safety net)
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80&fm=webp&auto=format'
WHERE image_url IS NOT NULL;

-- Step 2: VIP packages → Ka'bah crowd (premium feel)
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format'
WHERE type = 'vip'
   OR slug ILIKE '%vip%';

-- Step 3: Furoda packages → Ka'bah crowd (premium)
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format'
WHERE type = 'furoda'
   OR slug ILIKE '%furoda%';

-- Step 4: Plus / Aqsa packages → Masjid Al-Aqsa
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=800&q=80&fm=webp&auto=format'
WHERE type = 'plus'
   OR slug ILIKE '%plus%'
   OR slug ILIKE '%aqsa%';

-- Step 5: Regular packages → Masjid Nabawi
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800&q=80&fm=webp&auto=format'
WHERE type = 'regular'
   OR slug ILIKE '%reguler%'
   OR slug ILIKE '%hemat%'
   OR slug ILIKE '%ekonomis%';

-- Step 6: Block any remaining non-Islamic images
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80&fm=webp&auto=format'
WHERE image_url ILIKE '%1567496146600%'
   OR image_url ILIKE '%1549888834%'
   OR image_url ILIKE '%wooden%'
   OR image_url ILIKE '%cabin%'
   OR image_url ILIKE '%cottage%';

-- Verify results
SELECT id, slug, name, type, image_url
FROM public.packages
WHERE deleted_at IS NULL
ORDER BY type, name;
