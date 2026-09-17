"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle, Building2 } from "lucide-react"

export default function SetupFeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<{ name: string; status: string; is_verified: boolean } | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tenant/setup-fee")
        if (!res.ok) {
          const data = await res.json()
          if (res.status === 401) {
            router.push("/login")
            return
          }
          setError(data.error || "Gagal memuat data")
          return
        }
        const data = await res.json()
        setTenant(data.tenant)
      } catch {
        setError("Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  const active = tenant?.status === "active"

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Status Aktivasi Travel</h1>
        <p className="text-muted-foreground mt-1">
          Status akun travel Anda di platform UmrahQuu
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold">Profil Travel</h2>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Nama Travel</span>
            <span className="font-medium">{tenant?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            {active ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                <AlertCircle className="w-4 h-4" /> Menunggu Verifikasi
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push("/travel-dashboard/packages")}
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
      >
        Kelola Paket
      </button>
    </div>
  )
}
