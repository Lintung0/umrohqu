"use client"

import { useState, useEffect } from "react"
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Loader2, ExternalLink, ArrowDownToLine } from "lucide-react"
import { formatRupiah, formatRupiahInput, parseRupiahInput } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface Transaction {
  id: string
  type: "topup" | "payment" | "refund" | "withdrawal" | "fee_deduction"
  amount: number
  balance_before: number
  balance_after: number
  status: "pending" | "success" | "failed"
  description: string | null
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  topup: "Topup",
  payment: "Pembayaran",
  refund: "Refund",
  withdrawal: "Penarikan",
  fee_deduction: "Fee Platform",
}

const TYPE_ICON: Record<string, typeof ArrowUpRight> = {
  topup: ArrowDownLeft,
  payment: ArrowUpRight,
  refund: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  fee_deduction: ArrowUpRight,
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

export default function TravelWalletPage() {
  const { t } = useTranslation()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopup, setShowTopup] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [topupAmount, setTopupAmount] = useState(500000)
  const [topupDisplay, setTopupDisplay] = useState("500.000")
  const [withdrawAmount, setWithdrawAmount] = useState(1000000)
  const [withdrawDisplay, setWithdrawDisplay] = useState("1.000.000")
  const [bankName, setBankName] = useState("BCA")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [topupLoading, setTopupLoading] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [topupUrl, setTopupUrl] = useState("")

  const fetchData = async () => {
    const [balRes, txRes] = await Promise.all([
      fetch("/api/wallet/balance"),
      fetch("/api/wallet/transactions"),
    ])
    if (balRes.ok) {
      const { balance } = await balRes.json()
      setBalance(balance)
    }
    if (txRes.ok) {
      const data = await txRes.json()
      setTransactions(data.transactions || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleTopup = async () => {
    setTopupLoading(true)
    setTopupUrl("")
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: topupAmount }),
      })
      const data = await res.json()
      if (res.ok) {
        setTopupUrl(data.invoiceUrl)
        window.open(data.invoiceUrl, "_blank")
        setTimeout(fetchData, 5000)
      }
    } finally {
      setTopupLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (withdrawAmount > balance) {
      alert("Saldo tidak mencukupi")
      return
    }
    setWithdrawLoading(true)
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: withdrawAmount, bankName, accountNumber, accountName }),
      })
      if (res.ok) {
        alert("Permintaan penarikan dana berhasil diajukan dan sedang diproses.")
        setShowWithdraw(false)
        fetchData()
      } else {
        const d = await res.json()
        alert(d.error || "Gagal mengajukan penarikan")
      }
    } finally {
      setWithdrawLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dompet Travel</h1>
          <p className="text-muted-foreground mt-1">Kelola saldo dan lihat histori transaksi</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowWithdraw(!showWithdraw); setShowTopup(false) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-white text-foreground rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Tarik Saldo
          </button>
          <button
            onClick={() => { setShowTopup(!showTopup); setShowWithdraw(false) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t.common.topup}
          </button>
        </div>
      </div>

      {/* Saldo Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 text-emerald-100 text-sm mb-4">
          <Wallet className="w-4 h-4" />
          Saldo Tersedia
        </div>
        <p className="text-4xl font-bold">{formatRupiah(balance)}</p>
      </div>

      {/* Withdraw Form */}
      {showWithdraw && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold">Tarik Saldo (Pencairan Dana)</h3>
          <p className="text-sm text-muted-foreground">
            Dana akan ditransfer ke rekening bank terdaftar dalam 1-2 hari kerja.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1.5">Jumlah Penarikan (Rp)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              max={balance}
              min={50000}
              className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Bank</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="BCA">BCA</option>
                <option value="Mandiri">Mandiri</option>
                <option value="BNI">BNI</option>
                <option value="BRI">BRI</option>
                <option value="BSI">BSI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">No. Rekening</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nama Pemilik Rekening</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="PT Travel Umroh"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading || withdrawAmount <= 0 || withdrawAmount > balance || !accountNumber || !accountName}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {withdrawLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "              {t.common.withdraw}"}
            </button>
          </div>
        </div>
      )}
      {showTopup && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold">Topup Saldo</h3>
          <p className="text-sm text-muted-foreground">
            Isi saldo dompet travel Anda. Minimal topup Rp 10.000.
          </p>
          <div className="flex gap-2 flex-wrap">
            {[100000, 300000, 500000, 1000000, 2000000, 5000000].map((amount) => (
              <button
                key={amount}
                onClick={() => { setTopupAmount(amount); setTopupDisplay(formatRupiahInput(amount)) }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  topupAmount === amount
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-50 border border-border text-muted-foreground hover:bg-gray-100"
                }`}
              >
                {formatRupiah(amount)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
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
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleTopup}
              disabled={topupLoading || topupAmount < 10000}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {topupLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Topup"
              )}
            </button>
          </div>
          {topupUrl && (
            <a
              href={topupUrl}
              target="_blank"
              className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.common.view} {t("booking.payment_info")}
            </a>
          )}
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold">Histori Transaksi</h3>
        </div>
        <div className="divide-y divide-border">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Belum ada transaksi
            </div>
          ) : (
            transactions.map((tx) => {
              const Icon = TYPE_ICON[tx.type] || ArrowUpRight
              const StatusIcon = STATUS_ICON[tx.status] || CheckCircle
              return (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{TYPE_LABEL[tx.type] || tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.description || "-"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{formatRupiah(tx.amount)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_CLASS[tx.status] || ""}`}>
                        <StatusIcon className="w-3 h-3" />
                        {tx.status === "success" ? "Berhasil" : tx.status === "pending" ? "Proses" : "Gagal"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
