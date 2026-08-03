"use client"

import { useEffect, useState } from "react"
import AdminSidebar from "@/components/dashboard/AdminSidebar"
import { createClient } from "@/lib/supabase/client"
import type { AdminRole } from "@/lib/types"

const ADMIN_ROLES: AdminRole[] = ["super_admin", "marketplace_admin", "marketplace_finance", "marketplace_operational"]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AdminRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      const userRole = (profile?.role || "") as AdminRole
      if (ADMIN_ROLES.includes(userRole)) {
        setRole(userRole)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!role) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Akses ditolak</p>
          <a href="/admin" className="text-emerald-600 text-sm hover:underline mt-2 inline-block">Kembali ke Admin</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar currentRole={role} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
