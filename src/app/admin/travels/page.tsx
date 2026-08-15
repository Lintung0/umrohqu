"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search, Eye, Check, X, Ban, Mail, Phone, MapPin, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { toast } from "sonner"

interface TenantRow {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
  config: any
  package_count?: number
  booking_count?: number
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  active: { label: "Aktif", color: "bg-green-100 text-green-700" },
  suspended: { label: "Ditangguhkan", color: "bg-red-100 text-red-700" },
  rejected: { label: "Ditolak", color: "bg-gray-100 text-gray-500" },
}

export default function AdminTravelsPage() {
  const supabase = createClient()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("tenants")
        .select("id, name, slug, custom_domain, contact_email, contact_phone, status, config")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      const tenantsList = (data as any) || []

      const counts = await Promise.all(
        tenantsList.map(async (t: any) => {
          const [pkgRes, bookRes] = await Promise.all([
            supabase.from("packages").select("id", { count: "exact", head: true }).eq("tenant_id", t.id).is("deleted_at", null),
            supabase.from("bookings").select("id", { count: "exact", head: true }).eq("tenant_id", t.id).is("deleted_at", null),
          ])
          return { ...t, package_count: pkgRes.count || 0, booking_count: bookRes.count || 0 }
        })
      )

      setTenants(counts)
      setLoading(false)
    }
    load()
  }, [])

  async function updateStatus(tenantId: string, newStatus: string) {
    setUpdatingId(tenantId)
    const { error } = await supabase.from("tenants").update({ status: newStatus }).eq("id", tenantId)
    if (error) {
      toast.error("Gagal mengubah status")
    } else {
      setTenants((prev) => prev.map((t) => t.id === tenantId ? { ...t, status: newStatus } : t))
      toast.success("Status travel diperbarui")
    }
    setUpdatingId(null)
  }

  const filtered = tenants.filter((t) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.slug.includes(q)
    const matchStatus = statusFilter === "all" || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = tenants.filter((t) => t.status === "active").length
  const pendingCount = tenants.filter((t) => t.status === "pending").length
  const suspendedCount = tenants.filter((t) => t.status === "suspended" || t.status === "rejected").length

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-56 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Akun Travel</h1>
        <p className="text-muted-foreground mt-1">Kelola seluruh akun travel yang terdaftar</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: tenants.length, color: "text-foreground" },
          { label: "Aktif", value: activeCount, color: "text-green-600" },
          { label: "Menunggu", value: pendingCount, color: "text-yellow-600" },
          { label: "Ditangguhkan", value: suspendedCount, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari travel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "active", "suspended", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "Semua" : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground">Tidak ada travel ditemukan</p>
          </div>
        ) : filtered.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-emerald-600">{tenant.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{tenant.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{tenant.slug}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[tenant.status]?.color || "bg-gray-100"}`}>
                {STATUS_MAP[tenant.status]?.label || tenant.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="font-bold">{tenant.package_count}</p>
                <p className="text-muted-foreground">Paket</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="font-bold">{tenant.booking_count}</p>
                <p className="text-muted-foreground">Pesan</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5">
              {tenant.contact_email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{tenant.contact_email}</p>}
              {tenant.contact_phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{tenant.contact_phone}</p>}
              <p className="flex items-center gap-1">🌐 {tenant.slug}.umrohq.com</p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              {tenant.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus(tenant.id, "active")}
                    disabled={updatingId === tenant.id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {updatingId === tenant.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Verifikasi
                  </button>
                  <button
                    onClick={() => updateStatus(tenant.id, "rejected")}
                    disabled={updatingId === tenant.id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-200 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Tolak
                  </button>
                </>
              )}
              {tenant.status === "active" && (
                <button
                  onClick={() => updateStatus(tenant.id, "suspended")}
                  disabled={updatingId === tenant.id}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-200 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" /> Tangguhkan
                </button>
              )}
              {(tenant.status === "suspended" || tenant.status === "rejected") && (
                <button
                  onClick={() => updateStatus(tenant.id, "active")}
                  disabled={updatingId === tenant.id}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Aktifkan Kembali
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
