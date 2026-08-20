import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
