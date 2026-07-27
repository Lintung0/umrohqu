"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Plus, Tag, Target, Trash2, Edit, Eye, MousePointerClick } from "lucide-react"
import { formatRupiah } from "@/lib/constants"

interface PromoRow {
  id: string
  type: string
  value: number
  config: any
  active: boolean
  starts_at: string | null
  ends_at: string | null
}

export default function TravelPromotionsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [promos, setPromos] = useState<PromoRow[]>([])
  const [activeTab, setActiveTab] = useState<"promos" | "bidding">("promos")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!profile?.tenant_id) { setLoading(false); return }
      setTenantId(profile.tenant_id)

      const { data } = await supabase
        .from("promotions")
        .select("id, type, value, config, active, starts_at, ends_at")
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false })

      setPromos((data as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Promosi & Bidding</h1>
          <p className="text-muted-foreground mt-1">Kelola promo dan tingkatkan visibilitas paket</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          {activeTab === "promos" ? "Tambah Promo" : "Ajukan Bidding"}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("promos")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "promos" ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
          }`}
        >
          <Tag className="w-4 h-4 inline mr-1.5" />
          Promo
        </button>
        <button
          onClick={() => setActiveTab("bidding")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "bidding" ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
          }`}
        >
          <Target className="w-4 h-4 inline mr-1.5" />
          Bidding
        </button>
      </div>

      {activeTab === "promos" && (
        <div className="space-y-4">
          {promos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <Tag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Belum ada promo</p>
            </div>
          ) : promos.map((promo) => {
            const config = (promo.config || {}) as any
            return (
              <div key={promo.id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{config.title || promo.type}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${promo.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {promo.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {config.code && <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{config.code}</span>}
                      <span>Nilai: <strong>{promo.type === "discount_percent" ? `${promo.value}%` : formatRupiah(promo.value)}</strong></span>
                    </div>
                    {promo.starts_at && promo.ends_at && (
                      <p className="text-sm text-muted-foreground">
                        Berlaku: {new Date(promo.starts_at).toLocaleDateString("id-ID")} — {new Date(promo.ends_at).toLocaleDateString("id-ID")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="p-2 text-muted-foreground hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === "bidding" && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Fitur bidding akan segera tersedia</p>
        </div>
      )}
    </div>
  )
}
