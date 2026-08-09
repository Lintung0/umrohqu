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
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // No session — middleware should have caught this, but if we're here
        // (e.g. post-Xendit redirect), let the page handle its own auth.
        // Don't block with "Akses ditolak" — the page uses API fallback.
        setAuthorized(true)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role === "customer") {
        setAuthorized(true)
      } else {
        // Wrong role — show access denied
        setAuthorized(false)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground font-medium">Akses ditolak</p>
          <p className="text-sm text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
          <a href="/" className="text-emerald-600 text-sm hover:underline inline-block">Kembali ke Beranda</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}