"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import TravelDashboardSidebar from "@/components/dashboard/TravelDashboardSidebar"
import { createClient } from "@/lib/supabase/client"

export default function TravelDashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (["travel_admin", "travel_operational", "travel_finance"].includes(profile?.role)) {
        setAuthorized(true)
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

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
        <div className="text-center">
          <p className="text-muted-foreground">Akses ditolak</p>
          <a href="/" className="text-emerald-600 text-sm hover:underline mt-2 inline-block">Kembali ke Beranda</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TravelDashboardSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}