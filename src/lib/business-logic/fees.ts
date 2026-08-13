// ─── Fee Configuration ───────────────────────────────────────────────────────

export interface FeeConfig {
  portalFeePerPerson: number      // Default: Rp500.000
  subdomainFeePerPerson: number   // Default: Rp250.000
  customDomainFeePerPerson: number // Same as portal
  serviceFeePercent: number       // % of package price (default 3%)
  serviceFeeFlat: number          // Minimum flat fee (default Rp300.000)
  setupFee: number                // One-time registration fee
  taxPercent: number              // PPN (default 11%)
}

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  portalFeePerPerson: 500000,
  subdomainFeePerPerson: 250000,
  customDomainFeePerPerson: 500000,
  serviceFeePercent: 3,
  serviceFeeFlat: 300000,
  setupFee: 5000000,
  taxPercent: 11,
}

// ─── Channel Type ────────────────────────────────────────────────────────────

export type BookingChannel = "portal" | "subdomain" | "custom_domain"

// ─── Fee Calculation ─────────────────────────────────────────────────────────

export interface FeeBreakdown {
  platformFeePerPerson: number
  totalPlatformFee: number        // platformFee × pilgrimCount
  serviceFee: number              // max(packagePrice × %, flat)
  subtotal: number                // platformFee + serviceFee
  tax: number                     // subtotal × taxPercent
  total: number                   // subtotal + tax
  channel: BookingChannel
  pilgrimCount: number
}

export function calculatePlatformFee(
  channel: BookingChannel,
  pilgrimCount: number,
  config: FeeConfig = DEFAULT_FEE_CONFIG
): number {
  const feePerPerson =
    channel === "portal" ? config.portalFeePerPerson :
    channel === "custom_domain" ? config.customDomainFeePerPerson :
    config.subdomainFeePerPerson

  return feePerPerson * pilgrimCount
}

export function calculatePlatformFeePerPerson(
  channel: BookingChannel,
  config: FeeConfig = DEFAULT_FEE_CONFIG
): number {
  return channel === "portal" ? config.portalFeePerPerson :
         channel === "custom_domain" ? config.customDomainFeePerPerson :
         config.subdomainFeePerPerson
}

export function calculateServiceFee(
  packagePrice: number,
  pilgrimCount: number,
  config: FeeConfig = DEFAULT_FEE_CONFIG
): number {
  const percentFee = packagePrice * pilgrimCount * (config.serviceFeePercent / 100)
  return Math.max(percentFee, config.serviceFeeFlat)
}

export function calculateTotalFee(
  packagePrice: number,
  pilgrimCount: number,
  channel: BookingChannel,
  config: FeeConfig = DEFAULT_FEE_CONFIG
): FeeBreakdown {
  const platformFeePerPerson = calculatePlatformFeePerPerson(channel, config)
  const totalPlatformFee = platformFeePerPerson * pilgrimCount
  const serviceFee = calculateServiceFee(packagePrice, pilgrimCount, config)
  const subtotal = totalPlatformFee + serviceFee
  const tax = Math.round(subtotal * (config.taxPercent / 100))
  const total = subtotal + tax

  return {
    platformFeePerPerson,
    totalPlatformFee,
    serviceFee,
    subtotal,
    tax,
    total,
    channel,
    pilgrimCount,
  }
}

// ─── Promo on Fees ───────────────────────────────────────────────────────────

export interface FeePromo {
  code: string
  type: "fee_percent" | "fee_amount" | "fee_free"
  value: number           // percent or flat amount
  appliesTo: "platform_fee" | "service_fee" | "all"
  maxDiscount?: number
  minPilgrimCount?: number
  validFrom: string
  validUntil: string
  isActive: boolean
}

export function applyFeePromo(
  breakdown: FeeBreakdown,
  promo: FeePromo
): FeeBreakdown {
  if (!promo.isActive) return breakdown
  if (promo.minPilgrimCount && breakdown.pilgrimCount < promo.minPilgrimCount) return breakdown

  const updated = { ...breakdown }

  if (promo.appliesTo === "platform_fee" || promo.appliesTo === "all") {
    if (promo.type === "fee_percent") {
      const discount = Math.round(updated.totalPlatformFee * (promo.value / 100))
      const capped = promo.maxDiscount ? Math.min(discount, promo.maxDiscount) : discount
      updated.totalPlatformFee = Math.max(0, updated.totalPlatformFee - capped)
    } else if (promo.type === "fee_amount") {
      const discount = promo.value * breakdown.pilgrimCount
      updated.totalPlatformFee = Math.max(0, updated.totalPlatformFee - discount)
    } else if (promo.type === "fee_free") {
      updated.totalPlatformFee = 0
      updated.platformFeePerPerson = 0
    }
  }

  if (promo.appliesTo === "service_fee" || promo.appliesTo === "all") {
    if (promo.type === "fee_percent") {
      const discount = Math.round(updated.serviceFee * (promo.value / 100))
      const capped = promo.maxDiscount ? Math.min(discount, promo.maxDiscount) : discount
      updated.serviceFee = Math.max(0, updated.serviceFee - capped)
    } else if (promo.type === "fee_amount") {
      updated.serviceFee = Math.max(0, updated.serviceFee - promo.value)
    } else if (promo.type === "fee_free") {
      updated.serviceFee = 0
    }
  }

  updated.subtotal = updated.totalPlatformFee + updated.serviceFee
  updated.tax = Math.round(updated.subtotal * (DEFAULT_FEE_CONFIG.taxPercent / 100))
  updated.total = updated.subtotal + updated.tax

  return updated
}
