"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft, Wallet, CreditCard, Users, CheckCircle, AlertCircle, MapPin, Clock, Plane, Hotel, Shield, BadgeCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import type { Package, Tenant } from "@/lib/types"

const DP_OPTIONS = [30, 40, 50]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const packageId = searchParams.get("package")

  const [pkg, setPkg] = useState<Package | null>(null)
  const [travel, setTravel] = useState<Tenant | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; bookingId?: string; error?: string; balance?: number; need?: number; xendit?: { invoice_url: string } } | null>(null)

  const [pilgrimCount, setPilgrimCount] = useState(1)
  const [paymentType, setPaymentType] = useState<"full" | "dp">("full")
  const [dpPercentage, setDpPercentage] = useState(30)
  const [useWallet, setUseWallet] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!packageId) return
    async function fetchData() {
      const { data: pkgData } = await supabase
        .from("packages")
        .select("*, travel:tenants(*)")
        .eq("id", packageId)
        .single()

      if (!pkgData) return
      setPkg(pkgData as any)
      setTravel((pkgData as any).travel as Tenant || null)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user.id)
          .single()
        setWalletBalance(wallet?.balance || 0)
      }

      setLoading(false)
    }
    fetchData()
  }, [packageId])

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </main>
    )
  }

  if (!pkg) {
    return (
      <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-semibold">Paket tidak ditemukan</p>
          <Link href="/search"><Button variant="outline">Cari Paket Lain</Button></Link>
        </div>
      </main>
    )
  }

  const totalPrice = pkg.price * pilgrimCount
  const dpAmount = paymentType === "dp" ? Math.round(totalPrice * dpPercentage / 100) : totalPrice
  const remainingAmount = paymentType === "dp" ? totalPrice - dpAmount : 0
  const walletSufficient = walletBalance !== null && walletBalance >= dpAmount

  const handleSubmit = async () => {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          pilgrimCount,
          paymentType,
          dpPercentage: paymentType === "dp" ? dpPercentage : undefined,
          useWallet,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.xendit?.invoice_url) {
          window.location.href = data.xendit.invoice_url
        } else {
          setResult({ success: true, bookingId: data.booking_id })
          setTimeout(() => router.push(`/dashboard/bookings/${data.booking_id}`), 1500)
        }
      } else {
        setResult({ success: false, error: data.error, balance: data.balance, need: data.need })
      }
    } catch {
      setResult({ success: false, error: "Terjadi kesalahan jaringan" })
    }
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-primary">Cari Paket</Link>
          <span>/</span>
          <Link href={`/package/${pkg.slug}`} className="hover:text-primary">{pkg.name}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Checkout</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {result?.success ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Booking Berhasil!</h2>
            <p className="text-sm text-muted-foreground">Mengalihkan ke detail booking...</p>
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Package Summary */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="flex gap-4">
                <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0">
                  <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"} alt={pkg.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{travel?.name}</p>
                  <h3 className="font-semibold text-sm leading-snug">{pkg.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {pkg.duration_days && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration_days} Hari</span>}
                    {pkg.airline && <span className="flex items-center gap-1"><Plane className="w-3 h-3" />{pkg.airline}</span>}
                  </div>
                </div>
                <p className="text-lg font-bold text-primary">{formatRupiah(pkg.price)}<span className="text-xs text-muted-foreground font-normal">/org</span></p>
              </div>
            </div>

            {/* Pilgrim Count */}
            <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Jumlah Jamaah</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setPilgrimCount(Math.max(1, pilgrimCount - 1))} className="w-9 h-9 rounded-xl border border-border hover:bg-muted transition-colors font-bold text-lg">-</button>
                <span className="w-12 text-center font-bold text-lg">{pilgrimCount}</span>
                <button onClick={() => setPilgrimCount(Math.min(99, pilgrimCount + 1))} className="w-9 h-9 rounded-xl border border-border hover:bg-muted transition-colors font-bold text-lg">+</button>
              </div>
            </div>

            {/* Payment Type */}
            <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <label className="text-sm font-semibold">Tipe Pembayaran</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentType("full")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${paymentType === "full" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                >
                  <CheckCircle className={`w-5 h-5 mb-1 ${paymentType === "full" ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <p className="text-sm font-semibold">Bayar Lunas</p>
                  <p className="text-xs text-muted-foreground">Bayar penuh sekarang</p>
                </button>
                <button
                  onClick={() => setPaymentType("dp")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${paymentType === "dp" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                >
                  <Sparkles className={`w-5 h-5 mb-1 ${paymentType === "dp" ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <p className="text-sm font-semibold">DP (Cicil)</p>
                  <p className="text-xs text-muted-foreground">Bayar DP dulu, lunas nanti</p>
                </button>
              </div>

              {paymentType === "dp" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Besaran DP</p>
                  <div className="flex gap-2">
                    {DP_OPTIONS.map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setDpPercentage(pct)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          dpPercentage === pct ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border hover:border-emerald-200"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            {walletBalance !== null && (
              <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
                <label className="text-sm font-semibold">Metode Pembayaran</label>
                <button
                  onClick={() => setUseWallet(true)}
                  className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${useWallet ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                >
                  <Wallet className={`w-5 h-5 ${useWallet ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Dompet UmrohQ</p>
                    <p className={`text-xs ${walletSufficient ? "text-emerald-600" : "text-red-500"}`}>
                      Saldo: {formatRupiah(walletBalance)}
                      {!walletSufficient && ` (${formatRupiah(dpAmount - walletBalance)} kurang)`}
                    </p>
                  </div>
                  <CheckCircle className={`w-4 h-4 ${useWallet ? "text-emerald-600" : "text-muted-foreground/30"}`} />
                </button>
                <button
                  onClick={() => setUseWallet(false)}
                  className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${!useWallet ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                >
                  <CreditCard className={`w-5 h-5 ${!useWallet ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Transfer Bank / QRIS</p>
                    <p className="text-xs text-muted-foreground">Bayar via Xendit (BCA, Mandiri, BRI, QRIS)</p>
                  </div>
                  <CheckCircle className={`w-4 h-4 ${!useWallet ? "text-emerald-600" : "text-muted-foreground/30"}`} />
                </button>
              </div>
            )}

            {/* Error */}
            {result && !result.success && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {result.error}
              </div>
            )}

            {/* Summary */}
            <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-sm">Ringkasan Pembayaran</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga paket ({pilgrimCount} org)</span>
                  <span className="font-medium">{formatRupiah(totalPrice)}</span>
                </div>
                {paymentType === "dp" && (
                  <>
                    <div className="flex justify-between text-emerald-600">
                      <span>DP {dpPercentage}%</span>
                      <span className="font-bold">{formatRupiah(dpAmount)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sisa cicilan</span>
                      <span>{formatRupiah(remainingAmount)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-semibold">Dibayar sekarang</span>
                <span className="text-xl font-bold text-primary">{formatRupiah(dpAmount)}</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || (useWallet && !walletSufficient)}
              className="w-full h-12 text-base font-semibold"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Memproses...</>
              ) : (
                `Bayar ${formatRupiah(dpAmount)}`
              )}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}
