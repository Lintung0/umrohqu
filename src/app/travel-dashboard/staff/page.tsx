"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Search, UserPlus, Shield, Trash2, Mail, Phone, X, Loader2 } from "lucide-react"

interface StaffMember {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
}

export default function TravelStaffPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", phone: "", role: "travel_staff" as "travel_staff" | "travel_admin" })
  const [inviting, setInviting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!profile?.tenant_id) { setLoading(false); return }
      setTenantId(profile.tenant_id)

      const { data: staffData } = await supabase
        .from("users")
        .select("id, email, full_name, phone, role, created_at")
        .eq("tenant_id", profile.tenant_id)
        .in("role", ["travel_admin", "travel_staff"])
        .order("created_at", { ascending: false })

      setStaff(staffData || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = staff.filter((s) => {
    const q = searchQuery.toLowerCase()
    return !q || s.email?.toLowerCase().includes(q) || s.full_name?.toLowerCase().includes(q) || s.phone?.includes(q)
  })

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.full_name || !tenantId) return
    setInviting(true)

    try {
      const { error } = await supabase.from("users").insert({
        id: crypto.randomUUID(),
        email: inviteForm.email,
        full_name: inviteForm.full_name,
        phone: inviteForm.phone || null,
        role: inviteForm.role,
        tenant_id: tenantId,
        profile: {},
      })

      if (error) {
        console.error("Invite error:", error)
        alert("Gagal mengundang: " + error.message)
        setInviting(false)
        return
      }

      setStaff((prev) => [{
        id: crypto.randomUUID(),
        email: inviteForm.email,
        full_name: inviteForm.full_name,
        phone: inviteForm.phone || null,
        role: inviteForm.role,
        created_at: new Date().toISOString(),
      }, ...prev])

      setShowInvite(false)
      setInviteForm({ email: "", full_name: "", phone: "", role: "travel_staff" })
      alert("Berhasil menambahkan staff!")
    } catch (e) {
      console.error("Invite error:", e)
      alert("Terjadi kesalahan")
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (staffId: string) => {
    if (!confirm("Hapus staff ini dari tim?")) return
    setDeleting(staffId)

    try {
      await supabase.from("users").update({ tenant_id: null, role: "customer" }).eq("id", staffId)
      setStaff((prev) => prev.filter((s) => s.id !== staffId))
    } catch (e) {
      console.error("Remove error:", e)
    } finally {
      setDeleting(null)
    }
  }

  const adminCount = staff.filter((s) => s.role === "travel_admin").length
  const staffCount = staff.filter((s) => s.role === "travel_staff").length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tim Saya</h1>
          <p className="text-sm text-muted-foreground">Kelola staff travel Anda</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Staff
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Tim</p>
          <p className="text-2xl font-bold mt-1">{staff.length}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Admin</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{adminCount}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Staff</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{staffCount}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada staff</p>
            <p className="text-xs text-muted-foreground/70">Klik &quot;Tambah Staff&quot; untuk mengundang anggota tim</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-zinc-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                  {(s.full_name || s.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{s.full_name || "-"}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.role === "travel_admin" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {s.role === "travel_admin" ? "Admin" : "Staff"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>
                    {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(s.id)}
                  disabled={deleting === s.id}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {deleting === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Tambah Staff</h3>
              <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nama Lengkap *</label>
                <input
                  type="text"
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ahmad Fauzi"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="ahmad@travel.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Telepon</label>
                <input
                  type="tel"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role *</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as "travel_staff" | "travel_admin" }))}
                  className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="travel_staff">Staff — Akses terbatas (pesanan, jamaah)</option>
                  <option value="travel_admin">Admin — Akses penuh (paket, keuangan, settings)</option>
                </select>
              </div>
              <button
                onClick={handleInvite}
                disabled={!inviteForm.email || !inviteForm.full_name || inviting}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {inviting ? "Menambahkan..." : "Tambahkan ke Tim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}