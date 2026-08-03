"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah, formatRupiahInput, parseRupiahInput } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface Transaction {
  id: string
  type: "topup" | "payment" | "refund" | "withdrawal"
  amount: number
  balance_before: number
  balance_after: number
  status: "pending" | "success" | "failed"
  payment_method: string | null
  description: string | null
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  topup: "Topup",
  payment: "Pembayaran",
  refund: "Refund",
  withdrawal: "Penarikan",
}

const TYPE_ICON: Record<string, typeof ArrowUpRight> = {
  topup: ArrowDownLeft,
  payment: ArrowUpRight,
  refund: ArrowDownLeft,
  withdrawal: ArrowUpRight,
}

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  success: CheckCircle,
  pending: Clock,
  failed: XCircle,
}

const STATUS_CLASS: Record<string, string> = {
  success: "text-emerald-600 bg-emerald-50",
  pending: "text-amber-600 bg-amber-50",
  failed: "text-red-600 bg-red-50",
}

export default function WalletPage() {
  const { t } = useTranslation()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopup, setShowTopup] = useState(false)
  const [topupAmount, setTopupAmount] = useState(500000)
  const [topupDisplay, setTopupDisplay] = useState("500.000")
  const [topupLoading, setTopupLoading] = useState(false)
  const [topupUrl, setTopupUrl] = useState("")

  const supabase = createClient()

  const fetchData = async () => {
    const [balRes, txRes] = await Promise.all([
      fetch("/api/wallet/balance"),
      fetch("/api/wallet/transactions"),
    ])
    const bal = await balRes.json()
    const txs = await txRes.json()
    setBalance(bal.balance)
    setTransactions(txs.transactions || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      fetchData()
      window.history.replaceState({}, "", "/dashboard/wallet")
    }
  }, [])

  const handleTopup = async () => {
    setTopupLoading(true)
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: topupAmount }),
      })
      const data = await res.json()
      if (data.invoiceUrl) {
        setTopupUrl(data.invoiceUrl)
        window.open(data.invoiceUrl, "_blank")
      }
    } catch (err) {
      console.error(err)
    }
    setTopupLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  const quickAmounts = [100000, 250000, 500000, 1000000, 2500000, 5000000]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" /> Dompet Saya
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola saldo dan riwayat transaksi</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white">
        <p className="text-sm text-emerald-100/80 mb-1">Total Saldo</p>
        <p className="text-3xl font-bold mb-4">{formatRupiah(balance)}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTopup(true)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Topup
          </button>
        </div>
      </div>

      {/* Topup Modal */}
      {showTopup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Topup Saldo</h3>
              <button onClick={() => { setShowTopup(false); setTopupUrl("") }} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">Pilih nominal</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setTopupAmount(amt); setTopupDisplay(formatRupiahInput(amt)) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      topupAmount === amt
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-border hover:border-emerald-200"
                    }`}
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Nominal Lainnya</label>
              <input
                type="text"
                inputMode="numeric"
                value={topupDisplay}
                onChange={(e) => {
                  const raw = parseRupiahInput(e.target.value)
                  setTopupAmount(raw)
                  setTopupDisplay(raw > 0 ? formatRupiahInput(raw) : "")
                }}
                onFocus={() => { if (topupAmount === 0) setTopupDisplay("") }}
                onBlur={() => { if (!topupDisplay) setTopupDisplay(formatRupiahInput(topupAmount)) }}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {topupUrl && (
              <a
                href={topupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> {t.common.view} {t("booking.payment_info")}
              </a>
            )}

            <Button
              onClick={handleTopup}
              disabled={topupLoading || topupAmount < 10000}
              className="w-full h-11"
            >
              {topupLoading ? "Memproses..." : `Topup ${formatRupiah(topupAmount)}`}
            </Button>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div>
        <h2 className="font-semibold mb-3">Riwayat Transaksi</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-border">
            <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border divide-y divide-border">
            {transactions.map((tx) => {
              const Icon = TYPE_ICON[tx.type] || ArrowUpRight
              const StatusIcon = STATUS_ICON[tx.status] || Clock
              return (
                <div key={tx.id} className="flex items-center gap-3 p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.type === "topup" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tx.description || TYPE_LABEL[tx.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === "topup" ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.type === "topup" ? "+" : "-"}{formatRupiah(tx.amount)}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_CLASS[tx.status]}`}>
                      <StatusIcon className="w-3 h-3" />
                      {tx.status === "success" ? "Berhasil" : tx.status === "pending" ? "Menunggu" : "Gagal"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
