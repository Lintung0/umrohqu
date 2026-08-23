"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Shield, Check, X, Building2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TenantPending {
  id: string
  name: string
  slug: string
  contact_email: string | null
  contact_phone: string | null
  status: string
  created_at: string
}

export default function AdminVerificationPage() {
  const supabase = createClient()
  const [tenants, setTenants] = useState<TenantPending[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("tenants").select("id, name, slug, status, created_at").is("deleted_at", null).order("created_at", { ascending: false })
      setTenants((data as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    const { error } = await supabase.from("tenants").update({ status }).eq("id", id)
    if (error) {
      toast.error("Gagal mengubah status")
    } else {
      setTenants((prev) => prev.map((t) => t.id === id ? { ...t, status } : t))
      toast.success("Status diperbarui")
    }
    setUpdatingId(null)
  }

  const pending = tenants.filter((t) => t.status === "pending")
  const activeCount = tenants.filter((t) => t.status === "active").length
  const rejectedCount = tenants.filter((t) => t.status === "rejected").length

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
      <div>
        <h1 className="text-2xl font-bold">Verifikasi Travel</h1>
        <p className="text-muted-foreground mt-1">Verifikasi dokumen dan data travel yang mendaftar</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Menunggu", value: pending.length, color: "bg-yellow-50 text-yellow-700" },
          { label: "Aktif", value: activeCount, color: "bg-green-50 text-green-700" },
          { label: "Ditolak", value: rejectedCount, color: "bg-red-50 text-red-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Menunggu Verifikasi</h2>
        {pending.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Semua travel sudah terverifikasi</p>
          </div>
        )}
        {pending.map((travel) => (
          <div key={travel.id} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-emerald-600">{travel.name.charAt(0)}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-semibold">{travel.name}</h3>
                  <p className="text-sm text-muted-foreground">{travel.contact_email} · {travel.contact_phone}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Subdomain</p>
                    <p className="font-medium">{travel.slug}.umrohq.com</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Tanggal Daftar</p>
                    <p className="font-medium">{new Date(travel.created_at).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium text-yellow-600">Menunggu</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => updateStatus(travel.id, "active")} disabled={updatingId === travel.id} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    {updatingId === travel.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Setujui
                  </button>
                  <button onClick={() => updateStatus(travel.id, "rejected")} disabled={updatingId === travel.id} className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
                    <X className="w-4 h-4" /> Tolak
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
