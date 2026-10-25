// Daftar langkah progres per-layanan untuk fitur Tracking
// (dipakai API /api/tracking & seed saat booking dibuat)
export const TRACKING_STEP_DEFS = [
  { key: "payment", label: "Pembayaran", sort_order: 1 },
  { key: "participant_data", label: "Data Jemaah", sort_order: 2 },
  { key: "documents", label: "Dokumen & Visa", sort_order: 3 },
  { key: "hotel", label: "Pemesanan Hotel", sort_order: 4 },
  { key: "flight", label: "Tiket Pesawat", sort_order: 5 },
  { key: "manasik", label: "Manasik", sort_order: 6 },
  { key: "departure", label: "Keberangkatan", sort_order: 7 },
] as const

export type TrackingStepKey = (typeof TRACKING_STEP_DEFS)[number]["key"]
export type TrackingStepStatus = "pending" | "in_progress" | "completed"
