"use client"

import { useState, useEffect } from "react"
import { Search, Shield, ShieldAlert, UserCog, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"

const ROLES = [
  { value: "all", label: "Semua Role" },
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Finance" },
  { value: "operational", label: "Operational" },
  { value: "travel_admin", label: "Travel Admin" },
  { value: "travel_operational", label: "Travel Operational" },
  { value: "travel_finance", label: "Travel Finance" },
  { value: "customer", label: "Customer" },
]

const ROLE_BADGES: Record<string, { icon: any; class: string }> = {
  admin: { icon: ShieldAlert, class: "bg-red-100 text-red-700" },
  finance: { icon: UserCog, class: "bg-amber-100 text-amber-700" },
  operational: { icon: UserCog, class: "bg-blue-100 text-blue-700" },
  travel_admin: { icon: Shield, class: "bg-emerald-100 text-emerald-700" },
  travel_operational: { icon: UserCog, class: "bg-teal-100 text-teal-700" },
  travel_finance: { icon: UserCog, class: "bg-cyan-100 text-cyan-700" },
  customer: { icon: UserCog, class: "bg-gray-100 text-gray-700" },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fetchUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams({ role: roleFilter, page: String(page), limit: "50" })
    if (search) params.set("search", search)
    const res = await fetch(`/api/admin/users?${params}`)
    const json = await res.json()
    if (json.data) setUsers(json.data)
    if (json.count) setTotal(json.count)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [roleFilter, page])

  const updateRole = async (userId: string, newRole: string) => {
    setSaving(userId)
    setError("")
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role: newRole }),
    })
    const json = await res.json()
    if (json.error) setError(json.error)
    else await fetchUsers()
    setSaving(null)
  }

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Total {total} pengguna terdaftar</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              placeholder="Cari nama atau email..."
              className="w-full border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <Button variant="outline" onClick={fetchUsers} size="sm" className="gap-1.5">
            <Search className="w-4 h-4" /> Cari
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <UserCog className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-semibold">Tidak ada pengguna</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground uppercase">Nama</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground uppercase">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground uppercase">Role</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground uppercase">Travel</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground uppercase">Bergabung</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const badge = ROLE_BADGES[u.role] || ROLE_BADGES.customer
                    const BadgeIcon = badge.icon
                    return (
                      <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-emerald-600">{u.full_name?.charAt(0) || "?"}</span>
                            </div>
                            <span className="font-medium">{u.full_name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${badge.class}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {ROLES.find(r => r.value === u.role)?.label || u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{u.tenant?.name || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs ${u.status === "active" ? "text-emerald-600" : "text-red-500"}`}>
                            {u.status === "active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {u.status || "active"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value)}
                            disabled={saving === u.id}
                            className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                          >
                            {ROLES.filter(r => r.value !== "all").map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
