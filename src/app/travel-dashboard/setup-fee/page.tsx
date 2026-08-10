"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle, CreditCard, ExternalLink } from "lucide-react"
import { formatRupiah } from "@/lib/constants"
import { DEFAULT_FEE_CONFIG } from "@/lib/business-logic/fees"

export default function SetupFeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [error, setError] = useState("")
  const [paid, setPaid] = useState(false)

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
        if (data.tenant.setup_fee_paid) {
          setPaid(true)
        }
      } catch {
        setError("Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function handlePay() {
    setPaying(true)
    try {
      const res = await fetch("/api/tenant/setup-fee", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Gagal membuat pembayaran")
        return
      }
      window.open(data.invoiceUrl, "_blank")
    } catch {
      setError("Gagal memproses pembayaran")
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (paid) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">Setup Fee Lunas!</h1>
          <p className="text-muted-foreground">
            Travel Anda sudah aktif. Silakan mulai kelola paket dan pesanan.
          </p>
          <button
            onClick={() => router.push("/travel-dashboard/packages")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold"
          >
            Kelola Paket
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aktivasi Travel</h1>
        <p className="text-muted-foreground mt-1">
          Bayar setup fee untuk mengaktifkan travel Anda di platform UmrahQuu
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border divide-y divide-border">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Rincian Setup Fee</h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nama Travel</span>
              <span className="font-medium">{tenant?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Setup Fee</span>
              <span className="font-semibold text-lg text-emerald-700">
                {formatRupiah(tenant?.setup_fee || DEFAULT_FEE_CONFIG.setupFee)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <h3 className="text-sm font-medium">Yang Anda dapatkan:</h3>
          <ul className="space-y-2">
            {[
              "Subdomain khusus travel Anda (misal: travelanda.umrohq.com)",
              "Website landing page travel dengan template profesional",
              "Akses ke dashboard travel untuk kelola paket & pesanan",
              "Sistem pembayaran online via Xendit",
              "Dukungan teknis 24/7",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
      >
        {paying ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ExternalLink className="w-5 h-5" />
        )}
        {paying ? "Memproses..." : "Bayar Setup Fee"}
      </button>
    </div>
  )
}
