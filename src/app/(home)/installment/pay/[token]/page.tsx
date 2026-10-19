"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Loader2, CheckCircle, AlertCircle, CreditCard, Calendar, ShieldCheck, Building2, ChevronRight, Copy } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { SNAP_SCRIPT_URL, MIDTRANS_CLIENT_KEY, vtWebUrl } from "@/lib/services/midtrans-client"
import { toast } from "sonner"
import Link from "next/link"

interface PublicInvoiceData {
  invoice: {
    id: string
    invoice_number: string
    installment_number: number
    invoice_type: string
    amount: number
    status: string
    due_date: string
    paid_at: string | null
    booking_id: string
  }
  booking: {
    id: string
    booking_code: string
    package?: {
      name: string
      slug: string
    }
    travel?: {
      name: string
      logo_url: string | null
    }
  }
  link: {
    expires_at: string
    used_at: string | null
  }
}

export default function PublicInstallmentPayPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = params?.token as string

  const [data, setData] = useState<PublicInvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [payerName, setPayerName] = useState("")
  const [payerEmail, setPayerEmail] = useState("")

  const loadData = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch(`/api/booking/public-invoice?token=${encodeURIComponent(token)}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Gagal memuat tagihan")
      } else {
        setData(json.data)
      }
    } catch {
      setError("Terjadi kesalahan jaringan")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Cek jika callback status sukses dari Midtrans
  useEffect(() => {
    if (searchParams?.get("status") === "success") {
      toast.success("Pembayaran berhasil dikonfirmasi!")
      loadData()
    }
  }, [searchParams, loadData])

  const handlePay = async () => {
    if (!token || !data) return
    setPaying(true)

    try {
      const res = await fetch("/api/booking/public-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          payerName: payerName.trim() || undefined,
          payerEmail: payerEmail.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.snap) {
        toast.error(json.error || "Gagal menyiapkan pembayaran")
        setPaying(false)
        return
      }

      const snapToken = json.snap.token

      // Load Midtrans Snap JS
      const loadSnapScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (typeof window !== "undefined" && (window as any).snap) {
            resolve()
            return
          }
          const script = document.createElement("script")
          script.src = SNAP_SCRIPT_URL
          script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY)
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Gagal memuat Snap JS"))
          document.body.appendChild(script)
        })
      }

      await loadSnapScript()

      // @ts-expect-error Snap types
      window.snap.pay(snapToken, {
        onSuccess: async function (result: any) {
          console.log("Public pay success:", result)
          toast.success("Pembayaran berhasil diterima!")
          loadData()
          setPaying(false)
        },
        onPending: async function (result: any) {
          console.log("Public pay pending:", result)
          toast.info("Silakan transfer ke nomor VA yang tertera.")
          loadData()
          setPaying(false)
        },
        onError: function (err: any) {
          console.error("Public pay error:", err)
          toast.error("Pembayaran gagal. Silakan coba lagi.")
          setPaying(false)
        },
        onClose: function () {
          setPaying(false)
        },
      })
    } catch (e: any) {
      toast.error(e?.message || "Terjadi kesalahan")
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-dark mb-3" />
        <p className="text-sm text-ivory-ink/70">Memuat rincian tagihan cicilan...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-ivory-card border border-red-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-emerald-deep">Tagihan Tidak Tersedia</h2>
          <p className="text-sm text-ivory-ink/70">{error || "Link pembayaran tidak valid atau telah kedaluwarsa."}</p>
          <Link
            href="/"
            className="inline-block bg-emerald-dark text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-deep transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  const { invoice, booking } = data
  const isPaid = invoice.status === "paid"
  const dueDateStr = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-"

  const invoiceLabel = invoice.installment_number === 0
    ? "Pembayaran Uang Muka"
    : `Cicilan Bulan ke-${invoice.installment_number}`

  return (
    <div className="min-h-screen bg-ivory py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/15 border border-gold/30 rounded-full text-xs font-semibold text-gold-dark">
            <ShieldCheck className="w-3.5 h-3.5" /> Portal Pembayaran Resmi
          </div>
          <h1 className="text-2xl font-bold text-emerald-deep mt-2">Tagihan Cicilan Umrah</h1>
          <p className="text-xs text-ivory-ink/70">Link pembayaran aman untuk jamaah & keluarga sponsor</p>
        </div>

        {/* Invoice Card */}
        <div className="bg-ivory-card border border-ivory-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Status Badge & Number */}
          <div className="flex items-center justify-between pb-4 border-b border-ivory-border/70">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-ivory-ink/60 font-medium block">Nomor Invoice</span>
              <span className="font-mono font-bold text-sm text-emerald-deep">{invoice.invoice_number}</span>
            </div>
            <div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-dark/10 text-emerald-dark">
                  <CheckCircle className="w-3.5 h-3.5" /> Lunas
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700">
                  <Calendar className="w-3.5 h-3.5" /> Menunggu Pembayaran
                </span>
              )}
            </div>
          </div>

          {/* Package & Travel Info */}
          <div className="space-y-3">
            <div className="bg-ivory p-4 rounded-2xl border border-ivory-border/60 space-y-2">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-dark shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-emerald-deep leading-tight">
                    {booking?.package?.name || "Paket Umrah"}
                  </h3>
                  <p className="text-xs text-ivory-ink/70 mt-0.5">
                    Travel: <span className="font-medium text-emerald-deep">{booking?.travel?.name || "Umrah Partner"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bill Details */}
            <div className="space-y-2.5 text-sm pt-2">
              <div className="flex justify-between items-center">
                <span className="text-ivory-ink/70">Kategori Tagihan</span>
                <span className="font-semibold text-emerald-deep">{invoiceLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ivory-ink/70">Jatuh Tempo</span>
                <span className="font-medium text-emerald-deep">{dueDateStr}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-ivory-border">
                <span className="font-semibold text-base text-emerald-deep">Total Tagihan</span>
                <span className="font-bold text-2xl text-emerald-dark">{formatRupiah(invoice.amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods Info */}
          {!isPaid && (
            <div className="bg-emerald-dark/5 border border-emerald-dark/15 rounded-2xl p-4 text-xs space-y-2 text-emerald-deep">
              <div className="flex items-center gap-2 font-semibold">
                <CreditCard className="w-4 h-4 text-emerald-dark" />
                Metode Pembayaran Tersedia
              </div>
              <p className="text-ivory-ink/70 leading-relaxed">
                Pembayaran didukung via <strong>Virtual Account Bank Transfer</strong> (BCA, Mandiri, BNI, BRI, Permata, CIMB Niaga) dan <strong>Kartu Kredit</strong>.
              </p>
            </div>
          )}

          {/* Payer Info Input (Optional) */}
          {!isPaid && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-emerald-deep">Informasi Pembayar (Opsional):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-ivory-ink/70 mb-1">Nama Pembayar</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 bg-ivory rounded-xl border border-ivory-border focus:outline-none focus:border-emerald-dark text-xs"
                  />
                </div>
                <div>
                  <label className="block text-ivory-ink/70 mb-1">Email Bukti Transfer</label>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="budi@gmail.com"
                    className="w-full px-3 py-2 bg-ivory rounded-xl border border-ivory-border focus:outline-none focus:border-emerald-dark text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div>
            {isPaid ? (
              <div className="text-center p-4 bg-emerald-dark/10 rounded-2xl border border-emerald-dark/20 text-emerald-deep">
                <p className="font-semibold text-sm">Tagihan ini telah dibayar lunas.</p>
                <p className="text-xs text-ivory-ink/70 mt-1">Terima kasih telah melakukan pembayaran cicilan tepat waktu.</p>
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full h-13 bg-emerald-dark hover:bg-emerald-deep text-white font-semibold rounded-2xl shadow-md shadow-emerald-deep/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyiapkan Pembayaran...
                  </>
                ) : (
                  <>
                    Bayar Tagihan Sekarang ({formatRupiah(invoice.amount)})
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-ivory-ink/60">
          Dilindungi oleh sistem keamanan gateway Midtrans • Transaksi terenkripsi 256-bit
        </p>
      </div>
    </div>
  )
}
