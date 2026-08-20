"use client"

import dynamic from "next/dynamic"
import type { Tenant, Package } from "@/lib/types"

export interface TemplateRegistryEntry {
  id: string
  name: string
  description: string
  category: string
  gradient: string
  accent: string
  component: React.ComponentType<{ tenant: Tenant; packages: Package[]; themeConfig?: Record<string, unknown> }>
}

const ModernIslamicTemplate = dynamic(() => import("./modern-islamic"), { ssr: false })
const CleanMinimalTemplate = dynamic(() => import("./clean-minimal"), { ssr: false })
const RoyalGoldTemplate = dynamic(() => import("./royal-gold"), { ssr: false })

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    name: "Modern Islamic",
    description: "Desain Islami modern dengan pola geometris dan warna hijau-emas",
    category: "Premium",
    gradient: "from-emerald-600 to-emerald-800",
    accent: "#0D7C5F",
    component: ModernIslamicTemplate,
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    name: "Clean Minimal",
    description: "Desain bersih dan minimalis dengan fokus pada konten",
    category: "Umum",
    gradient: "from-gray-800 to-gray-900",
    accent: "#111827",
    component: CleanMinimalTemplate,
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    name: "Royal Gold",
    description: "Desain premium mewah dengan aksen emas dan latar gelap",
    category: "VIP",
    gradient: "from-slate-900 to-indigo-950",
    accent: "#0F172A",
    component: RoyalGoldTemplate,
  },
]

export const TEMPLATE_MAP = TEMPLATE_REGISTRY.reduce(
  (acc, entry) => {
    acc[entry.id] = entry.component
    return acc
  },
  {} as Record<string, React.ComponentType<{ tenant: Tenant; packages: Package[]; themeConfig?: Record<string, unknown> }>>
)

export const TEMPLATE_BY_ID = TEMPLATE_REGISTRY.reduce(
  (acc, entry) => {
    acc[entry.id] = entry
    return acc
  },
  {} as Record<string, TemplateRegistryEntry>
)

export const MOCK_TENANT: Tenant = {
  id: "preview-tenant",
  name: "Travel Umrah Berkah",
  slug: "travel-berkah",
  city: "Jakarta Selatan",
  phone: "+62 812-3456-7890",
  contact_email: "info@berkahtravel.com",
  description: "Biro perjalanan umroh & haji terpercaya sejak 2015. Melayani dengan sepenuh hati.",
  logo_url: null,
  brand_color: "#0D7C5F",
  status: "active",
  custom_domain: null,
  config: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  contact_phone: "+62 812-3456-7890",
  founded: "2015",
  website: null,
  is_verified: true,
  is_featured: false,
  packages_count: 3,
  total_revenue: 0,
  founded_year: "2015",
  // legalitas
  ppiu_number: null,
  sk_ppiu_doc_url: null,
  nib: null,
  nib_doc_url: null,
  npwp: null,
  akreditasi_ppiu: null,
  // alamat
  full_address: null,
  province: null,
  postal_code: null,
}

export const MOCK_PACKAGES: Package[] = [
  {
    id: "preview-pkg-1",
    tenant_id: "preview-tenant",
    name: "Umrah Plus Turki 12 Hari",
    slug: "umrah-plus-turki-12-hari",
    description: "Paket umroh plus wisata Turki dengan fasilitas bintang 5",
    price: 32000000,
    original_price: 35000000,
    duration_days: 12,
    quota: 45,
    quota_taken: 12,
    available: 12,
    departure_city: "Jakarta",
    airline: "Turkish Airlines",
    hotel_makkah: "Swissôtel Makkah",
    hotel_makkah_stars: 5,
    hotel_madinah: "Madinah Hilton",
    hotel_madinah_stars: 5,
    image_url: null,
    doc_drive_link: null,
    status: "active",
    type: "umrah",
    departure_date: "2026-03-15",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: "IDR",
    hotel_info: {},
    facilities: null,
    is_shared_to_marketplace: true,
    deleted_at: null,
    departure_cities: ["Jakarta"],
    departure_month: "2026-03",
    is_promo: true,
    itinerary: null,
    includes: null,
    excludes: null,
    terms: null,
    cancellation_policy: null,
    country: "Arab Saudi",
    country_code: "SA",
    city: "Makkah",
    cashback_amount: 1500000,
  },
  {
    id: "preview-pkg-2",
    tenant_id: "preview-tenant",
    name: "Haji Khusus 21 Hari",
    slug: "haji-khusus-21-hari",
    description: "Paket haji khusus dengan layanan VIP dan pandu berpengalaman",
    price: 65000000,
    original_price: null,
    duration_days: 21,
    quota: 30,
    quota_taken: 8,
    available: 5,
    departure_city: "Surabaya",
    airline: "Saudi Arabian Airlines",
    hotel_makkah: "Fairmont Makkah",
    hotel_makkah_stars: 5,
    hotel_madinah: "Anwar Al Madinah Mövenpick",
    hotel_madinah_stars: 5,
    image_url: null,
    doc_drive_link: null,
    status: "active",
    type: "haji",
    departure_date: "2026-06-20",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: "IDR",
    hotel_info: {},
    facilities: null,
    is_shared_to_marketplace: true,
    deleted_at: null,
    departure_cities: ["Surabaya"],
    departure_month: "2026-06",
    is_promo: false,
    itinerary: null,
    includes: null,
    excludes: null,
    terms: null,
    cancellation_policy: null,
    country: "Arab Saudi",
    country_code: "SA",
    city: "Makkah",
    cashback_amount: 0,
  },
  {
    id: "preview-pkg-3",
    tenant_id: "preview-tenant",
    name: "Umrah Reguler 9 Hari",
    slug: "umrah-reguler-9-hari",
    description: "Paket umroh reguler dengan fasilitas nyaman dan harga terjangkau",
    price: 25500000,
    original_price: 28000000,
    duration_days: 9,
    quota: 50,
    quota_taken: 18,
    available: 23,
    departure_city: "Bandung",
    airline: "Garuda Indonesia",
    hotel_makkah: "Movenpick Hotel & Residence",
    hotel_makkah_stars: 4,
    hotel_madinah: "Al Aqeeq Hotel",
    hotel_madinah_stars: 4,
    image_url: null,
    doc_drive_link: null,
    status: "active",
    type: "umrah",
    departure_date: "2026-04-10",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: "IDR",
    hotel_info: {},
    facilities: null,
    is_shared_to_marketplace: true,
    deleted_at: null,
    departure_cities: ["Bandung"],
    departure_month: "2026-04",
    is_promo: true,
    itinerary: null,
    includes: null,
    excludes: null,
    terms: null,
    cancellation_policy: null,
    country: "Arab Saudi",
    country_code: "SA",
    city: "Makkah",
    cashback_amount: 500000,
  },
]
