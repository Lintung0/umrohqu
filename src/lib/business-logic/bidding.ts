// ─── Bidding & Ranking System ─────────────────────────────────────────────────

export interface BiddingEntry {
  id: string
  travelId: string
  packageName: string
  bidValue: number               // Rp per day
  isActive: boolean
  startDate: string
  endDate: string
  impressions: number
  clicks: number
}

export interface RankingFactors {
  bidScore: number               // 0-100, from bidding
  rating: number                 // 0-5
  reviewCount: number
  totalBookings: number
  conversionRate: number         // clicks → bookings
  isVerified: boolean
  hasPromo: boolean
  sponsored: boolean
}

export interface RankedResult {
  travelId: string
  score: number
  factors: {
    bidWeight: number
    ratingWeight: number
    performanceWeight: number
    trustWeight: number
    promoBonus: number
  }
}

// ─── Weight Configuration ────────────────────────────────────────────────────

export interface RankingConfig {
  bidWeight: number              // Default 40%
  ratingWeight: number           // Default 25%
  performanceWeight: number      // Default 20%
  trustWeight: number            // Default 15%
  promoBonus: number             // +10 points if has promo
  sponsoredBonus: number         // +15 points if sponsored
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  bidWeight: 40,
  ratingWeight: 25,
  performanceWeight: 20,
  trustWeight: 15,
  promoBonus: 10,
  sponsoredBonus: 15,
}

// ─── Scoring Functions ───────────────────────────────────────────────────────

function normalizeBidScore(bidValue: number, maxBid: number): number {
  if (maxBid === 0) return 0
  return (bidValue / maxBid) * 100
}

function normalizeRating(rating: number): number {
  return (rating / 5) * 100
}

function normalizePerformance(totalBookings: number, maxBookings: number): number {
  if (maxBookings === 0) return 0
  return (totalBookings / maxBookings) * 100
}

function calculateTrustScore(isVerified: boolean, reviewCount: number): number {
  let score = 0
  if (isVerified) score += 60
  // More reviews = more trust, max 40 points
  score += Math.min(40, (reviewCount / 500) * 40)
  return score
}

// ─── Main Ranking Function ───────────────────────────────────────────────────

export function rankTravels(
  entries: {
    travelId: string
    factors: RankingFactors
  }[],
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): RankedResult[] {
  if (entries.length === 0) return []

  const maxBid = Math.max(...entries.map((e) => e.factors.bidScore))
  const maxBookings = Math.max(...entries.map((e) => e.factors.totalBookings))

  const results = entries.map((entry) => {
    const { factors } = entry

    const bidWeight = normalizeBidScore(factors.bidScore, maxBid) * (config.bidWeight / 100)
    const ratingWeight = normalizeRating(factors.rating) * (config.ratingWeight / 100)
    const performanceWeight = normalizePerformance(factors.totalBookings, maxBookings) * (config.performanceWeight / 100)
    const trustWeight = calculateTrustScore(factors.isVerified, factors.reviewCount) * (config.trustWeight / 100)

    let totalScore = bidWeight + ratingWeight + performanceWeight + trustWeight

    // Bonuses
    let promoBonus = 0
    let sponsoredBonus = 0
    if (factors.hasPromo) {
      promoBonus = config.promoBonus
      totalScore += config.promoBonus
    }
    if (factors.sponsored) {
      sponsoredBonus = config.sponsoredBonus
      totalScore += config.sponsoredBonus
    }

    return {
      travelId: entry.travelId,
      score: Math.round(totalScore * 100) / 100,
      factors: {
        bidWeight: Math.round(bidWeight * 100) / 100,
        ratingWeight: Math.round(ratingWeight * 100) / 100,
        performanceWeight: Math.round(performanceWeight * 100) / 100,
        trustWeight: Math.round(trustWeight * 100) / 100,
        promoBonus,
        sponsoredBonus,
      },
    }
  })

  return results.sort((a, b) => b.score - a.score)
}

// ─── Bid Position Helpers ────────────────────────────────────────────────────

export function getBidPosition(
  bidValue: number,
  allBids: number[]
): number {
  const sorted = [...allBids].sort((a, b) => b - a)
  const position = sorted.indexOf(bidValue) + 1
  return position || sorted.length + 1
}

export function isBidOutbid(
  myBid: number,
  allBids: number[]
): boolean {
  const maxOther = Math.max(...allBids.filter((b) => b !== myBid))
  return myBid < maxOther
}

// ─── CTR Calculation ─────────────────────────────────────────────────────────

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return Math.round((clicks / impressions) * 10000) / 100
}

export function estimateCTR(
  position: number,
  category: string = "umroh"
): number {
  // Industry average CTR by position
  const baseCTR: Record<number, number> = {
    1: 8.5,
    2: 6.2,
    3: 4.8,
    4: 3.5,
    5: 2.8,
  }
  return baseCTR[position] || 2.0
}
