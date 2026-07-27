// Shared constants for UmrohQ

export { formatRupiah } from "@/lib/utils"

export const COST_RANGES = [
  "Semua Biaya",
  "< Rp 25 Juta",
  "Rp 25 – 30 Juta",
  "Rp 30 – 35 Juta",
  "Rp 35 – 40 Juta",
  "Rp 40 – 50 Juta",
  "> Rp 50 Juta",
] as const

export const PACKAGE_TYPES = [
  { value: "semua", label: "Semua Tipe" },
  { value: "reguler", label: "Reguler" },
  { value: "vip", label: "VIP" },
  { value: "plus", label: "Plus" },
  { value: "furoda", label: "Furoda" },
] as const

export const AIRLINES = [
  "semua",
  "Garuda Indonesia",
  "Saudi Airlines",
  "Turkish Airlines",
  "Batik Air",
  "Lion Air",
  "Royal Jordanian",
] as const

export const HOTEL_STARS = [
  { value: "semua", label: "Semua Bintang" },
  { value: "3", label: "Bintang 3+" },
  { value: "4", label: "Bintang 4+" },
  { value: "5", label: "Bintang 5" },
] as const

export const BOOKING_STATUSES = [
  { value: "semua", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "pending_payment", label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  { value: "confirmed", label: "Dikonfirmasi", color: "bg-green-100 text-green-700" },
  { value: "completed", label: "Selesai", color: "bg-blue-100 text-blue-700" },
  { value: "cancelled", label: "Dibatalkan", color: "bg-red-100 text-red-700" },
] as const

export const TRAVEL_STATUSES = [
  { value: "semua", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "pending", label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  { value: "verified", label: "Terverifikasi", color: "bg-green-100 text-green-700" },
  { value: "suspended", label: "Ditangguhkan", color: "bg-orange-100 text-orange-700" },
  { value: "rejected", label: "Ditolak", color: "bg-red-100 text-red-700" },
] as const

export const TICKET_STATUSES = [
  { value: "semua", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "open", label: "Terbuka", color: "bg-blue-100 text-blue-700" },
  { value: "in_progress", label: "Diproses", color: "bg-yellow-100 text-yellow-700" },
  { value: "resolved", label: "Selesai", color: "bg-green-100 text-green-700" },
  { value: "closed", label: "Ditutup", color: "bg-gray-100 text-gray-500" },
] as const

export const INVOICE_STATUSES = [
  { value: "semua", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-500" },
  { value: "issued", label: "Diterbitkan", color: "bg-blue-100 text-blue-700" },
  { value: "paid", label: "Dibayar", color: "bg-green-100 text-green-700" },
  { value: "overdue", label: "Jatuh Tempo", color: "bg-red-100 text-red-700" },
  { value: "cancelled", label: "Dibatalkan", color: "bg-gray-100 text-gray-500" },
] as const

export function getStatusColor(status: string, type: "booking" | "travel" | "ticket" | "invoice"): string {
  const statusMap = {
    booking: Object.fromEntries(BOOKING_STATUSES.map((s) => [s.value, s.color])),
    travel: Object.fromEntries(TRAVEL_STATUSES.map((s) => [s.value, s.color])),
    ticket: Object.fromEntries(TICKET_STATUSES.map((s) => [s.value, s.color])),
    invoice: Object.fromEntries(INVOICE_STATUSES.map((s) => [s.value, s.color])),
  }
  return statusMap[type][status] || "bg-gray-100 text-gray-700"
}

export function getStatusLabel(status: string, type: "booking" | "travel" | "ticket" | "invoice"): string {
  const statusMap = {
    booking: Object.fromEntries(BOOKING_STATUSES.map((s) => [s.value, s.label])),
    travel: Object.fromEntries(TRAVEL_STATUSES.map((s) => [s.value, s.label])),
    ticket: Object.fromEntries(TICKET_STATUSES.map((s) => [s.value, s.label])),
    invoice: Object.fromEntries(INVOICE_STATUSES.map((s) => [s.value, s.label])),
  }
  return statusMap[type][status] || status
}
