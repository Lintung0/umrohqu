-- =============================================
-- Migration: Fix all package image_url to Islamic images
-- Generated: 2026-08-05
-- Run in Supabase SQL Editor
-- =============================================

-- Step 1: Reset ALL images to default Ka'bah (safety net)
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80&fm=webp&auto=format'
WHERE image_url IS NOT NULL;

-- Step 2: Assign varied Islamic images based on package type/slug
-- VIP packages → Ka'bah with crowd (iconic, premium feel)
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format'
WHERE type = 'vip'
   OR slug ILIKE '%vip%';

-- Furoda packages → Ka'bah with crowd (same as VIP, premium)
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format'
WHERE type = 'furoda'
   OR slug ILIKE '%furoda%';

-- Plus / Aqsa packages → Ka'bah close-up (special journey)
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1584738766473-61c083514bf4?w=800&q=80&fm=webp&auto=format'
WHERE type = 'plus'
   OR slug ILIKE '%plus%'
   OR slug ILIKE '%aqsa%';

-- Regular / Hemat packages → Masjid Nabawi (spiritual, calm)
UPDATE public.packages
SET image_url = 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800&q=80&fm=webp&auto=format'
WHERE type = 'regular'
   OR slug ILIKE '%reguler%'
   OR slug ILIKE '%hemat%'
   OR slug ILIKE '%ekonomis%';

-- Verify results
SELECT id, slug, name, type, image_url
FROM public.packages
WHERE deleted_at IS NULL
ORDER BY type, name;
