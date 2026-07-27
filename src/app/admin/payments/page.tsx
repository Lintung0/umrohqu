"use client"

import { useState, useEffect } from "react"
import { CreditCard, Download, Clock, Loader2 } from "lucide-react"
import Image from "next/image"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface TenantRow {
  id: string
  name: string
  logo_url: string | null
  status: string
  total_revenue: number
}

interface PayoutRow {
  id: string
  tenant_id: string
  amount: number
  status: string
  created_at: string
  tenants?: { name: string; logo_url: string | null } | null
}

export default function AdminPaymentsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const fetch = async () => {
      const { data: tnts } = await supabase
        .from("tenants")
        .select("id, name, logo_url, status, total_revenue")
        .is("deleted_at", null)

      setTenants((tnts as TenantRow[]) || [])

      const { data: p } = await supabase
        .from("payouts")
        .select("id, tenant_id, amount, status, created_at, tenants(name, logo_url)")
        .order("created_at", { ascending: false })

      const payoutRows = (p || []).map((d: any) => ({
        ...d,
        tenants: Array.isArray(d.tenants) ? d.tenants[0] : d.tenants,
      }))
      setPayouts(payoutRows as PayoutRow[])
      setLoading(false)
    }
    fetch()
  }, [])

  const verifiedTravels = tenants.filter((t) => t.status === "verified")

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4">
              <div className="h-6 bg-muted rounded animate-pulse w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pembayaran Travel</h1>
          <p className="text-muted-foreground mt-1">Kelola pembayaran dan payout ke travel</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <CreditCard className="w-4 h-4" />
          Proses Payout
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-emerald-600">{formatRupiah(verifiedTravels.reduce((s, t) => s + (t.total_revenue || 0), 0))}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Revenue Travel</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-blue-600">{verifiedTravels.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Travel Aktif</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-amber-600">1 & 15</p>
          <p className="text-xs text-muted-foreground mt-0.5">Jadwal Payout</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Riwayat Payout</h2>
          <button className="text-sm text-emerald-600 hover:underline flex items-center gap-1"><Download className="w-4 h-4" /> Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Travel</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Periode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Revenue</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service Fee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Net Payout</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((payout) => {
                const tenantName = (payout.tenants as any)?.name || "-"
                const tenantLogo = (payout.tenants as any)?.logo_url
                const serviceFee = Math.round(payout.amount * 0.003)
                return (
                  <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tenantLogo ? (
                          <Image src={tenantLogo} alt={tenantName} width={28} height={28} className="rounded-lg" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{tenantName.charAt(0)}</span>
                          </div>
                        )}
                        <span className="font-medium">{tenantName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">-</td>
                    <td className="px-4 py-3">{formatRupiah(payout.amount)}</td>
                    <td className="px-4 py-3 text-red-500">-{formatRupiah(serviceFee)}</td>
                    <td className="px-4 py-3 font-semibold">{formatRupiah(payout.amount - serviceFee)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        payout.status === "completed" ? "bg-green-100 text-green-700" :
                        payout.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        <Clock className="w-3 h-3" /> {payout.status === "completed" ? "Selesai" : payout.status === "pending" ? "Pending" : payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(payout.created_at).toLocaleDateString("id-ID")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
