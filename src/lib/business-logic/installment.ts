import type { SupabaseClient } from "@supabase/supabase-js"

export interface InstallmentCalculation {
  tenorMonths: number
  downPaymentPercent: number
  downPaymentAmount: number
  remainingAmount: number
  monthlyAmount: number
  totalPrice: number
}

export interface PackageInstallmentOption {
  id: string
  package_id: string
  tenant_id: string
  tenor_months: number
  min_down_payment_percent: number
  min_down_payment_amount: number
  admin_fee: number
  is_active: boolean
}

/**
 * Hitung simulasi cicilan
 */
export function calculateInstallment(
  totalPrice: number,
  downPaymentPercent: number,
  tenorMonths: number
): InstallmentCalculation {
  const safeTenor = Math.max(1, tenorMonths || 24)
  const safeDpPct = Math.min(90, Math.max(10, downPaymentPercent || 20))
  const downPaymentAmount = Math.round((totalPrice * safeDpPct) / 100)
  const remainingAmount = Math.max(0, totalPrice - downPaymentAmount)
  const monthlyAmount = Math.round(remainingAmount / safeTenor)

  return {
    tenorMonths: safeTenor,
    downPaymentPercent: safeDpPct,
    downPaymentAmount,
    remainingAmount,
    monthlyAmount,
    totalPrice,
  }
}

/**
 * Ambil opsi cicilan paket dari database
 */
export async function getPackageInstallmentOptions(
  supabase: SupabaseClient,
  packageId: string
): Promise<PackageInstallmentOption[]> {
  try {
    const { data, error } = await supabase
      .from("package_installment_options")
      .select("*")
      .eq("package_id", packageId)
      .eq("is_active", true)
      .order("tenor_months", { ascending: true })

    if (error || !data || data.length === 0) {
      // Fallback default tenor jika belum diatur di database
      return [
        {
          id: "default-12",
          package_id: packageId,
          tenant_id: "",
          tenor_months: 12,
          min_down_payment_percent: 20,
          min_down_payment_amount: 0,
          admin_fee: 0,
          is_active: true,
        },
        {
          id: "default-24",
          package_id: packageId,
          tenant_id: "",
          tenor_months: 24,
          min_down_payment_percent: 20,
          min_down_payment_amount: 0,
          admin_fee: 0,
          is_active: true,
        },
        {
          id: "default-36",
          package_id: packageId,
          tenant_id: "",
          tenor_months: 36,
          min_down_payment_percent: 20,
          min_down_payment_amount: 0,
          admin_fee: 0,
          is_active: true,
        },
      ]
    }

    return data as PackageInstallmentOption[]
  } catch (err) {
    console.error("Error fetching installment options:", err)
    return []
  }
}

/**
 * Generate records untuk tabel invoices dan payment_schedules
 */
export function buildInstallmentInvoicesAndSchedules(params: {
  bookingId: string
  bookingCode: string
  tenantId: string
  customerId: string
  totalPrice: number
  downPaymentAmount: number
  remainingAmount: number
  tenorMonths: number
  participantId?: string | null
  participantName?: string | null
}) {
  const {
    bookingId,
    bookingCode,
    tenantId,
    customerId,
    downPaymentAmount,
    remainingAmount,
    tenorMonths,
    participantId,
    participantName,
  } = params

  const invoicesToInsert: Array<{
    invoice_number: string
    booking_id: string
    tenant_id: string
    customer_id: string
    amount: number
    status: "unpaid" | "paid"
    due_date: string
    participant_id: string | null
    installment_number: number
    invoice_type: "down_payment" | "installment"
  }> = []

  const now = new Date()

  // 1. Invoice Termin 0: Pembayaran Pertama / Uang Muka
  const codePrefix = bookingCode || bookingId.slice(0, 8).toUpperCase()
  invoicesToInsert.push({
    invoice_number: `INV-DP-${codePrefix}`,
    booking_id: bookingId,
    tenant_id: tenantId,
    customer_id: customerId,
    amount: downPaymentAmount,
    status: "unpaid",
    due_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    participant_id: participantId || null,
    installment_number: 0,
    invoice_type: "down_payment",
  })

  // 2. Invoice Termin 1..N: Cicilan Bulanan
  if (tenorMonths > 0 && remainingAmount > 0) {
    const baseMonthly = Math.floor(remainingAmount / tenorMonths)
    let remainder = remainingAmount - baseMonthly * tenorMonths

    for (let month = 1; month <= tenorMonths; month++) {
      // Tambahkan selisih pembulatan pada cicilan bulan terakhir agar total pas
      const amount = month === tenorMonths ? baseMonthly + remainder : baseMonthly

      // Jatuh tempo tiap 30 hari ke depan
      const dueDate = new Date(now.getTime() + month * 30 * 24 * 60 * 60 * 1000).toISOString()

      invoicesToInsert.push({
        invoice_number: `INV-C${month}-${codePrefix}`,
        booking_id: bookingId,
        tenant_id: tenantId,
        customer_id: customerId,
        amount,
        status: "unpaid",
        due_date: dueDate,
        participant_id: participantId || null,
        installment_number: month,
        invoice_type: "installment",
      })
    }
  }

  return { invoicesToInsert }
}
