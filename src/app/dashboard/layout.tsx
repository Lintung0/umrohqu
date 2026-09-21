"use client"

import { useEffect, useState } from "react"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import { createClient } from "@/lib/supabase/client"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      console.log("[DEBUG DASHBOARD LAYOUT] getUser result:", { userId: user?.id, email: user?.email, error: error?.message })

      if (!user) {
        console.log("[DEBUG DASHBOARD LAYOUT] No user session — allowing page to handle own auth via API fallback")
        setAuthorized(true)
        setLoading(false)
        return
      }

      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      console.log("[DEBUG DASHBOARD LAYOUT] Profile query:", { role: profile?.role, error: profileErr?.message })

      if (profile?.role === "customer" || profile?.role === "admin") {
        setAuthorized(true)
      } else {
        console.log("[DEBUG DASHBOARD LAYOUT] Role mismatch — expected customer/admin, got:", profile?.role)
        setAuthorized(false)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-ivory items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-emerald-dark border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat sesi autentikasi...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen bg-ivory items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground font-medium">Akses ditolak</p>
          <p className="text-sm text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
          <a href="/" className="text-emerald-dark text-sm hover:underline inline-block">Kembali ke Beranda</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pt-16 pb-20 lg:pt-0 lg:pb-0">{children}</main>
    </div>
  )
}