"use client"

import { useState, useEffect } from "react"
import { Tag, Plus, Edit, Trash2, Percent, DollarSign, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface PromotionRow {
  id: string
  title: string
  code: string
  discount_type: string
  discount_value: number
  min_booking: number | null
  valid_until: string | null
  is_active: boolean
  tenant_id: string | null
}

export default function AdminBillingPromosPage() {
  const [promos, setPromos] = useState<PromotionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("promotions")
      .select("id, title, code, discount_type, discount_value, min_booking, valid_until, is_active, tenant_id")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPromos((data as PromotionRow[]) || [])
        setLoading(false)
      })
  }, [])

  const activePromos = promos.filter((p) => p.is_active)

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="bg-white rounded-2xl border border-border p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-5 border-b border-border last:border-0">
              <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
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
          <h1 className="text-2xl font-bold">Promo & Mekanisme Diskon</h1>
          <p className="text-muted-foreground mt-1">Kelola mekanisme diskon dari sisi billing</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Tambah Promo
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold">Mekanisme Diskon</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              <h3 className="font-medium text-sm">Persentase</h3>
            </div>
            <p className="text-xs text-muted-foreground">Diskon dalam bentuk persentase dari harga paket. Contoh: 10%, 20%, 50%</p>
          </div>
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-sm">Fixed Amount</h3>
            </div>
            <p className="text-xs text-muted-foreground">Diskon nominal tetap. Contoh: Rp500.000, Rp1.500.000 per orang</p>
          </div>
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-sm">Voucher Code</h3>
            </div>
            <p className="text-xs text-muted-foreground">Kode voucher yang dimasukkan saat checkout. Bisa dikombinasikan dengan tipe lain</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Promo Aktif ({activePromos.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {promos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Belum ada promo</div>
          ) : (
            promos.map((promo) => (
              <div key={promo.id} className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{promo.title}</h3>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{promo.code}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Diskon: {promo.discount_type === "discount_percent" ? `${promo.discount_value}%` : formatRupiah(promo.discount_value)} · Min: {promo.min_booking ? formatRupiah(promo.min_booking) : "-"} · Hingga: {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString("id-ID") : "-"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2 text-muted-foreground hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
