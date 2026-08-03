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
