import type { SupabaseClient } from "@supabase/supabase-js"
import { getFeeConfig } from "./fee-config"
import { calculateTotalFee, type BookingChannel } from "./fees"

/**
 * Credit the platform commission (net amount owed to the travel) into the
 * travel's deposit wallet when a booking payment succeeds.
 *
 * Under the Direct Merchant model the platform does NOT custody customer funds,
 * but we still accrue the travel's net commission in `travel_deposits` (per the
 * new schema) and record a ledger entry in `deposit_mutations`.
 */
export async function creditTravelCommission(
  admin: SupabaseClient,
  params: {
    tenantId: string
    bookingId: string
    packagePrice: number
    pilgrimCount: number
    channel: BookingChannel
    actorUserId: string | null
  },
): Promise<{ platformFee: number; netCommission: number }> {
  const { tenantId, bookingId, packagePrice, pilgrimCount, channel, actorUserId } = params

  const feeConfig = await getFeeConfig(admin)
  const breakdown = calculateTotalFee(packagePrice, pilgrimCount, channel, feeConfig)

  // Get or create the travel deposit wallet.
  const { data: deposit } = await admin
    .from("travel_deposits")
    .select("id, balance")
    .eq("travel_id", tenantId)
    .maybeSingle()

  const now = new Date().toISOString()
  let depositId: string | null = deposit?.id || null
  let balanceBefore = Number(deposit?.balance ?? 0)

  if (!depositId) {
    const { data: created } = await admin
      .from("travel_deposits")
      .insert({
        travel_id: tenantId,
        balance: 0,
        minimum_balance: 0,
        status: "active",
      })
      .select("id, balance")
      .single()
    if (created) {
      depositId = created.id
      balanceBefore = Number(created.balance ?? 0)
    }
  }

  if (!depositId) {
    return { platformFee: breakdown.totalPlatformFee, netCommission: 0 }
  }

  const netCommission = breakdown.total
  const balanceAfter = balanceBefore + netCommission

  await admin
    .from("travel_deposits")
    .update({ balance: balanceAfter, updated_at: now })
    .eq("id", depositId)

  await admin.from("deposit_mutations").insert({
    deposit_id: depositId,
    amount: netCommission,
    type: "commission",
    reference_id: bookingId,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: "Komisi penjualan paket",
    created_by: actorUserId,
  })

  return { platformFee: breakdown.totalPlatformFee, netCommission }
}
