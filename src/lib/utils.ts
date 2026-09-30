import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function appUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "https://umrahqu.com"
  const clean = base.startsWith("http") ? base : `https://${base}`
  if (!path) return clean
  return `${clean.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatRupiahInput(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value)
}

export function parseRupiahInput(formatted: string): number {
  const cleaned = formatted.replace(/[^0-9]/g, "")
  return cleaned ? parseInt(cleaned, 10) : 0
}

export function getPackageAvailable(pkg: { available?: number | null; quota?: number | null; quota_taken?: number | null }): number {
  return pkg.available ?? Math.max(0, (pkg.quota ?? 0) - (pkg.quota_taken ?? 0))
}

const AIRLINE_HINTS = [
  "Saudi Arabian Airlines", "Saudia", "Garuda Indonesia", "Qatar Airways", "Qatar",
  "Emirates", "Etihad", "Turkish Airlines", "Batik Air", "Lion Air", "AirAsia",
  "Royal Jordanian", "Malaysia Airlines", "Singapore Airlines",
]

export function extractAirline(includes: unknown[] | null | undefined, known?: string | null): string | null {
  if (known?.trim()) return known.trim()
  const text = (includes || []).map((i) => String(i ?? "")).join(" ")
  if (!text) return null
  return AIRLINE_HINTS.find((a) => text.includes(a)) || null
}

export function extractHotelStars(includes: unknown[] | null | undefined, known?: number | null): number | null {
  if (known && known > 0) return known
  const text = (includes || []).map((i) => String(i ?? "")).join(" ")
  const m = text.match(/bintang\s*(\d)/i)
  return m ? Math.min(Number(m[1]), 5) : null
}

export function extractHotelName(includes: unknown[] | null | undefined, known?: string | null): string | null {
  if (known?.trim()) return known.trim()
  const hotelLines = (includes || []).map((i) => String(i ?? "")).filter((l) => /hotel/i.test(l))
  if (hotelLines.length === 0) return null
  const text = hotelLines.join(" ")
  const m = text.match(/\(([A-Z][A-Za-z0-9 ,.&'-]+)\)/)
  return m?.[1]?.trim() || null
}

export function formatDepartureDate(date: string | null | undefined): string | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d)
}

export function getSeatAvailability(
  available: number | null | undefined,
  quota: number,
  quotaTaken?: number | null,
) {
  const avail = available ?? (quotaTaken != null ? Math.max(0, quota - quotaTaken) : quota)
  const percent = quota > 0 ? (avail / quota) * 100 : 100
  const color = percent <= 20 ? "bg-red-500" : percent <= 50 ? "bg-amber-500" : "bg-emerald-500"
  const textColor = percent <= 20 ? "text-red-600" : percent <= 50 ? "text-amber-600" : "text-emerald-600"
  const bgColor = percent <= 20 ? "bg-red-100" : percent <= 50 ? "bg-amber-100" : "bg-emerald-100"
  const label = percent <= 20 ? "Segera Habis!" : percent <= 50 ? "Terbatas" : "Tersedia"
  return { available: avail, percent, color, textColor, bgColor, label }
}

export function decodeUnicodeEscapes(str: string): string {
  if (!str) return str
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}
