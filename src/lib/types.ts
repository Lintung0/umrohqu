export type AdminRole = "admin" | "finance" | "operational"

// ─── Enums Baru (Operasional Travel) ──────────────────────────────────────────
export type UserRole = "customer" | "admin" | "finance" | "operational" | "travel_admin" | "travel_operational" | "travel_finance" | "travel_agent" | "travel_muthawif"
export type AgentCommissionTrigger = "on_dp" | "on_paid" | "on_departure"
export type ManasikAttendanceStatus = "present" | "absent" | "excused"
export type EquipmentStatus = "pending" | "ready" | "distributed" | "returned"
export type RoomType = "single" | "double" | "triple" | "quad"

// ─── Database Row Types ────────────────────────────────────────────────────────
// These mirror the Supabase schema exactly (snake_case column names)

export interface Tenant {
  id: string
  name: string
  slug: string
  config: Record<string, unknown>
  status: "pending" | "active" | "grace_period" | "suspended" | "rejected" | "terminated"
  created_at: string
  updated_at: string
  deleted_at: string | null
  logo_url: string | null
  description: string | null
  brand_color: string | null
  is_verified: boolean
  is_featured: boolean
  founded_year: string | null
  applicant_name: string | null
  // ghost fields — not in DB columns, filled from related tables
  city?: string | null
  phone?: string | null
  contact_email?: string | null
  ppiu_number?: string | null
  accredited_at?: string | null
  total_jamaah?: number
  packages_count?: number
  website?: string | null
}

export interface User {
  id: string
  email: string
  phone: string | null
  full_name: string | null
  role: UserRole
  tenant_id: string | null
  branch_id: string | null
  profile: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Package {
  id: string
  tenant_id: string
  name: string
  slug: string
  description: string | null
  type: string
  price: number
  quota: number
  quota_taken: number | null
  available: number | null
  departure_date: string | null
  duration_nights: number | null
  itinerary: unknown[] | null
  includes: string[] | null
  excludes: string[] | null
  terms: string[] | null
  cancellation_policy: string | null
  is_shared_to_marketplace: boolean
  status: string
  min_dp_amount: number | null
  completed_at: string | null
  rating_avg: number | null
  rating_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  // ghost columns — not in DB, fallback optional
  airline?: string | null
  facilities?: string[] | null
  departure_cities?: string[] | null
  departure_month?: string | null
  original_price?: number | null
  cashback_amount?: number | null
  image_url?: string | null
  video_url?: string | null
  images?: string[] | null
  hotel_info?: Record<string, unknown> | null
  hotel_makkah?: string | null
  hotel_makkah_stars?: number | null
  hotel_madinah?: string | null
  hotel_madinah_stars?: number | null
  country?: string | null
  country_code?: string | null
  city?: string | null
}

export interface Booking {
  id: string
  tenant_id: string
  customer_id: string
  package_id: string
  package_departure_id: string | null
  agent_id: string | null
  referral_code: string | null
  booking_channel: string
  booking_code: string | null
  status: string
  pilgrim_count: number
  price: number
  total: number
  dp_type: string | null
  dp_amount: number | null
  remaining_amount: number | null
  remaining_due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // backward compatibility fields
  channel?: string
  price_per_person?: number
}

export interface BookingParticipant {
  id: string
  booking_id: string
  full_name: string
  national_id: string | null
  passport_number: string | null
  passport_expiry: string | null
  birth_date: string | null
  birth_place: string | null
  gender: string | null
  phone: string | null
  relation: string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  street: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  village: string | null
  district: string | null
  rt_rw: string | null
  created_at: string
}

export interface Promotion {
  id: string
  tenant_id: string | null
  type: string
  value: number
  config: Record<string, unknown>
  active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
  // added columns (migration 4)
  title: string | null
  code: string | null
  description: string | null
  discount_type: string | null
  discount_value: number | null
  min_booking: number | null
  valid_until: string | null
  is_active: boolean
  usage_count: number
  max_usage: number | null
}

export interface Bidding {
  id: string
  package_id: string
  tenant_id: string
  bid_value: number
  status: string
  created_at: string
  updated_at: string
  // added columns (migration 3)
  start_date: string | null
  end_date: string | null
  impressions: number
  clicks: number
  // added columns (migration 4)
  position: number | null
}

export interface Review {
  id: string
  booking_id: string
  customer_id: string
  tenant_id: string
  rating: number
  review: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_no: string
  booking_id: string
  tenant_id: string
  total: number
  status: string
  due_date: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  // added columns (migration 4)
  type: string | null
  description: string | null
  amount: number | null
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  category: string | null
  image_url: string | null
  author: string | null
  read_time: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CustomPage {
  id: string
  tenant_id: string
  url: string
  title: string
  content: unknown
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  // added columns (migration 4)
  page_type: string | null
  category: string | null
}

export interface WebsiteTemplate {
  id: string
  name: string
  config: Record<string, unknown>
  preview_url: string | null
  status: string
  created_at: string
  updated_at: string
  // added columns (migration 4)
  description: string | null
  category: string | null
  is_active: boolean
  used_by_count: number
}

export interface FeeConfig {
  id: string
  portal_fee_per_person: number
  subdomain_fee_per_person: number
  custom_domain_fee_per_person: number
  service_fee_percent: number
  service_fee_flat: number
  setup_fee: number
  tax_percent: number
  updated_at: string
}

export interface SupportTicket {
  id: string
  tenant_id: string | null
  user_id: string | null
  subject: string
  description: string | null
  category: string
  priority: string
  status: string
  created_at: string
  updated_at: string
}

export interface Payout {
  id: string
  tenant_id: string
  amount: number
  status: string
  period_start: string | null
  period_end: string | null
  paid_at: string | null
  created_at: string
}

export interface Wishlist {
  id: string
  user_id: string
  package_id: string
  created_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

// ─── Tabel Baru Operasional Travel (19 tabel) ──────────────────────────────────

// A. SDM, Mitra, & Struktur Cabang
export interface Branch {
  id: string
  tenant_id: string
  name: string
  city: string
  address: string
  phone: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  user_id: string
  branch_id: string | null
  referral_code: string
  commission_amount: number
  commission_trigger: AgentCommissionTrigger
  created_at: string
  updated_at: string
}

export interface Muthawif {
  id: string
  user_id: string
  branch_id: string | null
  certification_no: string | null
  specialization: string | null
  created_at: string
  updated_at: string
}

export interface AgentCommission {
  id: string
  agent_id: string
  booking_id: string
  amount: number
  status: "pending" | "paid" | "cancelled"
  trigger: AgentCommissionTrigger
  created_at: string
  updated_at: string
}

// B. Multi-Kota Keberangkatan & Akomodasi
export interface PackageDeparture {
  id: string
  package_id: string
  branch_id: string | null
  departure_city: string
  departure_date: string
  quota: number
  price_adjustment: number
  created_at: string
  updated_at: string
}

export interface Hotel {
  id: string
  tenant_id: string
  name: string
  city: string
  address: string
  facilities: string[] | null
  distance_to_haram_meters: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Airline {
  id: string
  name: string
  iata_code: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface PackageHotel {
  id: string
  package_id: string
  hotel_id: string
  check_in_date: string
  check_out_date: string
  night_count: number
  sort_order: number
  created_at: string
}

export interface PackageFlight {
  id: string
  package_id: string
  airline_id: string | null
  flight_type: "outbound" | "return"
  departure_city: string
  arrival_city: string
  departure_time: string
  arrival_time: string
  flight_number: string | null
  created_at: string
  updated_at: string
}

// C. Rooming & Bus (Plotting Lapangan)
export interface RoomTemplate {
  id: string
  package_id: string
  hotel_id: string | null
  room_number: string
  room_type: RoomType
  capacity: number
  floor: number | null
  created_at: string
  updated_at: string
}

export interface BusTemplate {
  id: string
  package_id: string
  bus_number: string
  capacity: number
  created_at: string
  updated_at: string
}

export interface BusSeat {
  id: string
  bus_template_id: string
  seat_number: string
  created_at: string
}

export interface RoomAssignment {
  id: string
  participant_id: string
  room_template_id: string
  location: "makkah" | "madinah"
  created_at: string
}

export interface SeatAssignment {
  id: string
  participant_id: string
  bus_seat_id: string
  created_at: string
}

// D. Bimbingan Manasik & Logistik Perlengkapan
export interface ManasikProgram {
  id: string
  package_id: string
  name: string
  lead_muthawif_id: string | null
  created_at: string
  updated_at: string
}

export interface ManasikSession {
  id: string
  program_id: string
  session_date: string
  start_time: string
  location: string
  muthawif_id: string | null
  materials_url: string | null
  created_at: string
  updated_at: string
}

export interface ManasikAttendance {
  id: string
  session_id: string
  participant_id: string
  status: ManasikAttendanceStatus
  created_at: string
}

export interface EquipmentTemplate {
  id: string
  package_id: string
  name: string
  requires_size: boolean
  size_options: string[] | null
  created_at: string
  updated_at: string
}

export interface ParticipantEquipment {
  id: string
  participant_id: string
  equipment_template_id: string
  size: string | null
  quantity: number
  status: EquipmentStatus
  created_at: string
  updated_at: string
}

// ─── Dashboard-friendly display types ──────────────────────────────────────────

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  avatar: string
}

export interface AdminInvoice {
  id: string
  invoice_no: string
  tenant_name: string
  total: number
  status: string
  due_date: string
  created_at: string
}
