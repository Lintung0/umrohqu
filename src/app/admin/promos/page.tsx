"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Tag, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface PromotionRow {
  id: string
  title: string
  description: string | null
  code: string
  discount_type: string
  discount_value: number
  min_booking: number | null
  valid_until: string | null
  is_active: boolean
  tenant_id: string | null
  usage_count: number | null
  max_usage: number | null
  tenants?: { name: string } | null
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromotionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("promotions")
      .select("id, title, description, code, discount_type, discount_value, min_booking, valid_until, is_active, tenant_id, usage_count, max_usage, tenants(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data || []).map((d: any) => ({
          ...d,
          tenants: Array.isArray(d.tenants) ? d.tenants[0] : d.tenants,
        }))
        setPromos(rows as PromotionRow[])
        setLoading(false)
      })
  }, [])

  const globalPromos = promos.filter((p) => !p.tenant_id)
  const travelPromos = promos.filter((p) => !!p.tenant_id)

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
          <h1 className="text-2xl font-bold">Promo & Diskon</h1>
          <p className="text-muted-foreground mt-1">Kelola promo dan diskon global untuk seluruh platform</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Tambah Promo
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Promo Global (UmrohQ)</h2>
        </div>
        <div className="divide-y divide-border">
          {globalPromos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Belum ada promo global</div>
          ) : (
            globalPromos.map((promo) => (
              <div key={promo.id} className="flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{promo.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${promo.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {promo.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{promo.code}</span>
                    <span>Diskon: <strong>{promo.discount_type === "discount_percent" ? `${promo.discount_value}%` : formatRupiah(promo.discount_value)}</strong></span>
                    {promo.min_booking && <span>Min booking: {formatRupiah(promo.min_booking)}</span>}
                    {promo.valid_until && <span>Berlaku hingga: {new Date(promo.valid_until).toLocaleDateString("id-ID")}</span>}
                  </div>
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

      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Promo Travel (per Agency)</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground mb-3">Travel dapat membuat promo khusus untuk paket mereka. Total: {travelPromos.length} promo aktif</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {travelPromos.map((promo) => (
              <div key={promo.id} className="border border-border rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{promo.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${promo.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {promo.is_active ? "Aktif" : "Off"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Kode: {promo.code} · Terpakai: {promo.usage_count || 0}/{promo.max_usage || "∞"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
