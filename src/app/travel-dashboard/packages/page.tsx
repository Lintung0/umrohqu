"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { enrichPackagesWithCovers } from "@/lib/package-covers"
import { User } from "@supabase/supabase-js"
import { Plus, Search, Edit, Trash2, Eye, EyeOff, MoreHorizontal, Calendar, Hotel, Loader2, Package, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatRupiah } from "@/lib/utils"
import { PACKAGE_STATUS_BADGES } from "@/lib/constants"
import { toast } from "sonner"
import { getTravelTenantId } from "@/lib/get-travel-tenant"

interface TravelPackage {
  id: string
  name: string
  slug: string
  price: number
  quota: number
  status: string
  departure_city: string | null
  departure_date: string | null
  duration_nights: number | null
  airline: string | null
  hotel_info: any
  image_url: string | null
  doc_drive_link: string | null
}

export default function TravelPackagesPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [packages, setPackages] = useState<TravelPackage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "nonaktif" | "completed" | "ongoing">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setLoading(false); return }

      const tId = await getTravelTenantId(supabase, user.id)
      if (!tId) { setLoading(false); return }
      setTenantId(tId)

      const { data } = await supabase
        .from("packages")
        .select("*")
        .eq("tenant_id", tId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      const enriched = await enrichPackagesWithCovers(supabase, (data as any) || [])
      setPackages((enriched as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  // Realtime: refetch list when packages change
  useEffect(() => {
    if (!tenantId) return
    const channel = supabase
      .channel("td-packages-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "packages", filter: `tenant_id=eq.${tenantId}` },
        async () => {
          const { data } = await supabase
            .from("packages")
            .select("*")
            .eq("tenant_id", tenantId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
          const enriched = await enrichPackagesWithCovers(supabase, (data as any) || [])
          setPackages((enriched as any) || [])
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, supabase])

  async function toggleStatus(pkg: TravelPackage) {
    if (pkg.status !== "active" && pkg.status !== "nonaktif") return
    const newStatus = pkg.status === "active" ? "nonaktif" : "active"
    const { error } = await supabase.from("packages").update({ status: newStatus }).eq("id", pkg.id)
    if (error) {
      toast.error("Gagal mengubah status")
    } else {
      setPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, status: newStatus } : p))
      toast.success(`Paket ${newStatus === "active" ? "diaktifkan" : "dinonaktifkan"}`)
    }
  }

  async function saveDocLink(pkg: TravelPackage, link: string) {
    const { error } = await supabase.from("packages").update({ doc_drive_link: link.trim() || null }).eq("id", pkg.id)
    if (error) {
      toast.error("Gagal menyimpan link dokumentasi")
    } else {
      setPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, doc_drive_link: link.trim() || null } : p))
      toast.success("Link dokumentasi disimpan")
    }
  }

  async function deletePackage(pkg: TravelPackage) {
    if (!confirm(`Hapus paket "${pkg.name}"?`)) return
    const { error } = await supabase.from("packages").update({ deleted_at: new Date().toISOString() }).eq("id", pkg.id)
    if (error) {
      toast.error("Gagal menghapus paket")
    } else {
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id))
      toast.success("Paket dihapus")
    }
  }

  const filtered = packages.filter((pkg) => {
    const matchSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" ? true : pkg.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map((i) => <div key={i} className="h-72 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Paket Saya</h1>
        </div>
        <Link
          href="/travel-dashboard/packages/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Paket
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari paket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "nonaktif", "completed", "ongoing"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "Semua" : s === "active" ? "Aktif" : s === "nonaktif" ? "Nonaktif" : s === "completed" ? "Selesai" : "Berlangsung"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-border p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada paket</p>
            <Link href="/travel-dashboard/packages/new" className="text-sm text-emerald-600 hover:underline mt-2 inline-block">
              Buat paket baru
            </Link>
          </div>
        ) : filtered.map((pkg) => {
          const hotelInfo = (pkg.hotel_info || {}) as any
          return (
            <div key={pkg.id} className="bg-white rounded-2xl border border-border overflow-hidden group">
              <div className="relative h-40 overflow-hidden">
                {pkg.image_url ? (
                  <Image src={pkg.image_url} alt={pkg.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  {pkg.duration_nights && <span className="bg-white/90 backdrop-blur text-xs font-medium px-2 py-1 rounded-lg">{pkg.duration_nights} Hari</span>}
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${PACKAGE_STATUS_BADGES[pkg.status]?.className || "bg-gray-500 text-white"}`}>
                    {PACKAGE_STATUS_BADGES[pkg.status]?.label || pkg.status}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">{pkg.name}</h3>
                  {pkg.departure_city && <p className="text-xs text-muted-foreground mt-0.5">{pkg.departure_city}</p>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Harga per orang</p>
                    <p className="text-lg font-bold text-emerald-600">{formatRupiah(pkg.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Kuota</p>
                    <p className="text-sm font-semibold">{pkg.quota}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    <Link
                      href={`/travel-dashboard/packages/${pkg.slug}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Ubah
                    </Link>
                    {(pkg.status === "active" || pkg.status === "nonaktif") && (
                      <button
                        onClick={() => toggleStatus(pkg)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {pkg.status === "active" ? <><EyeOff className="w-3.5 h-3.5" /> Nonaktif</> : <><Eye className="w-3.5 h-3.5" /> Aktifkan</>}
                      </button>
                    )}
                    <button
                      onClick={() => deletePackage(pkg)}
                      className="px-3 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {pkg.status === "completed" && (
                    <div className="flex flex-col gap-1.5 bg-blue-50/60 border border-blue-100 rounded-xl p-2.5">
                      <label className="text-[11px] font-medium text-blue-700 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Link Dokumentasi (Google Drive) — opsional
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          defaultValue={pkg.doc_drive_link || ""}
                          onBlur={(e) => saveDocLink(pkg, e.target.value)}
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      {pkg.doc_drive_link && (
                        <a href={pkg.doc_drive_link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline">
                          Link tersimpan — buka ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
