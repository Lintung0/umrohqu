"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Search, Phone, FileText, Users } from "lucide-react"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"

interface PilgrimRow {
  id: string
  full_name: string
  national_id: string | null
  passport_number: string | null
  gender: string | null
  phone: string | null
  relation: string
  booking_id: string
  booking_status: string
  package_name: string | null
}

export default function TravelPilgrimsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [pilgrims, setPilgrims] = useState<PilgrimRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!profile?.tenant_id) { setLoading(false); return }
      setTenantId(profile.tenant_id)

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, status, package:packages(name)")
        .eq("tenant_id", profile.tenant_id)
        .is("deleted_at", null)

      if (!bookings || bookings.length === 0) {
        setLoading(false)
        return
      }

      const bookingIds = bookings.map((b: any) => b.id)
      const { data: participantData } = await supabase
        .from("participants")
        .select("id, full_name, national_id, passport_number, gender, phone, relation, booking_id")
        .in("booking_id", bookingIds)

      const enriched = (participantData || []).map((p: any) => {
        const booking = bookings.find((b: any) => b.id === p.booking_id)
        return {
          ...p,
          booking_status: (booking as any)?.status || "unknown",
          package_name: (booking as any)?.package?.name || null,
        }
      })

      setPilgrims(enriched)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = pilgrims.filter((p) => {
    const q = searchQuery.toLowerCase()
    return !q || p.full_name.toLowerCase().includes(q) || p.passport_number?.toLowerCase().includes(q) || p.national_id?.includes(q)
  })

  const confirmedCount = pilgrims.filter((p) => p.booking_status === "confirmed").length
  const pendingCount = pilgrims.filter((p) => p.booking_status === "pending_payment").length

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Jamaah</h1>
        <p className="text-muted-foreground mt-1">Total {pilgrims.length} jamaah terdaftar · {confirmedCount} terkonfirmasi</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Jamaah", value: pilgrims.length, color: "bg-emerald-50 text-emerald-700" },
          { label: "Terkonfirmasi", value: confirmedCount, color: "bg-blue-50 text-blue-700" },
          { label: "Menunggu", value: pendingCount, color: "bg-yellow-50 text-yellow-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari nama, NIK, atau paspor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">NIK</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paspor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paket</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Tidak ada data jamaah</td>
                </tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.full_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.national_id || "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.passport_number || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{p.package_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.booking_status, "booking")}`}>
                      {getStatusLabel(p.booking_status, "booking")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {p.phone && (
                        <a href={`https://wa.me/${p.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded-lg transition-colors" title="Hubungi">
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
