// ─── Revenue Calculation Engine ───────────────────────────────────────────────

import { FeeBreakdown, BookingChannel, DEFAULT_FEE_CONFIG, FeeConfig } from "./fees"

export interface RevenueEntry {
  bookingId: string
  travelId: string
  packagePrice: number
  pilgrimCount: number
  channel: BookingChannel
  feeBreakdown: FeeBreakdown
  createdAt: string
  status: "confirmed" | "completed" | "cancelled" | "refunded"
}

export interface RevenueSummary {
  totalRevenue: number           // Total package price
  totalPlatformFee: number       // Total platform fee collected
  totalServiceFee: number        // Total service fee collected
  totalTax: number               // Total tax collected
  totalNetRevenue: number        // Platform fee + service fee + tax
  totalPilgrims: number
  totalBookings: number
  avgRevenuePerBooking: number
  avgRevenuePerPilgrim: number
  byChannel: {
    portal: { bookings: number; revenue: number; fee: number }
    subdomain: { bookings: number; revenue: number; fee: number }
    custom_domain: { bookings: number; revenue: number; fee: number }
  }
}

export interface TravelRevenue {
  travelId: string
  travelName: string
  totalRevenue: number
  totalBookings: number
  totalPilgrims: number
  avgPerBooking: number
  topPackage: string
}

// ─── Revenue Calculation ─────────────────────────────────────────────────────

export function calculateRevenueSummary(
  entries: RevenueEntry[]
): RevenueSummary {
  const confirmed = entries.filter((e) => e.status !== "cancelled" && e.status !== "refunded")

  const totalRevenue = confirmed.reduce((s, e) => s + e.packagePrice * e.pilgrimCount, 0)
  const totalPlatformFee = confirmed.reduce((s, e) => s + e.feeBreakdown.totalPlatformFee, 0)
  const totalServiceFee = confirmed.reduce((s, e) => s + e.feeBreakdown.serviceFee, 0)
  const totalTax = confirmed.reduce((s, e) => s + e.feeBreakdown.tax, 0)
  const totalNetRevenue = totalPlatformFee + totalServiceFee + totalTax
  const totalPilgrims = confirmed.reduce((s, e) => s + e.pilgrimCount, 0)
  const totalBookings = confirmed.length

  const byChannel = {
    portal: { bookings: 0, revenue: 0, fee: 0 },
    subdomain: { bookings: 0, revenue: 0, fee: 0 },
    custom_domain: { bookings: 0, revenue: 0, fee: 0 },
  }

  confirmed.forEach((e) => {
    byChannel[e.channel].bookings++
    byChannel[e.channel].revenue += e.packagePrice * e.pilgrimCount
    byChannel[e.channel].fee += e.feeBreakdown.totalPlatformFee + e.feeBreakdown.serviceFee
  })

  return {
    totalRevenue,
    totalPlatformFee,
    totalServiceFee,
    totalTax,
    totalNetRevenue,
    totalPilgrims,
    totalBookings,
    avgRevenuePerBooking: totalBookings > 0 ? Math.round(totalNetRevenue / totalBookings) : 0,
    avgRevenuePerPilgrim: totalPilgrims > 0 ? Math.round(totalNetRevenue / totalPilgrims) : 0,
    byChannel,
  }
}

// ─── Per-Travel Revenue ──────────────────────────────────────────────────────

export function calculateTravelRevenues(
  entries: RevenueEntry[],
  travelMap: Record<string, string>  // travelId → travelName
): TravelRevenue[] {
  const grouped: Record<string, RevenueEntry[]> = {}
  entries.forEach((e) => {
    if (!grouped[e.travelId]) grouped[e.travelId] = []
    grouped[e.travelId].push(e)
  })

  return Object.entries(grouped).map(([travelId, bookings]) => {
    const confirmed = bookings.filter((b) => b.status !== "cancelled")
    const totalRevenue = confirmed.reduce((s, b) => s + b.packagePrice * b.pilgrimCount, 0)
    const totalPilgrims = confirmed.reduce((s, b) => s + b.pilgrimCount, 0)

    // Find top package by count
    const packageCounts: Record<string, number> = {}
    confirmed.forEach((b) => {
      packageCounts[b.bookingId] = (packageCounts[b.bookingId] || 0) + 1
    })

    return {
      travelId,
      travelName: travelMap[travelId] || travelId,
      totalRevenue,
      totalBookings: confirmed.length,
      totalPilgrims,
      avgPerBooking: confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0,
      topPackage: Object.keys(packageCounts)[0] || "-",
    }
  }).sort((a, b) => b.totalRevenue - a.totalRevenue)
}

// ─── Monthly Revenue ─────────────────────────────────────────────────────────

export function calculateMonthlyRevenue(
  entries: RevenueEntry[]
): { month: string; revenue: number; bookings: number; pilgrims: number }[] {
  const monthly: Record<string, { revenue: number; bookings: number; pilgrims: number }> = {}

  entries
    .filter((e) => e.status !== "cancelled")
    .forEach((e) => {
      const month = e.createdAt.slice(0, 7) // YYYY-MM
      if (!monthly[month]) monthly[month] = { revenue: 0, bookings: 0, pilgrims: 0 }
      monthly[month].revenue += e.feeBreakdown.totalPlatformFee + e.feeBreakdown.serviceFee
      monthly[month].bookings++
      monthly[month].pilgrims += e.pilgrimCount
    })

  return Object.entries(monthly)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
