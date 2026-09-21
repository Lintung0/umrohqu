"use client"

import { useState, useEffect } from "react"
import { Receipt, Info, Save, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FeeConfigRow {
  service_fee_percent: number
  service_fee_flat: number
}

interface BookingRow {
  id: string
  total: number
  status: string
}

export default function AdminServiceFeesPage() {
  const [configId, setConfigId] = useState<string | null>(null)
  const [percent, setPercent] = useState(2)
  const [flatFee, setFlatFee] = useState(250000)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const fetch = async () => {
      const { data: feeConfig } = await supabase
        .from("fee_config")
        .select("id, service_fee_percent, service_fee_flat")
        .limit(1)
        .single()

      if (feeConfig) {
        setConfigId(feeConfig.id)
        setPercent((feeConfig as any).service_fee_percent || 2)
        setFlatFee((feeConfig as any).service_fee_flat || 250000)
      }

      const { data: bkgs } = await supabase
        .from("bookings")
        .select("id, total, status")
        .is("deleted_at", null)

      setBookings((bkgs as BookingRow[]) || [])
      setLoading(false)
    }
    fetch()
  }, [])

  async function handleSave() {
    if (!configId) {
      toast.error("Konfigurasi fee tidak ditemukan")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("fee_config")
      .update({ service_fee_percent: percent, service_fee_flat: flatFee })
      .eq("id", configId)
    setSaving(false)
    if (error) {
      toast.error("Gagal menyimpan: " + error.message)
    } else {
      toast.success("Konfigurasi fee berhasil disimpan")
    }
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const paidBookings = bookings.filter((b) => b.status === "confirmed")
  const monthBookings = bookings.filter((b) => {
    const created = new Date(b.id ? b.id : Date.now())
    return b.status === "confirmed"
  })
  const totalServiceFee = paidBookings.reduce((s, b) => s + Math.max(b.total * (percent / 100), flatFee), 0)

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="bg-white rounded-2xl border border-border p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse w-full mb-3" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service Fee Transaksi</h1>
        <p className="text-muted-foreground mt-1">Kelola biaya layanan per transaksi</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold">Konfigurasi Service Fee</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1.5">Persen (%)</label>
            <input
              type="number"
              step="0.1"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Flat Fee Minimum (Rp)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rp</span>
              <input
                type="number"
                value={flatFee}
                onChange={(e) => setFlatFee(Number(e.target.value))}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Fee = max({percent}% dari total, {formatRupiah(flatFee)}). Jika hasil persen lebih kecil dari flat fee, maka flat fee yang dikenakan.</span>
        </div>

        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="font-semibold mb-3">Estimasi Service Fee</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold">{paidBookings.length}</p>
            <p className="text-xs text-muted-foreground">Pesanan Terbayar</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalServiceFee)}</p>
            <p className="text-xs text-muted-foreground">Total Biaya Layanan</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold">{formatRupiah(paidBookings.length > 0 ? Math.round(totalServiceFee / paidBookings.length) : 0)}</p>
            <p className="text-xs text-muted-foreground">Rata-rata per Pesanan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
