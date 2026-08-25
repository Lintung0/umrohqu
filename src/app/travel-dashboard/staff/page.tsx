"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Search, UserPlus, Shield, Mail, Phone, X, Loader2, UserX, UserCheck } from "lucide-react"

interface StaffMember {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
  deleted_at: string | null
}

const ROLE_OPTIONS = [
  { value: "travel_operational", label: "Operasional", desc: "Akses terbatas (pesanan, jamaah)" },
  { value: "travel_finance", label: "Keuangan", desc: "Keuangan travel" },
  { value: "travel_admin", label: "Admin", desc: "Akses penuh (paket, keuangan, pengaturan)" },
]

function getRoleBadge(role: string) {
  switch (role) {
    case "travel_admin": return "bg-emerald-100 text-emerald-700"
    case "travel_operational": return "bg-blue-100 text-blue-700"
    case "travel_finance": return "bg-cyan-100 text-cyan-700"
    default: return "bg-gray-100 text-gray-600"
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "travel_admin": return "Admin"
    case "travel_operational": return "Operasional"
    case "travel_finance": return "Keuangan"
    default: return role
  }
}

export default function TravelStaffPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", phone: "", role: "travel_operational" })
  const [inviting, setInviting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
        .select("id, email, full_name, phone, role, created_at, deleted_at")
        .eq("tenant_id", profile.tenant_id)
        .in("role", ["travel_admin", "travel_operational", "travel_finance"])
        .order("created_at", { ascending: false })

      setStaff(staffData || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = staff.filter((s) => {
    const q = searchQuery.toLowerCase()
    const matchQuery = !q || s.email?.toLowerCase().includes(q) || s.full_name?.toLowerCase().includes(q) || s.phone?.includes(q)
    const matchRole = filterRole === "all" || s.role === filterRole
    const matchActive = showInactive ? true : !s.deleted_at
    return matchQuery && matchRole && matchActive
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
      if (error) { alert("Gagal: " + error.message); return }
      setStaff((prev) => [{
        id: crypto.randomUUID(),
        email: inviteForm.email,
        full_name: inviteForm.full_name,
        phone: inviteForm.phone || null,
        role: inviteForm.role,
        created_at: new Date().toISOString(),
        deleted_at: null,
      }, ...prev])
      setShowInvite(false)
      setInviteForm({ email: "", full_name: "", phone: "", role: "travel_operational" })
    } catch (e) {
      alert("Terjadi kesalahan")
    } finally {
      setInviting(false)
    }
  }

  const handleDeactivate = async (staffId: string) => {
    if (!confirm("Non-aktifkan akun staff ini? Mereka tidak bisa mengakses dashboard travel lagi.")) return
    setActionLoading(staffId)
    try {
      const now = new Date().toISOString()
      await supabase.from("users").update({ deleted_at: now }).eq("id", staffId)
      setStaff((prev) => prev.map((s) => s.id === staffId ? { ...s, deleted_at: now } : s))
    } catch (e) {
      alert("Gagal menonaktifkan akun")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async (staffId: string) => {
    setActionLoading(staffId)
    try {
      await supabase.from("users").update({ deleted_at: null }).eq("id", staffId)
      setStaff((prev) => prev.map((s) => s.id === staffId ? { ...s, deleted_at: null } : s))
    } catch (e) {
      alert("Gagal mengaktifkan kembali")
    } finally {
      setActionLoading(null)
    }
  }

  const activeCount = staff.filter((s) => !s.deleted_at).length
  const adminCount = staff.filter((s) => s.role === "travel_admin" && !s.deleted_at).length
  const staffCount = staff.filter((s) => s.role === "travel_operational" && !s.deleted_at).length
  const financeCount = staff.filter((s) => s.role === "travel_finance" && !s.deleted_at).length
  const inactiveCount = staff.filter((s) => s.deleted_at).length

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
          <p className="text-sm text-muted-foreground">Kelola karyawan travel Anda</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Aktif</p>
          <p className="text-2xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Admin</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{adminCount}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Operasional</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{staffCount}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Keuangan</p>
          <p className="text-2xl font-bold mt-1 text-cyan-600">{financeCount}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Nonaktif</p>
          <p className="text-2xl font-bold mt-1 text-red-500">{inactiveCount}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Semua Role</option>
            <option value="travel_admin">Admin</option>
            <option value="travel_operational">Operasional</option>
            <option value="travel_finance">Keuangan</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
            Tampilkan nonaktif
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada karyawan</p>
            <p className="text-xs text-muted-foreground/70">Klik &quot;Tambah Karyawan&quot; untuk mengundang anggota tim</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => {
              const isInactive = !!s.deleted_at
              return (
                <div key={s.id} className={`flex items-center gap-4 p-4 border rounded-xl transition-colors ${isInactive ? "border-red-100 bg-red-50/50 opacity-70" : "border-border hover:bg-zinc-50"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isInactive ? "bg-red-100 text-red-500" : "bg-emerald-100 text-emerald-700"}`}>
                    {(s.full_name || s.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{s.full_name || "-"}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getRoleBadge(s.role)}`}>
                        {getRoleLabel(s.role)}
                      </span>
                      {isInactive && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>
                      {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isInactive ? (
                      <button
                        onClick={() => handleReactivate(s.id)}
                        disabled={actionLoading === s.id}
                        title="Aktifkan kembali"
                        className="p-2 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        {actionLoading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivate(s.id)}
                        disabled={actionLoading === s.id}
                        title="Non-aktifkan akun"
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {actionLoading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Tambah Karyawan</h3>
              <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nama Lengkap *</label>
                <input type="text" value={inviteForm.full_name} onChange={(e) => setInviteForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Ahmad Fauzi" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email *</label>
                <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="ahmad@travel.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Telepon</label>
                <input type="tel" value={inviteForm.phone} onChange={(e) => setInviteForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="08123456789" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Role *</label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${inviteForm.role === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-zinc-50"}`}>
                      <input type="radio" name="role" value={opt.value} checked={inviteForm.role === opt.value}
                        onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
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
